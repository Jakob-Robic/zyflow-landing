/**
 * Zyflow analytics IDs — single source for the rebuild site.
 * Pixels for ChatGPT Ads / Meta are configured in GTM; IDs below are
 * documented so tags can be created without hunting through chat history.
 */
window.ZYFLOW_ANALYTICS = {
  gtmId: "GTM-W8XX2TWZ",
  ga4MeasurementId: "G-6YK1EKLMGS",
  /** Set when ChatGPT Ads data source exists; paste into GTM Custom HTML tag. */
  chatgptPixelId: "",
  /** Set when Meta Pixel exists; paste into GTM Meta / Custom HTML tag. */
  metaPixelId: "",
};
