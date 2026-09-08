export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  // Products
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  // Categories
  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",

  // News
  NEWS_VIEW: "news.view",
  NEWS_CREATE: "news.create",
  NEWS_UPDATE: "news.update",
  NEWS_DELETE: "news.delete",
  NEWS_PUBLISH: "news.publish",

  // Media
  MEDIA_VIEW: "media.view",
  MEDIA_UPLOAD: "media.upload",
  MEDIA_DELETE: "media.delete",

  // Users
  USERS_VIEW: "users.view",
  USERS_UPDATE: "users.update",
  USERS_DISABLE: "users.disable",
  USERS_DELETE: "users.delete",

  // Admin Management
  ADMINS_VIEW: "admins.view",
  ADMINS_CREATE: "admins.create",
  ADMINS_UPDATE: "admins.update",
  ADMINS_DELETE: "admins.delete",

  // Settings
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",

  // Account
  ACCOUNT_PASSWORD_CHANGE: "account.password.change",

  // Audit
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS = {
  USER: [
    PERMISSIONS.ACCOUNT_PASSWORD_CHANGE,
  ],

  EDITOR: [
    PERMISSIONS.ACCOUNT_PASSWORD_CHANGE,

    PERMISSIONS.DASHBOARD_VIEW,

    PERMISSIONS.NEWS_VIEW,
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_UPDATE,
    PERMISSIONS.NEWS_DELETE,
    PERMISSIONS.NEWS_PUBLISH,

    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_DELETE,
  ],

  ADMIN: [
    PERMISSIONS.ACCOUNT_PASSWORD_CHANGE,

    PERMISSIONS.DASHBOARD_VIEW,

    // Products
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,

    // Categories
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_CREATE,
    PERMISSIONS.CATEGORIES_UPDATE,
    PERMISSIONS.CATEGORIES_DELETE,

    // News
    PERMISSIONS.NEWS_VIEW,
    PERMISSIONS.NEWS_CREATE,
    PERMISSIONS.NEWS_UPDATE,
    PERMISSIONS.NEWS_DELETE,
    PERMISSIONS.NEWS_PUBLISH,

    // Media
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_DELETE,

    // Users
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DISABLE,
  ],

  SUPER_ADMIN: Object.values(PERMISSIONS),
} as const;