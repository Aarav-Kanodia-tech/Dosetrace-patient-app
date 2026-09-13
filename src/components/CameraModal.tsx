import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, TimerReset, X, CircleAlert, ScanLine } from 'lucide-react';
import { useEscapeKey } from '@/lib/useEscapeKey';

export type CameraMode = 'refill' | 'prescription';

type CameraModalProps = {
  mode: CameraMode;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  error: string | null;
  setError: (value: string | null) => void;
};

export function CameraModal({ mode, onClose, onCapture, error, setError }: CameraModalProps) {
  useEscapeKey(onClose);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  const title = mode === 'prescription' ? 'Scan Prescription' : 'Scan Refill';
  const hint = mode === 'prescription' ? 'Align prescription text within the frame' : 'Align medicine label within the frame';

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not supported in this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to access camera.';
        setError(message);
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [setError]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  function capturePhoto(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  function handleCapture() {
    const dataUrl = capturePhoto();
    stopCamera();
    if (dataUrl) {
      onCapture(dataUrl);
    } else {
      handleClose();
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        stopCamera();
        onCapture(result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <canvas ref={canvasRef} className="hidden" />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <Camera size={18} className="text-emerald-400" />
            <span className="text-sm font-bold">{title} — Live Camera</span>
          </div>
          <button
            aria-label="Close camera"
            onClick={handleClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-[3/4] w-full bg-slate-950">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${ready ? 'opacity-100' : 'opacity-0'}`}
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <TimerReset className="animate-spin" size={28} />
              <p className="text-xs font-medium">Starting camera…</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
              <CircleAlert size={28} className="text-amber-400" />
              <p className="text-xs font-medium">{error}</p>
              <p className="text-[10px] text-slate-500">
                Allow camera access in your browser, or upload a photo instead.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-600"
              >
                <ImagePlus size={15} /> Upload photo instead
              </button>
            </div>
          )}
          {ready && !error && (
            <>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-52 w-60 rounded-2xl border-2 border-emerald-400/80 shadow-[0_0_0_2000px_rgba(2,6,23,0.45)]" />
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-medium text-emerald-300">
                {hint}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button
            onClick={handleClose}
            className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!ready || !!error}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ScanLine size={15} /> Capture
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
