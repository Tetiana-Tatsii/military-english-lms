"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioMediaRecorder,
  canPlayAudioBlob,
  normalizeAudioMimeType,
  getMicrophoneErrorMessage,
  getVoiceFileMimeType,
  isAcceptableVoiceFile,
  isIOSDevice,
  isVoiceRecordingSupported,
} from "@/lib/voiceRecording";
import {
  MAX_GALLERY_AUDIO_BYTES,
  MAX_GALLERY_AUDIO_SECONDS,
  MAX_VOICE_RECORDING_SECONDS,
} from "@/lib/mediaLimits";

const IOS_MIN_RECORD_MS = 2000;
const IOS_FINALIZE_DELAY_MS = 600;
const DESKTOP_FINALIZE_DELAY_MS = 50;
const RECORDING_TIMESLICE_MS = 500;

function readAudioDurationSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
    };
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      cleanup();
      resolve(Number.isFinite(duration) ? duration : null);
    };
    audio.onerror = () => {
      cleanup();
      resolve(null);
    };
    audio.src = url;
  });
}

export function useVoiceRecorder() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewWarning, setPreviewWarning] = useState<string | null>(null);
  const [canPreview, setCanPreview] = useState(true);
  const [canRecord, setCanRecord] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeTypeRef = useRef("audio/mp4");
  const previewUrlRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef(0);
  const recordingTimeRef = useRef(0);
  const stopRecordingRef = useRef<() => void>(() => {});

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const setPreviewFromBlob = useCallback(
    (blob: Blob | null, options?: { fromVideo?: boolean }) => {
      revokePreviewUrl();
      setAudioBlob(blob);
      if (blob) {
        const playable = canPlayAudioBlob(blob);
        setCanPreview(playable);
        if (playable) {
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setAudioUrl(url);
          setPreviewWarning(
            options?.fromVideo
              ? "Збережено як відеофайл з мікрофоном — на iPhone прев'ю може не працювати, але викладач прослухає на комп'ютері."
              : null,
          );
        } else {
          setAudioUrl(null);
          setPreviewWarning(
            options?.fromVideo
              ? "Файл збережено (відео з голосом). На iPhone прев'ю недоступне — надішліть ДЗ, викладач прослухає на комп'ютері."
              : "Запис збережено. На iPhone прев'ю недоступне — це нормально. Можна надіслати ДЗ, викладач прослухає на комп'ютері.",
          );
        }
        setError(null);
      } else {
        setAudioUrl(null);
        setPreviewWarning(null);
        setCanPreview(true);
      }
    },
    [revokePreviewUrl],
  );

  const clearRecording = useCallback(() => {
    revokePreviewUrl();
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    setPreviewWarning(null);
    setCanPreview(true);
    chunksRef.current = [];
    recordingTimeRef.current = 0;
  }, [revokePreviewUrl]);

  useEffect(() => {
    setCanRecord(isVoiceRecordingSupported());
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const next = Math.min(prev + 1, MAX_VOICE_RECORDING_SECONDS);
          recordingTimeRef.current = next;
          if (next >= MAX_VOICE_RECORDING_SECONDS) {
            queueMicrotask(() => stopRecordingRef.current());
          }
          return next;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
      recordingTimeRef.current = 0;
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      revokePreviewUrl();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [revokePreviewUrl]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const finalizeRecording = () => {
    const recorder = recorderRef.current;
    const mime =
      mimeTypeRef.current ||
      recorder?.mimeType ||
      (isIOSDevice() ? "audio/mp4" : "audio/webm");
    const blob = new Blob(chunksRef.current, {
      type: normalizeAudioMimeType(new Blob([], { type: mime })),
    });

    if (blob.size > 0) {
      setPreviewFromBlob(blob);
    } else {
      setError(
        isIOSDevice()
          ? "Запис порожній. Тримайте кнопку «Зупинити» щонайменше 3 секунди після початку, або завантажте файл з Диктофона нижче."
          : "Запис порожній. Спробуйте ще раз або завантажте аудіофайл.",
      );
    }

    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const startRecording = async () => {
    setError(null);
    setPreviewWarning(null);
    chunksRef.current = [];

    if (!isVoiceRecordingSupported()) {
      setError(
        "Запис у браузері недоступний на цьому пристрої. Завантажте файл з Диктофона або Файлів.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const { recorder, mimeType } = createAudioMediaRecorder(stream);
      mimeTypeRef.current = mimeType;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setTimeout(
          finalizeRecording,
          isIOSDevice() ? IOS_FINALIZE_DELAY_MS : DESKTOP_FINALIZE_DELAY_MS,
        );
      };

      recorder.onerror = (event) => {
        console.warn("MediaRecorder error:", event);
        if (chunksRef.current.length === 0) {
          setError(
            "Помилка запису. Завантажте m4a з Диктофона або спробуйте ще раз.",
          );
          setIsRecording(false);
          stopStream();
        }
      };

      // iOS Safari потребує timeslice, інакше chunks часто порожні
      try {
        recorder.start(RECORDING_TIMESLICE_MS);
      } catch {
        recorder.start();
      }

      recordingStartedAtRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Помилка доступу до мікрофона:", err);
      setError(getMicrophoneErrorMessage(err));
      stopStream();
    }
  };

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      setIsRecording(false);
      return;
    }

    const elapsed = Date.now() - recordingStartedAtRef.current;
    const hitMax =
      recordingTimeRef.current >= MAX_VOICE_RECORDING_SECONDS ||
      elapsed >= MAX_VOICE_RECORDING_SECONDS * 1000;

    if (isIOSDevice() && !hitMax && elapsed < IOS_MIN_RECORD_MS) {
      setError("Зачекайте щонайменше 2 секунди перед зупинкою запису.");
      return;
    }

    setIsRecording(false);

    try {
      if (typeof recorder.requestData === "function") {
        recorder.requestData();
      }
    } catch {
      // Safari iOS може не підтримувати requestData
    }

    // Невелика пауза перед stop — дає Safari час віддати останній chunk
    setTimeout(() => {
      try {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      } catch (err) {
        console.error("Помилка зупинки запису:", err);
        if (chunksRef.current.length === 0) {
          setError("Не вдалося зупинити запис. Спробуйте ще раз.");
        }
        stopStream();
      }
    }, isIOSDevice() ? 100 : 0);
  }, []);

  stopRecordingRef.current = stopRecording;

  const loadAudioFile = async (file: File) => {
    if (!isAcceptableVoiceFile(file)) {
      setError("Оберіть аудіофайл (m4a, mp3, wav) або запис з Диктофона.");
      return;
    }

    if (file.size === 0) {
      setError("Файл порожній. Запишіть голос у Диктофоні і спробуйте знову.");
      return;
    }

    if (file.size > MAX_GALLERY_AUDIO_BYTES) {
      setError(
        "Аудіофайл занадто великий. Запишіть у застосунку (до 3 хв) або скоротіть запис у Диктофоні.",
      );
      return;
    }

    const duration = await readAudioDurationSeconds(file);
    if (duration != null && duration > MAX_GALLERY_AUDIO_SECONDS + 1) {
      setError(
        `Аудіо довше за 3 хвилини (${Math.ceil(duration)} с). Скоротіть запис і спробуйте знову.`,
      );
      return;
    }

    const mime = getVoiceFileMimeType(file);
    const blob =
      file.type && file.type.length > 0
        ? file
        : new Blob([file], { type: mime });
    const fromVideo =
      file.type.startsWith("video/") || /\.(mov|mp4)$/i.test(file.name);

    setError(null);
    setPreviewFromBlob(blob, { fromVideo });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const canStopRecording =
    !isRecording || !isIOSDevice() || recordingTime >= 2;

  return {
    audioBlob,
    audioUrl,
    isRecording,
    recordingTime,
    maxRecordingSeconds: MAX_VOICE_RECORDING_SECONDS,
    error,
    previewWarning,
    canPreview,
    canRecord,
    canStopRecording,
    startRecording,
    stopRecording,
    clearRecording,
    loadAudioFile,
    formatTime,
  };
}
