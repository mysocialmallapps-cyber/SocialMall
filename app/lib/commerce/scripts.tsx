import Script from "next/script";
import { getEnabledAffiliateProviderScriptConfigs } from "./providers";

export const AffiliateScripts = () => {
  const enabledScripts = getEnabledAffiliateProviderScriptConfigs();

  if (!enabledScripts.length) {
    return null;
  }

  return (
    <>
      {enabledScripts.map((config) => (
        <Script
          key={config.network}
          id={`affiliate-${config.network}`}
          src={config.src}
          strategy={config.strategy}
        />
      ))}
    </>
  );
};
