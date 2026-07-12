"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioMediaRecorder,
  canPlayAudioBlob,
  normalizeAudioMimeType,
  getMicrophoneErrorMessage,
  isAudioFile,
  isIOSDevice,
  isVoiceRecordingSupported,
} from "@/lib/voiceRecording";

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
  const gotDataRef = useRef(false);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const setPreviewFromBlob = useCallback(
    (blob: Blob | null) => {
      revokePreviewUrl();
      setAudioBlob(blob);
      if (blob) {
        const playable = canPlayAudioBlob(blob);
        setCanPreview(playable);
        if (playable) {
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          setAudioUrl(url);
          setPreviewWarning(null);
        } else {
          setAudioUrl(null);
          setPreviewWarning(
            "Запис збережено. На iPhone прев'ю недоступне — це нормально. Можна надіслати ДЗ, викладач прослухає на комп'ютері.",
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
    gotDataRef.current = false;
  }, [revokePreviewUrl]);

  useEffect(() => {
    setCanRecord(isVoiceRecordingSupported());
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
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
    const rawBlob = new Blob(chunksRef.current, {
      type:
        mimeTypeRef.current ||
        recorder?.mimeType ||
        (isIOSDevice() ? "audio/mp4" : "audio/webm"),
    });
    const blob = new Blob([rawBlob], { type: normalizeAudioMimeType(rawBlob) });

    if (blob.size > 0) {
      setPreviewFromBlob(blob);
    } else {
      setError(
        "Запис порожній. Тримайте запис 3+ секунди або скористайтесь кнопкою «Записати (iPhone)» нижче.",
      );
    }

    stopStream();
    recorderRef.current = null;
    gotDataRef.current = false;
  };

  const startRecording = async () => {
    setError(null);
    setPreviewWarning(null);
    gotDataRef.current = false;

    if (!isVoiceRecordingSupported()) {
      setError(
        "Запис у браузері недоступний. Скористайтесь кнопкою «Записати (iPhone)» або завантажте файл.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      streamRef.current = stream;
      chunksRef.current = [];

      const { recorder, mimeType } = createAudioMediaRecorder(stream);
      mimeTypeRef.current = mimeType;
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          gotDataRef.current = true;
        }
      };

      recorder.onstop = () => {
        setTimeout(finalizeRecording, isIOSDevice() ? 350 : 50);
      };

      recorder.onerror = (event) => {
        console.warn("MediaRecorder error:", event);
        if (!gotDataRef.current && chunksRef.current.length === 0) {
          setError(
            "Помилка запису. Скористайтесь кнопкою «Записати (iPhone)» або завантажте m4a з Диктофона.",
          );
          setIsRecording(false);
          stopStream();
        }
      };

      // Safari на iOS надійніше віддає дані одним chunk при stop() без timeslice
      if (isIOSDevice()) {
        recorder.start();
      } else {
        try {
          recorder.start(1000);
        } catch {
          recorder.start();
        }
      }

      setIsRecording(true);
    } catch (err) {
      console.error("Помилка доступу до мікрофона:", err);
      setError(getMicrophoneErrorMessage(err));
      stopStream();
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        // Safari може не підтримувати requestData
      }
      recorder.stop();
    }
    setIsRecording(false);
  };

  const loadAudioFile = (file: File) => {
    if (!isAudioFile(file)) {
      setError("Оберіть аудіофайл (m4a, mp3, wav тощо).");
      return;
    }
    setError(null);
    setPreviewFromBlob(file);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    audioBlob,
    audioUrl,
    isRecording,
    recordingTime,
    error,
    previewWarning,
    canPreview,
    canRecord,
    startRecording,
    stopRecording,
    clearRecording,
    loadAudioFile,
    formatTime,
  };
}
