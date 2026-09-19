"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Mic, Square, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { portalAccess } from "@/lib/types";

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Encodes raw PCM samples as a standard 16-bit mono WAV file. We record via
// this instead of MediaRecorder's built-in webm/opus or mp4/aac encoders —
// on some Android/iOS combinations those encoders silently produce a file
// with correct duration but no audible sound (a known browser-level bug,
// not a mic problem). Writing the WAV bytes ourselves from the raw samples
// sidesteps that codec path entirely, so whatever the mic captured is what
// gets saved, bit for bit.
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: "audio/wav" });
}

// Decodes a recording and checks its loudest sample across the whole clip.
// A final safety net (on top of the WAV fix above) for the rare case where
// the mic itself captured nothing — wrong input device selected, hardware
// mute, OS-level mic block, etc. Returns true if the recording is silent.
async function isEffectivelySilent(blob: Blob): Promise<boolean> {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;
    const ctx = new AC();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    let peak = 0;
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < data.length; i += 50) {
        const v = Math.abs(data[i]);
        if (v > peak) peak = v;
      }
    }
    ctx.close();
    return peak < 0.02;
  } catch {
    return false;
  }
}

// Uploads to the "qirat-audio" Supabase Storage bucket and returns a public
// URL, when real credentials are configured. Falls back to an in-browser
// base64 data URL (works, but doesn't persist beyond this device/session)
// when Supabase isn't set up yet — so the feature keeps working either way.
async function uploadRecording(
  studentId: string,
  testNumber: number,
  kind: "qirat" | "tajweed",
  blob: Blob,
  ext: string
): Promise<string> {
  if (supabaseConfigured) {
    const path = `${studentId}/test-${testNumber}-${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("qirat-audio").upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: blob.type || undefined,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = supabase.storage.from("qirat-audio").getPublicUrl(path);
    return data.publicUrl;
  }
  return fileToDataUrl(blob);
}

export default function RecitationAudioPage() {
  const { students, auth, getAudioSubmission, submitAudio } = useStore();
  const student = students.find((s) => s.id === auth.studentId);

  // All hooks live here, unconditionally, before any early return below —
  // a previous version declared one of these after a conditional return,
  // which violates React's Rules of Hooks and can crash intermittently.
  const [uploading, setUploading] = useState<"qirat" | "tajweed" | null>(null);
  const [recording, setRecording] = useState<"qirat" | "tajweed" | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState("");
  const [silentWarning, setSilentWarning] = useState<{ kind: "qirat" | "tajweed"; blob: Blob; ext: string } | null>(null);
  const qiratInput = useRef<HTMLInputElement>(null);
  const tajweedInput = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const recordingKindRef = useRef<"qirat" | "tajweed" | null>(null);

  if (!student) return null;

  const needsAudio = portalAccess(student).showAudio;
  if (!needsAudio) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Recitation Audio</p>
        <p className="text-sm text-[var(--ink-faint)]">
          Recitation audio isn&apos;t part of the {student.course} course.
        </p>
      </div>
    );
  }

  const nextTestNumber = Math.max(0, ...student.results.map((r) => r.testNumber)) + 1;
  const submission = getAudioSubmission(student.id, nextTestNumber);
  const qiratDone = !!submission?.qiratUrl;
  const tajweedDone = !!submission?.tajweedUrl;

  const saveRecording = async (kind: "qirat" | "tajweed", blob: Blob, ext: string, skipSilenceCheck = false) => {
    setError("");
    if (blob.size > 15 * 1024 * 1024) {
      setError("Recording is too large — please keep it under 15MB (shorter recitation).");
      return;
    }
    if (!skipSilenceCheck) {
      setUploading(kind);
      const silent = await isEffectivelySilent(blob);
      setUploading(null);
      if (silent) {
        setSilentWarning({ kind, blob, ext });
        return;
      }
    }
    setUploading(kind);
    try {
      const url = await uploadRecording(student.id, nextTestNumber, kind, blob, ext);
      submitAudio(student.id, nextTestNumber, kind, url);
      setSilentWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleFileUpload = (kind: "qirat" | "tajweed", file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("audio/")) {
      setError("Please choose an audio file (e.g. .mp3, .m4a, .wav).");
      return;
    }
    const ext = file.name.split(".").pop() || "mp3";
    saveRecording(kind, file, ext);
  };

  const startRecording = async (kind: "qirat" | "tajweed") => {
    setError("");
    try {
      // noiseSuppression:false — the default "on" setting is tuned for
      // calls and can mistake quiet recitation for background noise.
      // autoGainControl boosts a quiet voice back up instead.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: true },
      });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      // getUserMedia's permission prompt above is an async pause, so by the
      // time we get here the browser may no longer treat this as directly
      // tied to your click — some browsers respond to that by creating the
      // AudioContext already "suspended" (silently capturing nothing, even
      // though everything else looks normal). Explicitly resuming it here,
      // and refusing to proceed if it won't wake up, is what a silent
      // recording with a correct duration usually traces back to.
      await ctx.resume();
      if (ctx.state !== "running") {
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        setError("Your browser blocked audio capture (context stayed suspended) — please try again.");
        return;
      }
      const source = ctx.createMediaStreamSource(stream);
      // ScriptProcessorNode needs to be connected to a destination to fire
      // in every browser. Routing it through a silent (gain 0) node avoids
      // the student hearing their own voice echoed back while recording.
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;

      pcmChunksRef.current = [];
      processor.onaudioprocess = (e) => {
        pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceRef.current = source;
      processorRef.current = processor;
      streamRef.current = stream;
      recordingKindRef.current = kind;

      setRecording(kind);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access your microphone — please allow mic access, or upload a file instead.");
    }
  };

  const stopRecording = () => {
    const ctx = audioCtxRef.current;
    const kind = recordingKindRef.current;
    if (!ctx || !kind) return;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);

    const chunks = pcmChunksRef.current;
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);

    audioCtxRef.current = null;
    recordingKindRef.current = null;
    pcmChunksRef.current = [];
    setRecording(null);
    setRecordSeconds(0);

    if (totalLength === 0) {
      ctx.close();
      setError(
        "No audio was captured at all — the microphone connection never delivered any samples. Try a different microphone, or use Choose file instead."
      );
      return;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    const sampleRate = ctx.sampleRate;
    const blob = encodeWav(merged, sampleRate);
    ctx.close();
    saveRecording(kind, blob, "wav");
  };

  const canRecord =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wide uppercase text-[var(--gold)]">Recitation Audio</p>
        <h1 className="font-display text-3xl mt-1 text-[var(--heading)]">
          Upload for Test {nextTestNumber}
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-2 max-w-xl">
          Tap <strong>Record</strong> to record right here — it saves and uploads automatically the
          moment you stop, no extra step needed. Only use <strong>Choose file</strong> if you already
          have a recording saved on your device (e.g. from your phone&apos;s voice recorder).
        </p>
        {!supabaseConfigured && (
          <p className="text-xs text-[var(--gold)] mt-2">
            Note: Supabase isn&apos;t configured yet, so recordings are only saved on this device for now.
          </p>
        )}
      </div>

      {(!qiratDone || !tajweedDone) && (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--gold-soft)] border border-[var(--gold)]/30 p-4">
          <AlertTriangle size={18} className="text-[var(--gold)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--ink)]">
            Both recordings are required for this test to be marked complete. Missing:{" "}
            {[!qiratDone && "Qirat", !tajweedDone && "Tajweed"].filter(Boolean).join(" and ")}.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--rose-tint)] border border-[var(--rose)]/30 p-4">
          <AlertTriangle size={18} className="text-[var(--rose)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--rose)]">{error}</p>
        </div>
      )}

      {silentWarning && (
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--rose-tint)] border border-[var(--rose)]/30 p-4">
          <AlertTriangle size={18} className="text-[var(--rose)] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-[var(--rose)] font-medium">
              This {silentWarning.kind === "qirat" ? "Qirat" : "Tajweed"} recording sounds silent.
            </p>
            <p className="text-xs text-[var(--rose)]/90 mt-1">
              It plays back with no audible sound — check that the right microphone is selected and
              isn&apos;t muted, then re-record. If you&apos;re sure this is fine (e.g. very quiet
              recitation), you can upload it anyway.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setSilentWarning(null)}
                className="px-4 py-1.5 rounded-full bg-[var(--rose)] text-white text-xs font-semibold"
              >
                Re-record
              </button>
              <button
                type="button"
                onClick={() => {
                  const { kind, blob, ext } = silentWarning;
                  setSilentWarning(null);
                  saveRecording(kind, blob, ext, true);
                }}
                className="px-4 py-1.5 rounded-full border border-[var(--rose)]/40 text-[var(--rose)] text-xs font-semibold"
              >
                Upload anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {(
          [
            { kind: "qirat" as const, label: "Qirat Recitation", ref: qiratInput, done: qiratDone, url: submission?.qiratUrl },
            { kind: "tajweed" as const, label: "Tajweed Recitation", ref: tajweedInput, done: tajweedDone, url: submission?.tajweedUrl },
          ]
        ).map((row) => {
          const isRecordingThis = recording === row.kind;
          const isBusy = uploading === row.kind || (recording !== null && recording !== row.kind);
          return (
            <div key={row.kind} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    row.done ? "bg-[var(--primary-tint)] text-[var(--link)]" : "bg-[var(--bg)] text-[var(--ink-faint)]"
                  }`}
                >
                  {row.done ? <CheckCircle2 size={16} /> : <Mic size={16} />}
                </div>
                <p className="font-semibold text-[var(--ink)]">{row.label}</p>
              </div>

              {row.url && (
                <audio controls src={row.url} className="w-full mt-4">
                  Your browser does not support audio playback.
                </audio>
              )}

              {isRecordingThis && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[var(--rose)] text-sm font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--rose)] animate-pulse" />
                  Recording… {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, "0")}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {canRecord && (
                  <button
                    type="button"
                    onClick={() => (isRecordingThis ? stopRecording() : startRecording(row.kind))}
                    disabled={isBusy && !isRecordingThis}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 ${
                      isRecordingThis
                        ? "bg-[var(--rose)] text-white"
                        : "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                    }`}
                  >
                    {isRecordingThis ? (
                      <>
                        <Square size={14} /> Stop &amp; Save
                      </>
                    ) : (
                      <>
                        <Mic size={14} /> Record
                      </>
                    )}
                  </button>
                )}

                <input
                  ref={row.ref}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(row.kind, e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => row.ref.current?.click()}
                  disabled={isBusy}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[var(--line)] text-sm font-medium text-[var(--heading)] hover:border-[var(--primary)] disabled:opacity-50"
                >
                  <Upload size={14} />
                  {uploading === row.kind ? "Uploading…" : "Choose file"}
                </button>
              </div>
              {row.done && !isRecordingThis && (
                <p className="text-xs text-[var(--ink-faint)] mt-2 text-center">
                  Recording saved — recording or uploading again will replace it.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
