import React, { useEffect } from 'react';

export default function IntroSplash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 15000); // safety: never block the app
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0f19]">
      <video
        src="/fraudora_vid.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onDone}
        onError={onDone}
        className="h-full w-full object-cover"
      />
      <button
        onClick={onDone}
        className="absolute bottom-6 right-6 rounded-full border border-[#374151] bg-[#0b0f19]/70 px-4 py-2 text-sm text-[#9ca3af] backdrop-blur transition hover:text-[#f9fafb]"
      >
        Skip
      </button>
    </div>
  );
}