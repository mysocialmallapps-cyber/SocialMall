export {
  appendTrackingParams,
  buildAffiliateUrl,
  isValidOutboundUrl,
  normalizeOutboundUrl,
  resolveAffiliateRedirectDestination,
  resolveCommerceDestination,
} from "./urls";
export type { ResolvedAffiliateRedirect } from "./urls";
export {
  buildAffiliateClickId,
  defaultAffiliateProviderFallbacks,
  detectAffiliateProviderFromUrl,
  getAffiliateCommissionDefaults,
  getAffiliateProviderAdapter,
  getAffiliateProviderStatuses,
  getAffiliateProviderScriptConfig,
  getAffiliateProviderScriptConfigs,
  getConfiguredAffiliateNetworks,
  getEnabledAffiliateProviderScriptConfigs,
  isAffiliateProviderConfigured,
  resolveAffiliateProviderWithFallback,
} from "./providers";
export type {
  AffiliateProviderAdapter,
  AffiliateProviderStatus,
  AffiliateProviderScriptConfig,
} from "./providers";
