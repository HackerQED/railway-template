import { websiteConfig } from './config/website';

/**
 * The routes for the application
 */
export enum Routes {
  Root = '/',

  // marketing pages
  FAQ = '/#faqs',
  Features = '/#features',
  Pricing = '/pricing', // change to /#pricing if you want to use the pricing section in homepage
  Blog = '/blog',
  Docs = '/docs',
  PrivacyPolicy = '/privacy',
  TermsOfService = '/terms',

  // auth routes
  AuthError = '/auth/error',

  // All [dashboard] buttons points to this, the main entry of the web app
  DashboardEntry = '/models/seedance-2-0',

  // Model pages (dynamic route /models/[slug], public with sidebar layout)
  AllModels = '/models',

  // Generation history
  Generations = '/generations',

  // Legacy routes (kept for reference)
  ToolsGenerate = '/generate',

  SettingsCredits = '/settings/credits',
  SettingsApiKeys = '/settings/api-keys',

  // payment processing
  Payment = '/payment',
}

/**
 * The routes that can not be accessed by logged in users
 */
export const routesNotAllowedByLoggedInUsers: string[] = [];

/**
 * The routes that are protected and require authentication
 */
export const protectedRoutes = [
  Routes.SettingsCredits,
  Routes.SettingsApiKeys,
  Routes.Payment,
];

/**
 * The default redirect path after logging in
 */
export const DEFAULT_LOGIN_REDIRECT =
  websiteConfig.routes.defaultLoginRedirect ?? Routes.DashboardEntry;
