/**
 * Check if current page URL is whitelisted
 * @returns {Promise<boolean>} - true if page should be skipped, false if extension should run
 */
async function isUrlWhitelisted() {
  // Fetch whitelist from storage directly (don't rely on cache yet)
  const { whitelistedUrls } = await browser.storage.local.get("whitelistedUrls");
  const whitelist = whitelistedUrls || [];
  
  if (whitelist.length === 0) return false; // No whitelist, run extension
  
  // Get the hostname from the current URL
  const currentHostname = window.location.hostname;
  
  console.log("Checking whitelist. Current hostname:", currentHostname, "Whitelist:", whitelist); // DEBUG
  
  // Check if current domain matches any whitelisted domain
  return whitelist.some(whitelistedDomain => {
    // Remove www. and trailing slashes for comparison
    const cleanWhitelist = whitelistedDomain.toLowerCase().replace(/^www\./, "").replace(/\/$/, "");
    const cleanCurrent = currentHostname.toLowerCase().replace(/^www\./, "");
    
    console.log("Comparing:", cleanCurrent, "vs", cleanWhitelist); // DEBUG
    
    return cleanCurrent === cleanWhitelist || cleanCurrent.endsWith("." + cleanWhitelist);
  });
}