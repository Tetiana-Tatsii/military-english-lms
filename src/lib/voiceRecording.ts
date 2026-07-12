const MIME_CANDIDATES_DESKTOP = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isVoiceRecordingSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Desktop: явний mime. iOS: порожній рядок = MediaRecorder без опцій (Safari сам обере mp4). */
export function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (isIOSDevice()) return "";
  for (const mime of MIME_CANDIDATES_DESKTOP) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

export function createAudioMediaRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  mimeType: string;
} {
  if (isIOSDevice()) {
    const recorder = new MediaRecorder(stream);
    return {
      recorder,
      mimeType: recorder.mimeType || "audio/mp4",
    };
  }

  const mimeType = getSupportedAudioMimeType();
  if (mimeType) {
    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      return { recorder, mimeType: recorder.mimeType || mimeType };
    } catch {
      // fallback below
    }
  }

  const recorder = new MediaRecorder(stream);
  return {
    recorder,
    mimeType: recorder.mimeType || "audio/webm",
  };
}

export function normalizeAudioMimeType(blob: Blob): string {
  if (blob.type) return blob.type;
  return isIOSDevice() ? "audio/mp4" : "audio/webm";
}

export function isUrlUnplayableOnIOS(url: string): boolean {
  if (!isIOSDevice()) return false;
  const lower = url.toLowerCase();
  return lower.includes("webm") || lower.includes(".ogg");
}

export function canPlayAudioBlob(blob: Blob): boolean {
  if (typeof document === "undefined") return true;
  const mime = normalizeAudioMimeType(blob).toLowerCase();

  if (isIOSDevice()) {
    if (mime.includes("webm") || mime.includes("ogg")) return false;
    const audio = document.createElement("audio");
    return audio.canPlayType(mime) !== "";
  }

  const audio = document.createElement("audio");
  const probeMime = mime || getSupportedAudioMimeType();
  if (!probeMime) return true;
  return audio.canPlayType(probeMime) !== "";
}

export function getAudioExtension(mimeType: string): string {
  const mime = (mimeType || (isIOSDevice() ? "audio/mp4" : "audio/webm")).toLowerCase();
  if (mime.includes("mp4") || mime.includes("aac") || mime.includes("m4a")) {
    return "m4a";
  }
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("caf")) return "caf";
  return "webm";
}

export function getMicrophoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Дозвіл на мікрофон відхилено. У Safari: Налаштування → Safari → Мікрофон, або натисніть «aA» у адресному рядку.";
      case "NotFoundError":
        return "Мікрофон не знайдено на цьому пристрої.";
      case "NotSupportedError":
        return "Запис голосу не підтримується у цьому браузері. Спробуйте завантажити аудіофайл нижче.";
      case "SecurityError":
        return "Запис доступний лише через захищене з'єднання (HTTPS).";
      default:
        break;
    }
  }
  return "Не вдалося почати запис. Спробуйте завантажити готовий аудіофайл.";
}

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return /\.(m4a|mp3|wav|aac|ogg|webm|mp4|caf)$/i.test(file.name);
}

export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
