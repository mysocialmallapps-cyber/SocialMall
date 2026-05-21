export {
  appendTrackingParams,
  buildMockAffiliateUrl,
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
  getAffiliateProviderScriptConfig,
  getAffiliateProviderScriptConfigs,
  resolveAffiliateProviderWithFallback,
} from "./providers";
export type {
  AffiliateProviderAdapter,
  AffiliateProviderScriptConfig,
} from "./providers";
