"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  /** 0-1 утга, одоогийн audio level */
  level: number;
  /** Идэвхтэй эсэх (бичиж байгаа эсэх) */
  active?: boolean;
  /** Өндөр */
  height?: number;
  /** Өнгө */
  color?: string;
  className?: string;
}

export function AudioWaveform({
  level,
  active = false,
  height = 40,
  color = "currentColor",
  className,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const barCount = 32;
    const gap = 2;

    // Initialize bars if needed
    if (barsRef.current.length !== barCount) {
      barsRef.current = Array(barCount).fill(0);
    }

    const draw = () => {
      const { width, height: h } = canvas;
      ctx.clearRect(0, 0, width, h);

      const barWidth = (width - (barCount - 1) * gap) / barCount;

      // Update bars with smooth animation
      for (let i = 0; i < barCount; i++) {
        // Create wave pattern based on level
        const targetHeight = active
          ? level * h * (0.3 + 0.7 * Math.sin((i / barCount) * Math.PI))
          : h * 0.1;

        // Smooth transition
        barsRef.current[i] += (targetHeight - barsRef.current[i]) * 0.15;

        const barHeight = Math.max(2, barsRef.current[i]);
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;

        // Draw bar with rounded ends
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + 0.4 * (barHeight / h);
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      ctx.globalAlpha = 1;

      if (active) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    if (active) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, active, color, height]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      className={cn("w-full", className)}
      style={{ height: `${height}px` }}
    />
  );
}
