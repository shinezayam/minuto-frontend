"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onError?: () => void;
}

export interface AudioPlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  function AudioPlayer({ src, onTimeUpdate, onError }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = seconds;
        setCurrentTime(seconds);
      }
    },
    play: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rate = parseFloat(e.target.value);
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <audio ref={audioRef} src={src} preload="metadata" onError={onError} />

      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Skip back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="h-8 w-8"
            title="10 секунд ухраах"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>

          {/* Skip forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="h-8 w-8"
            title="10 секунд урагшлуулах"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Volume */}
          <div className="ml-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20 cursor-pointer"
            />
          </div>

          {/* Playback speed */}
          <div className="ml-auto">
            <select
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
});
