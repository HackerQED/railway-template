import type { routing } from '@/i18n/routing';
import type messages from './messages/en/common.json';

/**
 * next-intl 4.0.0
 *
 * https://github.com/amannn/next-intl/blob/main/examples/example-app-router/global.d.ts
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    // Use common.json as base type, but allow additional dynamically loaded translation files
    Messages: typeof messages & Record<string, any>;
  }
}
