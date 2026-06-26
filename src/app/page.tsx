'use client';

import { useState, useRef, useCallback } from 'react';

const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL ?? '';

interface SourceQuality {
  sampleRate: number | null;
  bitDepth: number | null;
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState('');
  const [quality, setQuality] = useState<SourceQuality>({ sampleRate: null, bitDepth: null });
  const [loading, setLoading] = useState(false);

  const detectQuality = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
      const src = audioCtxRef.current.createMediaElementSource(audio);
      src.connect(audioCtxRef.current.destination);
    }

    let bitDepth: number | null = null;
    try {
      // captureStream gives access to the actual media track settings
      const stream = (audio as HTMLAudioElement & { captureStream?: () => MediaStream }).captureStream?.();
      const tracks = stream?.getAudioTracks?.() ?? [];
      if (tracks.length > 0) {
        const settings = tracks[0].getSettings() as MediaTrackSettings & { sampleSize?: number };
        bitDepth = settings.sampleSize ?? null;
      }
    } catch {
      // captureStream is not available in all environments
    }

    setQuality({
      sampleRate: audioCtxRef.current.sampleRate,
      bitDepth,
    });
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setLoading(true);
      try {
        detectQuality();
        await audio.play();
        setIsPlaying(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatQuality = (): string => {
    const parts: string[] = [];
    if (quality.bitDepth != null) parts.push(`${quality.bitDepth}-bit`);
    if (quality.sampleRate != null) parts.push(`${quality.sampleRate / 1000} kHz`);
    return parts.length > 0 ? parts.join(' ') : '—';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-8">
      <main className="flex w-full max-w-sm flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">radio calico</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">internet radio</p>
        </div>

        <div className="rounded-2xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4">
          <div className="min-h-[3rem] flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              now playing
            </p>
            <p className="mt-1 text-base font-medium truncate">
              {nowPlaying || (isPlaying ? 'Live stream' : '—')}
            </p>
          </div>

          <button
            onClick={toggle}
            disabled={loading || !STREAM_URL}
            className="flex h-14 w-full items-center justify-center rounded-xl bg-foreground text-background text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting…' : isPlaying ? 'Stop' : 'Play'}
          </button>

          {!STREAM_URL && (
            <p className="text-xs text-center text-red-500">
              Set <code>NEXT_PUBLIC_STREAM_URL</code> to enable playback.
            </p>
          )}

          <div className="border-t border-black/[.06] dark:border-white/[.08] pt-4">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              source quality
            </p>
            <p className="mt-1 text-sm font-mono">
              {isPlaying ? formatQuality() : '—'}
            </p>
          </div>
        </div>
      </main>

      <audio
        ref={audioRef}
        src={STREAM_URL}
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setLoading(false)}
      />
    </div>
  );
}
