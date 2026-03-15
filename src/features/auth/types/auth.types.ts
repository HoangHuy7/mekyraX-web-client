export interface User {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface CasdoorConfig {
  serverUrl: string;
  clientId: string;
  organizationName: string;
  appName: string;
  redirectPath: string;
}

export interface CasdoorSDK {
  getSigninUrl: () => string;
  getSignupUrl: () => string;
  getAccessToken: () => string | null;
  getUserInfo: () => Record<string, unknown> | null;
}
