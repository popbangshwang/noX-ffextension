/**
 * Check if current page URL is whitelisted (uses cached whitelist)
 * @returns {boolean} - true if page should be skipped, false if extension should run
 */
function isUrlWhitelisted() {
  /** @ts-ignore */
  const whitelist = window.cachedWhitelistedUrls || [];
  
  if (whitelist.length === 0) return false;
  
  const currentHostname = window.location.hostname;
  
  return whitelist.some(whitelistedDomain => {
    const cleanWhitelist = whitelistedDomain.toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
    const cleanCurrent = currentHostname.toLowerCase().replace(/^www\./, "");
    
    return cleanCurrent === cleanWhitelist || cleanCurrent.endsWith("." + cleanWhitelist);
  });
}