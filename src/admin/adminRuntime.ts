/**
 * Lazy-Loaded Admin & CMS Runtime Bundle
 * Keeps Firebase Auth, Firebase Storage, Admin Dashboard, and CRUD Modals
 * out of the initial public portal bundle for optimal performance.
 */

export {
  saveDivision,
  deleteDivision,
  saveDistrict,
  deleteDistrict,
  saveCategory,
  deleteCategory,
  saveTouristSpot,
  deleteTouristSpot,
  saveArticle,
  deleteArticle,
  saveMediaItem,
  deleteMediaItem,
  saveAdminRecord,
  deleteAdminRecord,
  seedFirestoreFromCms,
  getMediaReferences,
  syncCmsStoreFromAdminSnapshot,
  canWriteAdmin
} from '../cms/cmsState';

export {
  renderCmsDashboard,
  showConfirmModal
} from '../cms/cmsViews';

export {
  openDivisionFormModal,
  openDistrictFormModal,
  openCategoryFormModal,
  openSpotFormModal,
  openArticleFormModal,
  openMediaUploadModal,
  openMediaEditModal,
  openImagePreviewModal,
  openLegalPagesModal
} from '../cms/cmsModals';

export {
  renderAdminLoginPage,
  renderAdminVerifyingGate
} from '../pages/AdminLoginPage';

export {
  signInAdminWithEmailPassword,
  verifyCurrentAdminSession,
  secureAdminSignOut,
  getVerifiedAdminSession,
  isVerifiedAdminActive,
  subscribeAdminAuthLifecycle,
  mapAdminAuthError
} from '../services/adminAuthService';

export {
  adminDashboardState,
  fetchAdminDashboardSnapshot,
  recordAdminAuditLog,
  resetAdminDashboardState,
  saveSeoSettings,
  saveWebsiteSettings,
  saveAdsSettings
} from '../services/adminDashboardService';

export {
  auth,
  uploadImageFile,
  validateImageFile
} from '../firebase';

export {
  validateBangladeshGeographyDataset,
  type GeographyValidationReport
} from '../data/geographyValidator';
