import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/listening";

export type AudioPlayerHandle = {
  /** Play a section (seconds). Stops automatically at `end`. */
  playSegment: (start: number, end?: number) => void;
};

const SPEEDS = [0.75, 1, 1.25];

const AudioPlayer = forwardRef<AudioPlayerHandle, { src: string; title?: string }>(({ src, title }, ref) => {
  const audio = useRef<HTMLAudioElement>(null);
  const stopAt = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);

  useImperativeHandle(ref, () => ({
    playSegment: (start, end) => {
      const a = audio.current;
      if (!a) return;
      a.currentTime = Math.max(0, start - 0.1);
      stopAt.current = end ? end + 0.15 : null;
      void a.play();
    },
  }));

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
      audio.current.muted = muted;
    }
  }, [volume, muted]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    stopAt.current = null;
    if (a.paused) void a.play();
    else a.pause();
  };

  const replay = () => {
    const a = audio.current;
    if (!a) return;
    stopAt.current = null;
    a.currentTime = 0;
    void a.play();
  };

  return (
    <div className="rounded-3xl border border-border/60 bg-cream/90 backdrop-blur-md shadow-postcard p-5 sm:p-7">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTime(t);
          if (stopAt.current !== null && t >= stopAt.current) {
            e.currentTarget.pause();
            stopAt.current = null;
          }
        }}
      />
      {title && <p className="font-script italic text-sm text-primary/60 mb-3">{title}</p>}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pauza" : "Pusti"}
          className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-card-soft transition-transform hover:scale-105"
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
        </button>
        <div className="flex-1 min-w-0">
          <Slider
            value={[time]}
            max={duration || 1}
            step={0.1}
            onValueChange={([v]) => {
              if (audio.current) audio.current.currentTime = v;
            }}
            aria-label="Napredak snimka"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatTime(time)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 justify-between">
        <button type="button" onClick={replay} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <RotateCcw className="w-4 h-4" /> Ponovo
        </button>
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/60 p-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                speed === s ? "bg-primary text-primary-foreground" : "text-primary/70 hover:text-primary",
              )}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 w-36">
          <button type="button" onClick={() => setMuted((m) => !m)} aria-label="Zvuk" className="text-primary/70">
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <Slider value={[muted ? 0 : volume]} max={1} step={0.05} onValueChange={([v]) => { setVolume(v); setMuted(false); }} aria-label="Jačina zvuka" />
        </div>
      </div>
    </div>
  );
});
AudioPlayer.displayName = "AudioPlayer";
export default AudioPlayer;
