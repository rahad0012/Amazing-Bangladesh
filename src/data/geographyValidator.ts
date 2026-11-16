/**
 * Strict Administrative Geography Validator for Bangladesh
 * Validates the 8 Official Divisions and 64 Official Districts,
 * checks duplicate IDs/slugs, enforces verified division-district relationships,
 * and produces a pre-import Validation Report.
 */

import type { Division, District } from './bangladeshData.ts';

export interface CanonicalDivisionSpec {
  id: string;
  name_en: string;
  name_bn: string;
  slug: string;
  expectedDistrictCount: number;
}

export const CANONICAL_DIVISIONS_SPEC: ReadonlyArray<CanonicalDivisionSpec> = [
  { id: 'dhaka', name_en: 'Dhaka', name_bn: 'ঢাকা', slug: 'dhaka', expectedDistrictCount: 13 },
  { id: 'chattogram', name_en: 'Chattogram', name_bn: 'চট্টগ্রাম', slug: 'chattogram', expectedDistrictCount: 11 },
  { id: 'rajshahi', name_en: 'Rajshahi', name_bn: 'রাজশাহী', slug: 'rajshahi', expectedDistrictCount: 8 },
  { id: 'khulna', name_en: 'Khulna', name_bn: 'খুলনা', slug: 'khulna', expectedDistrictCount: 10 },
  { id: 'barishal', name_en: 'Barishal', name_bn: 'বরিশাল', slug: 'barishal', expectedDistrictCount: 6 },
  { id: 'sylhet', name_en: 'Sylhet', name_bn: 'সিলেট', slug: 'sylhet', expectedDistrictCount: 4 },
  { id: 'rangpur', name_en: 'Rangpur', name_bn: 'রংপুর', slug: 'rangpur', expectedDistrictCount: 8 },
  { id: 'mymensingh', name_en: 'Mymensingh', name_bn: 'ময়মনসিংহ', slug: 'mymensingh', expectedDistrictCount: 4 }
];

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface DivisionBreakdownItem {
  divisionId: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  expectedDistricts: number;
  actualDistricts: number;
  declaredDistrictsCount: number;
  isPublished: boolean;
  hasBilingualSeo: boolean;
  status: 'valid' | 'mismatch';
}

export interface GeographyValidationChecks {
  exactEightDivisions: boolean;
  exactSixtyFourDistricts: boolean;
  noDuplicateDivisionIds: boolean;
  noDuplicateDivisionSlugs: boolean;
  noDuplicateDistrictIds: boolean;
  noDuplicateDistrictSlugs: boolean;
  allDistrictsMappedToValidDivision: boolean;
  noInventedRelationships: boolean;
  officialDivisionCountsMatch: boolean;
  bilingualNamesPresent: boolean;
  bilingualSeoPresent: boolean;
  validUrlSlugs: boolean;
}

export interface GeographyValidationReport {
  valid: boolean;
  generatedAt: string;
  divisionsCount: number;
  districtsCount: number;
  checks: GeographyValidationChecks;
  duplicateDivisionIds: string[];
  duplicateDivisionSlugs: string[];
  duplicateDistrictIds: string[];
  duplicateDistrictSlugs: string[];
  orphanDistrictIds: string[];
  inventedDivisionIds: string[];
  missingOfficialDivisionIds: string[];
  invalidSlugRecords: string[];
  missingSeoRecords: string[];
  emptyImageCounts: {
    divisionsWithEmptyImage: number;
    districtsWithEmptyImage: number;
  };
  divisionBreakdown: DivisionBreakdownItem[];
  errors: string[];
  warnings: string[];
}

export function validateBangladeshGeographyDataset(
  divisions: Division[],
  districts: District[]
): GeographyValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const canonicalMap = new Map<string, CanonicalDivisionSpec>(
    CANONICAL_DIVISIONS_SPEC.map(spec => [spec.id, spec])
  );

  // 1. Check division IDs, slugs, bilingual fields, and SEO metadata
  const divisionIdCounts = new Map<string, number>();
  const divisionSlugCounts = new Map<string, number>();
  const validDivisionMap = new Map<string, Division>();
  const invalidSlugRecords: string[] = [];
  const missingSeoRecords: string[] = [];
  const inventedDivisionIds: string[] = [];
  let bilingualNamesMissing = 0;
  let divisionsWithEmptyImage = 0;

  for (const div of divisions) {
    const id = (div.id || '').trim();
    const slug = (div.slug || '').trim();

    divisionIdCounts.set(id, (divisionIdCounts.get(id) || 0) + 1);
    divisionSlugCounts.set(slug, (divisionSlugCounts.get(slug) || 0) + 1);

    if (!validDivisionMap.has(id)) {
      validDivisionMap.set(id, div);
    }

    if (!canonicalMap.has(id)) {
      inventedDivisionIds.push(id || '(empty)');
      errors.push(`Invented or non-official division ID "${id}" detected.`);
    }

    if (!slug || !SLUG_REGEX.test(slug)) {
      invalidSlugRecords.push(`division:${id} ("${slug}")`);
      errors.push(`Invalid slug "${slug}" on division "${id}".`);
    }

    if (!div.name_en?.trim() || !div.name_bn?.trim()) {
      bilingualNamesMissing += 1;
      errors.push(`Division "${id}" is missing bilingual name_en or name_bn.`);
    }

    if (
      !div.seo_title_en?.trim() ||
      !div.seo_title_bn?.trim() ||
      !div.seo_description_en?.trim() ||
      !div.seo_description_bn?.trim()
    ) {
      missingSeoRecords.push(`division:${id}`);
      errors.push(`Division "${id}" is missing bilingual SEO title or description.`);
    }

    if (typeof div.image_url !== 'string') {
      errors.push(`Division "${id}" must define image_url as a string (empty "" if unavailable).`);
    } else if (!div.image_url.trim()) {
      divisionsWithEmptyImage += 1;
    }

    if (typeof div.is_published !== 'boolean') {
      errors.push(`Division "${id}" must have a boolean is_published status.`);
    }
  }

  const missingOfficialDivisionIds = CANONICAL_DIVISIONS_SPEC.filter(
    spec => !validDivisionMap.has(spec.id)
  ).map(spec => spec.id);

  for (const missingId of missingOfficialDivisionIds) {
    errors.push(`Official division "${missingId}" is missing from dataset.`);
  }

  const duplicateDivisionIds = Array.from(divisionIdCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const duplicateDivisionSlugs = Array.from(divisionSlugCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (duplicateDivisionIds.length > 0) {
    errors.push(`Duplicate division IDs found: ${duplicateDivisionIds.join(', ')}`);
  }
  if (duplicateDivisionSlugs.length > 0) {
    errors.push(`Duplicate division slugs found: ${duplicateDivisionSlugs.join(', ')}`);
  }

  // 2. Check district IDs, slugs, relationships, bilingual fields, and SEO metadata
  const districtIdCounts = new Map<string, number>();
  const districtSlugCounts = new Map<string, number>();
  const orphanDistrictIds: string[] = [];
  const childCountByDivision = new Map<string, number>();
  let districtsWithEmptyImage = 0;

  for (const dist of districts) {
    const id = (dist.id || '').trim();
    const slug = (dist.slug || '').trim();
    const divisionId = (dist.division_id || '').trim();

    districtIdCounts.set(id, (districtIdCounts.get(id) || 0) + 1);
    districtSlugCounts.set(slug, (districtSlugCounts.get(slug) || 0) + 1);

    if (!slug || !SLUG_REGEX.test(slug)) {
      invalidSlugRecords.push(`district:${id} ("${slug}")`);
      errors.push(`Invalid slug "${slug}" on district "${id}".`);
    }

    if (!dist.name_en?.trim() || !dist.name_bn?.trim()) {
      bilingualNamesMissing += 1;
      errors.push(`District "${id}" is missing bilingual name_en or name_bn.`);
    }

    if (
      !dist.seo_title_en?.trim() ||
      !dist.seo_title_bn?.trim() ||
      !dist.seo_description_en?.trim() ||
      !dist.seo_description_bn?.trim()
    ) {
      missingSeoRecords.push(`district:${id}`);
      errors.push(`District "${id}" is missing bilingual SEO title or description.`);
    }

    if (typeof dist.image_url !== 'string') {
      errors.push(`District "${id}" must define image_url as a string (empty "" if unavailable).`);
    } else if (!dist.image_url.trim()) {
      districtsWithEmptyImage += 1;
    }

    if (typeof dist.is_published !== 'boolean') {
      errors.push(`District "${id}" must have a boolean is_published status.`);
    }

    if (!divisionId || !validDivisionMap.has(divisionId) || !canonicalMap.has(divisionId)) {
      orphanDistrictIds.push(id || '(empty)');
      errors.push(`District "${id}" references invalid or non-existent division_id "${divisionId}".`);
    } else {
      childCountByDivision.set(divisionId, (childCountByDivision.get(divisionId) || 0) + 1);
    }
  }

  const duplicateDistrictIds = Array.from(districtIdCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const duplicateDistrictSlugs = Array.from(districtSlugCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (duplicateDistrictIds.length > 0) {
    errors.push(`Duplicate district IDs found: ${duplicateDistrictIds.join(', ')}`);
  }
  if (duplicateDistrictSlugs.length > 0) {
    errors.push(`Duplicate district slugs found: ${duplicateDistrictSlugs.join(', ')}`);
  }

  // 3. Build division breakdown & verify official district counts
  let officialDivisionCountsMatch = true;
  const divisionBreakdown: DivisionBreakdownItem[] = CANONICAL_DIVISIONS_SPEC.map(spec => {
    const div = validDivisionMap.get(spec.id);
    const actualCount = childCountByDivision.get(spec.id) || 0;
    const declaredCount = div?.districts_count ?? 0;
    const hasSeo = Boolean(
      div?.seo_title_en?.trim() &&
      div?.seo_title_bn?.trim() &&
      div?.seo_description_en?.trim() &&
      div?.seo_description_bn?.trim()
    );
    const countsMatch = actualCount === spec.expectedDistrictCount && declaredCount === spec.expectedDistrictCount;
    if (!countsMatch) {
      officialDivisionCountsMatch = false;
      errors.push(
        `Division "${spec.id}" (${spec.name_en}) expects ${spec.expectedDistrictCount} districts, found ${actualCount} (declared ${declaredCount}).`
      );
    }
    return {
      divisionId: spec.id,
      nameEn: div?.name_en || spec.name_en,
      nameBn: div?.name_bn || spec.name_bn,
      slug: div?.slug || spec.slug,
      expectedDistricts: spec.expectedDistrictCount,
      actualDistricts: actualCount,
      declaredDistrictsCount: declaredCount,
      isPublished: Boolean(div?.is_published),
      hasBilingualSeo: hasSeo,
      status: countsMatch && Boolean(div) ? 'valid' : 'mismatch'
    };
  });

  if (divisions.length !== 8) {
    errors.push(`Expected exactly 8 divisions, found ${divisions.length}.`);
  }
  if (districts.length !== 64) {
    errors.push(`Expected exactly 64 districts, found ${districts.length}.`);
  }

  if (divisionsWithEmptyImage > 0 || districtsWithEmptyImage > 0) {
    warnings.push(
      `${divisionsWithEmptyImage} divisions and ${districtsWithEmptyImage} districts have empty image_url ("") awaiting licensed photography.`
    );
  }

  const checks: GeographyValidationChecks = {
    exactEightDivisions: divisions.length === 8 && missingOfficialDivisionIds.length === 0,
    exactSixtyFourDistricts: districts.length === 64,
    noDuplicateDivisionIds: duplicateDivisionIds.length === 0,
    noDuplicateDivisionSlugs: duplicateDivisionSlugs.length === 0,
    noDuplicateDistrictIds: duplicateDistrictIds.length === 0,
    noDuplicateDistrictSlugs: duplicateDistrictSlugs.length === 0,
    allDistrictsMappedToValidDivision: orphanDistrictIds.length === 0,
    noInventedRelationships: inventedDivisionIds.length === 0 && officialDivisionCountsMatch,
    officialDivisionCountsMatch,
    bilingualNamesPresent: bilingualNamesMissing === 0,
    bilingualSeoPresent: missingSeoRecords.length === 0,
    validUrlSlugs: invalidSlugRecords.length === 0
  };

  return {
    valid: errors.length === 0 && Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    divisionsCount: divisions.length,
    districtsCount: districts.length,
    checks,
    duplicateDivisionIds,
    duplicateDivisionSlugs,
    duplicateDistrictIds,
    duplicateDistrictSlugs,
    orphanDistrictIds,
    inventedDivisionIds,
    missingOfficialDivisionIds,
    invalidSlugRecords,
    missingSeoRecords,
    emptyImageCounts: {
      divisionsWithEmptyImage,
      districtsWithEmptyImage
    },
    divisionBreakdown,
    errors,
    warnings
  };
}

export function formatValidationReportText(report: GeographyValidationReport): string {
  const passFail = (ok: boolean) => (ok ? 'PASS' : 'FAIL');
  const lines: string[] = [
    '====================================================================',
    '  BANGLADESH ADMINISTRATIVE GEOGRAPHY VALIDATION REPORT (8 / 64)',
    '====================================================================',
    `Overall Status            : ${report.valid ? 'VALID - READY FOR SAFE IMPORT' : 'INVALID - IMPORT BLOCKED'}`,
    `Generated At              : ${report.generatedAt}`,
    `Divisions Count           : ${report.divisionsCount} / 8 [${passFail(report.checks.exactEightDivisions)}]`,
    `Districts Count           : ${report.districtsCount} / 64 [${passFail(report.checks.exactSixtyFourDistricts)}]`,
    `No Duplicate Division IDs : ${passFail(report.checks.noDuplicateDivisionIds)}`,
    `No Duplicate Div Slugs    : ${passFail(report.checks.noDuplicateDivisionSlugs)}`,
    `No Duplicate District IDs : ${passFail(report.checks.noDuplicateDistrictIds)}`,
    `No Duplicate Dist Slugs   : ${passFail(report.checks.noDuplicateDistrictSlugs)}`,
    `Valid District -> Div Map : ${passFail(report.checks.allDistrictsMappedToValidDivision)}`,
    `No Invented Relationships : ${passFail(report.checks.noInventedRelationships)}`,
    `Bilingual Names (EN & BN) : ${passFail(report.checks.bilingualNamesPresent)}`,
    `Bilingual SEO (EN & BN)   : ${passFail(report.checks.bilingualSeoPresent)}`,
    `Valid URL Slugs           : ${passFail(report.checks.validUrlSlugs)}`,
    `Image Fields Empty ("")   : ${report.emptyImageCounts.divisionsWithEmptyImage} divisions, ${report.emptyImageCounts.districtsWithEmptyImage} districts`,
    '--------------------------------------------------------------------',
    'Division Breakdown (Official Administrative Counts):'
  ];

  for (const row of report.divisionBreakdown) {
    lines.push(
      `  - ${row.divisionId.padEnd(11)} | ${row.nameEn.padEnd(11)} (${row.nameBn}) | Districts: ${String(row.actualDistricts).padStart(2)}/${row.expectedDistricts} | SEO: ${row.hasBilingualSeo ? 'OK' : 'MISSING'} | ${row.status.toUpperCase()}`
    );
  }

  if (report.warnings.length > 0) {
    lines.push('--------------------------------------------------------------------');
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  * ${w}`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('--------------------------------------------------------------------');
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ! ${e}`);
    }
  }

  lines.push('====================================================================');
  return lines.join('\n');
}
