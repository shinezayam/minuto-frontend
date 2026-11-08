"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  max: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
}

export function Slider({ value, max, step = 1, onValueChange, className }: SliderProps) {
  const currentValue = value[0] || 0;
  const percentage = (currentValue / max) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange?.([newValue]);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-primary/20"
        style={{
          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--primary) / 0.2) ${percentage}%, hsl(var(--primary) / 0.2) 100%)`,
        }}
      />
    </div>
  );
}
