import { cn } from "@/lib/utils";

/** Minuto-гийн долгион тэмдэг (Logo/Minuto_logo-icon.png-ийн вектор хувилбар). */
const BARS = [
  { x: 0, h: 12.8 },
  { x: 10.5, h: 26.2 },
  { x: 21, h: 42 },
  { x: 31.5, h: 26.2 },
  { x: 42, h: 12.8 },
];

export function LogoMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 49 42"
      fill="currentColor"
      aria-hidden="true"
      className={cn("h-6 w-auto", className)}
    >
      {BARS.map((b, i) => (
        <rect
          key={b.x}
          x={b.x}
          y={21 - b.h / 2}
          width={7}
          height={b.h}
          rx={3.5}
          className={animated ? "minuto-bar" : undefined}
          style={animated ? { animationDelay: `${i * 0.12}s` } : undefined}
        />
      ))}
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn("h-6", markClassName)} />
      <span className="font-display text-xl font-bold tracking-tight">Minuto</span>
    </span>
  );
}
