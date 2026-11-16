import 'dotenv/config';
import { DISTRICTS, DIVISIONS } from '../src/data/bangladeshData';
import {
  formatValidationReportText,
  validateBangladeshGeographyDataset
} from '../src/data/geographyValidator';
import {
  applyStatusMode,
  executeGeographyImport,
  inspectGeographyAgainstFirestore,
  loadServiceAccountFromEnv,
  mintServiceAccountAccessToken,
  type ImportStatusMode
} from '../src/server/firestoreAdminRest';

interface CliOptions {
  dryRun: boolean;
  confirmImport: boolean;
  confirmOverwrite: boolean;
  statusMode: ImportStatusMode;
  json: boolean;
  token: string;
  help: boolean;
}

function parseCliArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    confirmImport: false,
    confirmOverwrite: false,
    statusMode: 'preserve',
    json: false,
    token: (process.env.FIREBASE_ADMIN_ID_TOKEN || '').trim(),
    help: false
  };

  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '--validate-only') {
      opts.dryRun = true;
    } else if (arg === '--confirm-import') {
      opts.confirmImport = true;
    } else if (arg === '--confirm-overwrite') {
      opts.confirmOverwrite = true;
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--help' || arg === '-h') {
      opts.help = true;
    } else if (arg.startsWith('--status=')) {
      const val = arg.slice('--status='.length).trim().toLowerCase();
      if (val === 'published' || val === 'draft' || val === 'preserve') {
        opts.statusMode = val;
      } else {
        throw new Error(`Invalid --status value "${val}". Expected published | draft | preserve.`);
      }
    } else if (arg.startsWith('--token=')) {
      opts.token = arg.slice('--token='.length).trim();
    } else {
      throw new Error(`Unknown CLI argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
Bangladesh Official Geography (8 Divisions & 64 Districts) Validation & Import CLI

Usage:
  npm run seed:geography -- [options]

Options:
  --dry-run, --validate-only   Validate dataset and display report without writing to Firestore
  --confirm-import             Execute Firestore import after validation passes
  --confirm-overwrite          Allow overwriting existing division/district documents (off by default)
  --status=published|draft     Override is_published status on imported documents (default: preserve)
  --token=<idToken>            Optional Firebase Admin ID token (or set FIREBASE_ADMIN_ID_TOKEN)
  --json                       Output structured JSON instead of formatted text
  -h, --help                   Show this help message

Credentials (Server / CLI only — never expose in browser code):
  1. GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  2. FIREBASE_SERVICE_ACCOUNT_JSON='{"client_email":...,"private_key":...}'
  3. FIREBASE_ADMIN_ID_TOKEN=<verified-admin-firebase-id-token>
`);
}

async function resolveCliBearerToken(explicitToken: string): Promise<{ token: string | null; source: string }> {
  const sa = loadServiceAccountFromEnv();
  if (sa) {
    const accessToken = await mintServiceAccountAccessToken(sa);
    return { token: accessToken, source: 'service_account' };
  }
  if (explicitToken) {
    return { token: explicitToken, source: 'admin_id_token' };
  }
  return { token: null, source: 'none' };
}

async function main(): Promise<void> {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const adjusted = applyStatusMode(DIVISIONS, DISTRICTS, opts.statusMode);
  const report = validateBangladeshGeographyDataset(adjusted.divisions, adjusted.districts);

  if (!opts.json) {
    console.log(formatValidationReportText(report));
  }

  if (!report.valid) {
    if (opts.json) {
      console.log(JSON.stringify({ report, imported: false }, null, 2));
    }
    process.exitCode = 1;
    return;
  }

  const cred = await resolveCliBearerToken(opts.token);

  if (!cred.token) {
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            report,
            credentialsConfigured: false,
            imported: false,
            message: opts.confirmImport
              ? 'Missing server-side credentials (GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_ADMIN_ID_TOKEN).'
              : 'Dry-run validation passed. Provide server-side credentials and --confirm-import to import into Firestore.'
          },
          null,
          2
        )
      );
    } else {
      console.log('');
      if (opts.confirmImport && !opts.dryRun) {
        console.error(
          'ERROR: --confirm-import requires server-side credentials.\n' +
            'Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json, FIREBASE_SERVICE_ACCOUNT_JSON, or --token=<admin_id_token>.'
        );
        process.exitCode = 1;
        return;
      }
      console.log(
        'Dry-run complete (no Firestore credentials configured). To inspect live Firestore state or import:\n' +
          '  1. Export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json\n' +
          '  2. Run: npm run seed:geography -- --dry-run\n' +
          '  3. Confirm import: npm run seed:geography -- --confirm-import'
      );
    }
    return;
  }

  const inspection = await inspectGeographyAgainstFirestore(
    DIVISIONS,
    DISTRICTS,
    cred.token,
    opts.statusMode
  );

  if (!opts.json) {
    console.log('');
    console.log('--- LIVE FIRESTORE COMPARISON ---');
    console.log(
      `Project: ${inspection.target.projectId} (Database: ${inspection.target.firestoreDatabaseId})`
    );
    console.log(
      `Existing Divisions in Firestore: ${inspection.firestoreDiff.existingDivisionsCount} | Missing from dataset: ${inspection.firestoreDiff.missingDivisionIds.length}`
    );
    console.log(
      `Existing Districts in Firestore: ${inspection.firestoreDiff.existingDistrictsCount} | Missing from dataset: ${inspection.firestoreDiff.missingDistrictIds.length}`
    );
    console.log(
      `Slug Collisions: ${
        inspection.firestoreDiff.divisionSlugCollisions.length +
        inspection.firestoreDiff.districtSlugCollisions.length
      }`
    );
  }

  if (opts.dryRun || !opts.confirmImport) {
    if (opts.json) {
      console.log(JSON.stringify({ ...inspection, imported: false }, null, 2));
    } else if (!opts.dryRun) {
      console.log('');
      console.log(
        'Preview only (no writes performed). Re-run with --confirm-import to insert missing records safely.'
      );
    }
    return;
  }

  if (
    (inspection.firestoreDiff.existingDivisionIds.length > 0 ||
      inspection.firestoreDiff.existingDistrictIds.length > 0) &&
    !opts.confirmOverwrite &&
    !opts.json
  ) {
    console.log(
      '\nExisting documents detected: preserving existing documents (pass --confirm-overwrite to update them).'
    );
  }

  const result = await executeGeographyImport({
    divisions: DIVISIONS,
    districts: DISTRICTS,
    bearerToken: cred.token,
    confirmImport: true,
    confirmOverwrite: opts.confirmOverwrite,
    statusMode: opts.statusMode
  });

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log('--- IMPORT SUMMARY ---');
    console.log(`Created Divisions:           ${result.createdDivisions}`);
    console.log(`Created Districts:           ${result.createdDistricts}`);
    console.log(`Overwritten Divisions:       ${result.overwrittenDivisions}`);
    console.log(`Overwritten Districts:       ${result.overwrittenDistricts}`);
    console.log(`Skipped Existing Divisions:  ${result.skippedExistingDivisions}`);
    console.log(`Skipped Existing Districts:  ${result.skippedExistingDistricts}`);
    console.log(`Slug Collisions Skipped:     ${result.slugCollisions.length}`);
    console.log(`Imported At:                 ${result.importedAt}`);
  }
}

main().catch(err => {
  console.error('[seed:geography] Failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
