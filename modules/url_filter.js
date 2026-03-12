/**
 * Check if current page URL is whitelisted
 * @returns {Promise<boolean>} - true if page should be skipped, false if extension should run
 */
async function isUrlWhitelisted() {
  /** @ts-ignore */
  const whitelist = window.cachedWhitelistedUrls || [];
  
  if (whitelist.length === 0) return false; // No whitelist, run extension
  
  const currentUrl = window.location.href;
  
  // Check if current domain matches any whitelisted domain
  return whitelist.some(whitelistedDomain => {
    // Remove www. and trailing slashes for comparison
    const cleanWhitelist = whitelistedDomain.toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
    const cleanCurrent = currentUrl.toLowerCase().replace(/^www\./, "");
    
    return cleanCurrent === cleanWhitelist || cleanCurrent.endsWith("." + cleanWhitelist);
  });
}