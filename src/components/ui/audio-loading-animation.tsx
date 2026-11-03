"use client";

export function AudioLoadingAnimation({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative flex items-center gap-1">
        {/* Animated waveform bars */}
        <div className="flex items-end gap-[3px]">
          {[0, 1, 2, 3, 4, 3, 2, 1, 0].map((height, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-primary"
              style={{
                height: `${20 + height * 8}px`,
                animation: `waveform 1.2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes waveform {
          0%, 100% {
            transform: scaleY(0.3);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
