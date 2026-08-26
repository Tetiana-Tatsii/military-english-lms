/**
 * Google Form shown before certificate download.
 * Paste the live form URL here, or set NEXT_PUBLIC_CERTIFICATE_FEEDBACK_FORM_URL.
 */
export const CERTIFICATE_FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_CERTIFICATE_FEEDBACK_FORM_URL?.trim() ||
  "https://docs.google.com/forms/d/e/1FAIpQLSdAuKeMtgHs7W3QGpkGlT73OwKArftHDpztG-QeQYt7GU3Y_A/viewform";
