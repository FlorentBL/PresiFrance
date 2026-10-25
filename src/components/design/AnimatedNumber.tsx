import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Nombre de décimales affichées. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Durée en secondes. */
  duration?: number;
  className?: string;
  locale?: string;
}

/** Compteur qui s'anime de 0 à `value` quand il entre dans le viewport. Valeur finale directe si prefers-reduced-motion. */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className,
  locale = "fr-FR",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setCurrent(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setCurrent,
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const text = current.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {text}
        {suffix}
      </span>
    </span>
  );
}

export default AnimatedNumber;
