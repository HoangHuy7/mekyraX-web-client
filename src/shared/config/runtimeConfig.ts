import type { CasdoorConfig } from '@/features/auth/types/auth.types';

export interface TenantConfig {
  clientId: string;
  organizationName?: string;
  appName?: string;
}

export interface RuntimeConfig {
  casdoorServerUrl: string;
  redirectPath: string;
  graphqlEndpoint: string;
  merchants: Record<string, TenantConfig>;
}

export interface AppSetupInfo {
  agencyName: string;
  phone: string;
  licenseId: string;
  merchantId: string;
}

const SETUP_STORAGE_KEY = 'app_setup_info';
const RUNTIME_CONFIG_URL = '/config/app-config.json';

let runtimeConfigCache: RuntimeConfig | null = null;

const getString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeMerchantEntry = (entry: unknown): TenantConfig | null => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const raw = entry as Record<string, unknown>;
  const clientId = getString(raw.clientId || raw.CLIENT_ID);
  if (!clientId) {
    return null;
  }

  return {
    clientId,
    organizationName: getString(raw.organizationName || raw.ORG_NAME) || undefined,
    appName: getString(raw.appName || raw.APP_NAME) || undefined,
  };
};

const normalizeRuntimeConfig = (rawConfig: unknown): RuntimeConfig => {
  const raw = (rawConfig && typeof rawConfig === 'object' ? rawConfig : {}) as Record<string, unknown>;

  const merchantsRaw = (raw.merchants && typeof raw.merchants === 'object'
    ? raw.merchants
    : raw) as Record<string, unknown>;

  const merchants = Object.entries(merchantsRaw).reduce<Record<string, TenantConfig>>((acc, [id, entry]) => {
    const normalized = normalizeMerchantEntry(entry);
    if (!normalized) {
      return acc;
    }
    acc[id] = normalized;
    return acc;
  }, {});

  return {
    casdoorServerUrl: getString(raw.casdoorServerUrl) || 'http://localhost:8000',
    redirectPath: getString(raw.redirectPath) || '/callback',
    graphqlEndpoint: getString(raw.graphqlEndpoint) || '/graphql',
    merchants,
  };
};

export const loadRuntimeConfig = async (): Promise<RuntimeConfig> => {
  if (runtimeConfigCache) {
    return runtimeConfigCache;
  }

  const response = await fetch(RUNTIME_CONFIG_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Cannot load runtime config from ${RUNTIME_CONFIG_URL}`);
  }

  const payload = await response.json();
  runtimeConfigCache = normalizeRuntimeConfig(payload);
  return runtimeConfigCache;
};

export const getStoredSetupInfo = (): AppSetupInfo | null => {
  const raw = localStorage.getItem(SETUP_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AppSetupInfo;
    if (!parsed.agencyName || !parsed.phone || !parsed.licenseId || !parsed.merchantId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const hasSetupInfo = (): boolean => {
  return getStoredSetupInfo() !== null;
};

export const saveSetupInfo = (setup: AppSetupInfo): void => {
  localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
};

export const resolveCasdoorConfig = (
  runtimeConfig: RuntimeConfig,
  setupInfo: AppSetupInfo | null
): CasdoorConfig => {
  const merchantId = setupInfo?.merchantId || Object.keys(runtimeConfig.merchants)[0] || '';
  const merchant = runtimeConfig.merchants[merchantId];

  return {
    serverUrl: runtimeConfig.casdoorServerUrl,
    clientId: merchant?.clientId || '',
    organizationName: merchant?.organizationName || merchantId,
    appName: merchant?.appName || merchantId,
    redirectPath: runtimeConfig.redirectPath,
  };
};

export const getGraphqlEndpoint = (): string => {
  return localStorage.getItem('app_graphql_endpoint') || '/graphql';
};
