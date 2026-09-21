import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

interface Props {
  value: string;
  className?: string;
}

function parseValue(raw: string): { end: number; prefix: string; suffix: string } {
  const match = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!match) return { end: 0, prefix: "", suffix: raw };
  return {
    prefix: match[1] ?? "",
    end: Number(match[2].replace(/,/g, "")),
    suffix: match[3] ?? "",
  };
}

export default function RollingNumber({ value, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const { end, prefix, suffix } = parseValue(value);

  useEffect(() => {
    if (!ref.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !inView) {
      ref.current.textContent = value;
      return;
    }
    const controls = animate(0, end, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (!ref.current) return;
        const rounded = end >= 100 ? Math.round(latest) : Math.round(latest * 10) / 10;
        ref.current.textContent = `${prefix}${rounded.toLocaleString()}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [end, inView, prefix, suffix, value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
