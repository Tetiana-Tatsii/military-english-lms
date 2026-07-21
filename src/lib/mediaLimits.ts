/** Student voice homework: hard cap (seconds). */
export const MAX_VOICE_RECORDING_SECONDS = 180;

/** Gallery / Dictaphone audio upload: max duration (seconds). */
export const MAX_GALLERY_AUDIO_SECONDS = 180;

/** Fallback size cap for gallery audio (~3 min at reasonable bitrate). */
export const MAX_GALLERY_AUDIO_BYTES = 5 * 1024 * 1024;

/** Non-image homework attachments (PDF/Word). */
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

/** Skip recompress if already small enough. */
export const IMAGE_SKIP_COMPRESS_BYTES = 400 * 1024;

/** Longest side after compress — enough for readable worksheets/photos. */
export const IMAGE_MAX_SIDE_PX = 1600;

/** WebP/JPEG quality — balance size vs text readability. */
export const IMAGE_COMPRESS_QUALITY = 0.82;
