"use client";

import React, { useEffect, useId, useState } from "react";
import { CheckCircle, Headphones, Mic, StopCircle, Upload, Volume2 } from "lucide-react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { formatAudioDuration, isIOSDevice } from "@/lib/voiceRecording";

interface VoiceHomeworkRecorderProps {
  isDarkMode?: boolean;
  onAudioChange: (blob: Blob | null) => void;
  resetKey?: number;
}

export default function VoiceHomeworkRecorder({
  isDarkMode = false,
  onAudioChange,
  resetKey = 0,
}: VoiceHomeworkRecorderProps) {
  const fileInputId = useId();
  const iosCaptureInputId = useId();
  const [isIOS] = useState(() => isIOSDevice());

  const {
    audioUrl,
    audioBlob,
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
  } = useVoiceRecorder();

  useEffect(() => {
    onAudioChange(audioBlob);
  }, [audioBlob, onAudioChange]);

  useEffect(() => {
    if (resetKey > 0) {
      clearRecording();
    }
  }, [resetKey, clearRecording]);

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) loadAudioFile(file);
    event.target.value = "";
  };

  const cardBg = isDarkMode ? "#2d2f2a" : "#fff";
  const border = isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4";
  const textColor = isDarkMode ? "rgb(250, 249, 246)" : "#5c574a";
  const hasRecording = !!audioBlob && audioBlob.size > 0;

  return (
    <div
      style={{
        background: cardBg,
        padding: 16,
        borderRadius: 8,
        border,
        marginBottom: 16,
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 14,
          fontWeight: 600,
          color: textColor,
        }}
      >
        <Headphones size={16} style={{ display: "inline", marginRight: 6 }} />
        Голосова відповідь
      </p>

      {error && !hasRecording && (
        <p
          style={{
            margin: "0 0 12px",
            padding: "10px 12px",
            borderRadius: 6,
            background: isDarkMode ? "rgba(201, 122, 74, 0.15)" : "#fdf8f5",
            border: "1px solid #facbce",
            color: isDarkMode ? "#facbce" : "#9a4a2a",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {error}
        </p>
      )}

      {!hasRecording ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          {isIOS && (
            <div style={{ width: "100%" }}>
              <input
                id={iosCaptureInputId}
                type="file"
                accept="audio/*"
                capture="user"
                onChange={handleFilePick}
                style={{ display: "none" }}
              />
              <label
                htmlFor={iosCaptureInputId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "#8a8a45",
                  color: "#fff",
                  border: "none",
                  fontSize: 15,
                }}
              >
                <Mic size={18} />
                Записати голос (рекомендовано для iPhone)
              </label>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 12,
                  color: isDarkMode ? "#a3a198" : "#7a7568",
                  lineHeight: 1.4,
                }}
              >
                Відкриється мікрофон iPhone — після запису файл одразу прикріпиться.
              </p>
            </div>
          )}

          {canRecord && (
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  style={{
                    background: isIOS ? (isDarkMode ? "#2a2c27" : "#f0ede5") : "#8a8a45",
                    color: isIOS ? "#8a8a45" : "#fff",
                    border: isIOS ? "1px solid #8a8a45" : "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Volume2 size={16} />
                  {isIOS ? "Альтернатива: запис у браузері" : "Почати запис"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: "#c97a4a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <StopCircle size={16} /> Зупинити ({formatTime(recordingTime)})
                </button>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              id={fileInputId}
              type="file"
              accept="audio/*,.m4a,.mp3,.wav,.aac,.webm,.ogg,.mp4,.caf"
              onChange={handleFilePick}
              style={{ display: "none" }}
            />
            <label
              htmlFor={fileInputId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                background: isDarkMode ? "#2a2c27" : "#f0ede5",
                color: "#8a8a45",
                border: "1px solid #8a8a45",
              }}
            >
              <Upload size={16} />
              Завантажити аудіофайл з телефону
            </label>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: isDarkMode ? "rgba(138, 138, 69, 0.2)" : "#eef0df",
              border: "1px solid #8a8a45",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CheckCircle size={20} color="#8a8a45" />
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 14,
                  color: isDarkMode ? "#e6e4dc" : "#3a3528",
                }}
              >
                Голосове записано
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: isDarkMode ? "#a3a198" : "#7a7568" }}>
                Розмір: {Math.max(1, Math.round(audioBlob.size / 1024))} КБ
                {recordingTime > 0 ? ` · ~${formatAudioDuration(recordingTime)}` : ""}
              </p>
            </div>
          </div>

          {previewWarning && (
            <p
              style={{
                margin: 0,
                padding: "10px 12px",
                borderRadius: 6,
                background: isDarkMode ? "rgba(138, 138, 69, 0.15)" : "#eef0df",
                border: "1px solid #8a8a45",
                color: isDarkMode ? "#d8cdb4" : "#6b6b3a",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {previewWarning}
            </p>
          )}

          {canPreview && audioUrl && (
            <audio
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", height: 40 }}
              src={audioUrl}
            >
              Ваш браузер не підтримує аудіо.
            </audio>
          )}

          <button
            type="button"
            onClick={clearRecording}
            style={{
              background: "#f0ede5",
              color: "#8a8a45",
              border: "1px solid #8a8a45",
              padding: "8px 16px",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
            }}
          >
            <Volume2 size={14} /> Перезаписати
          </button>
        </div>
      )}
    </div>
  );
}
