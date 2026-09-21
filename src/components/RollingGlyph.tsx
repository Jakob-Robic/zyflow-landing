import { useEffect, useState } from "react";

interface Props {
  glyphs: string[];
  intervalMs?: number;
}

export default function RollingGlyph({ glyphs, intervalMs = 2800 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || glyphs.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % glyphs.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [glyphs, intervalMs]);

  return (
    <span className="rolling-glyph" aria-hidden="true">
      {glyphs[index]}
    </span>
  );
}
