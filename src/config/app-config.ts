/**
 * Central Branding & Configuration Settings for PFM (Personal Finance Manager)
 */
export const APP_CONFIG = {
  appName: 'PFM - Personal Finance Manager',
  shortName: 'PFM',
  description: 'Understand your money in under 60 seconds with offline-first speed and reporting intelligence.',
  supportEmail: 'support@pfm-app.local',
  
  // Default Settings fallback values
  defaults: {
    theme: 'system' as const,
    currency: 'INR',
    locale: 'en-IN',
    weekStart: 1, // Monday
    fyStartMonth: 4, // April
    dateFormat: 'YYYY-MM-DD',
  },
  
  // PWA manifest variables
  pwa: {
    themeColor: '#7c3aed', // Purple theme
    backgroundColor: '#09090b', // Sleek dark slate
  }
}
