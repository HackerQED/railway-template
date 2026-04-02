import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { WebsiteConfig } from '@/types';

/**
 * website config, without translations
 *
 * docs:
 * https://mksaas.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      defaultMode: 'dark',
      enableSwitch: false,
    },
  },
  metadata: {
    images: {
      ogImage: '/og.png',
      logo: '/logo.png',
    },
    social: {},
  },
  features: {
    enableUpgradeCard: true,
    enableAffonsoAffiliate: false,
    enablePromotekitAffiliate: false,
    enableDatafastRevenueTrack: false,
    enableCrispChat: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
    enableTurnstileCaptcha: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
  },
  routes: {
    defaultLoginRedirect: '/generations',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
    googleAds: {
      googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
      signupConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL,
      beginCheckoutConversionLabel:
        process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL,
      purchaseConversionLabel:
        process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
    },
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: false,
    enableCredentialLogin:
      process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: {
        flag: '🇺🇸',
        name: 'English',
        hreflang: 'en',
      },
    },
  },
  blog: {
    enable: false,
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  docs: {
    enable: false,
  },
  mail: {
    provider: 'resend',
    fromEmail: 'Railway Template <noreply@example.com>',
    supportEmail: 'Railway Template <support@example.com>',
  },
  newsletter: {
    enable: true,
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  storage: {
    enable: true,
    provider: 's3',
  },
  payment: {
    provider: 'stripe',
  },
  price: {
    showFreePlan: false,
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
        credits: {
          enable: false,
          amount: 0,
          expireDays: 30,
        },
      },
      basic: {
        id: 'basic',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY!,
            amount: 990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_YEARLY!,
            amount: 10000,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        yearlyDiscount: 15,
        credits: {
          enable: true,
          amount: 600,
          expireDays: 30,
        },
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
            amount: 2990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
            amount: 28800,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
        yearlyDiscount: 20,
        credits: {
          enable: true,
          amount: 2000,
          expireDays: 30,
        },
      },
      premium: {
        id: 'premium',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY!,
            amount: 4990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY!,
            amount: 36000,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        yearlyDiscount: 40,
        credits: {
          enable: true,
          amount: 3500,
          expireDays: 30,
        },
      },
      onetime: {
        id: 'onetime',
        prices: [
          {
            type: PaymentTypes.ONE_TIME,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ONETIME!,
            amount: 19900,
            currency: 'USD',
          },
        ],
        isFree: false,
        isLifetime: false,
        credits: {
          enable: true,
          amount: 20000,
          expireDays: 0,
        },
      },
    },
  },
  credits: {
    enableCredits: true,
    enablePackagesForFreePlan: false,
    registerGiftCredits: {
      enable: true,
      amount: 50,
      expireDays: 30,
    },
    packages: {},
  },
};
