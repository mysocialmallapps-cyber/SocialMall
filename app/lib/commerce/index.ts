export {
  appendTrackingParams,
  buildMockAffiliateUrl,
  isValidOutboundUrl,
  resolveAffiliateRedirectDestination,
  resolveCommerceDestination,
} from "./urls";
export type { ResolvedAffiliateRedirect } from "./urls";
export {
  buildAffiliateClickId,
  getAffiliateCommissionDefaults,
  getAffiliateProviderAdapter,
} from "./providers";
export type { AffiliateProviderAdapter } from "./providers";
