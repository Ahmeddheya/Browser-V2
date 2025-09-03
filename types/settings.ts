export interface SearchEngine {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface SavedPassword {
  id: string;
  website: string;
  username: string;
  password: string;
  dateAdded: number;
  lastUsed: number;
  isCompromised?: boolean;
}

export interface PaymentCard {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  isDefault: boolean;
  dateAdded: number;
}

export interface SavedAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  dateAdded: number;
}

export interface NotificationSettings {
  permissionRequests: boolean;
  downloadComplete: boolean;
  securityAlerts: boolean;
}

export interface PrivacySettings {
  safeBrowsing: 'off' | 'standard' | 'enhanced';
  httpsFirst: boolean;
  paymentMethodDetection: boolean;
  preloadPages: boolean;
  secureDNS: string;
  doNotTrack: boolean;
  privacySandbox: boolean;
}

export interface AppearanceSettings {
  theme: 'system' | 'light' | 'dark';
  fontSize: number;
  pageZoom: number;
  toolbarLayout: 'default' | 'compact' | 'minimal';
}

export interface AccessibilitySettings {
  textToSpeech: boolean;
  screenReaderSupport: boolean;
  navigationAssistance: boolean;
}

export interface SitePermissions {
  camera: 'ask' | 'block' | 'allow';
  location: 'ask' | 'block' | 'allow';
  microphone: 'ask' | 'block' | 'allow';
  notifications: 'ask' | 'block' | 'allow';
}

export interface LanguageSettings {
  preferredLanguage: string;
  translationEnabled: boolean;
}

export interface DownloadSettings {
  storageLocation: string;
  wifiOnlyDownloads: boolean;
  askDownloadLocation: boolean;
}

export interface AdvancedBrowserSettings extends BrowserSettings {
  searchEngine: string;
  customSearchEngine?: string;
  passwordManager: {
    savePasswords: boolean;
    autoSignIn: boolean;
    biometricAuth: boolean;
  };
  paymentMethods: {
    saveAndFill: boolean;
  };
  addresses: {
    saveAndFill: boolean;
  };
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  accessibility: AccessibilitySettings;
  sitePermissions: SitePermissions;
  language: LanguageSettings;
  downloads: DownloadSettings;
}

export interface BrowserSettings {
  darkMode: boolean;
  nightMode: boolean;
  incognitoMode: boolean;
  desktopMode: boolean;
  adBlockEnabled: boolean;
  searchEngine: string;
  homepage: string;
  autoSaveHistory: boolean;
  maxHistoryItems: number;
}