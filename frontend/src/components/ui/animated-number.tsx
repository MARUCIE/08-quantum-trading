"use client";

/**
 * Animated Number Component
 *
 * Displays numbers with smooth animation when values change.
 * Useful for live price updates and real-time data.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  duration?: number;
  showChange?: boolean;
}

export function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString(),
  className,
  duration = 500,
  showChange = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const [changeDirection, setChangeDirection] = useState<"up" | "down" | null>(
    null
  );
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    // Determine change direction
    if (showChange) {
      setChangeDirection(endValue > startValue ? "up" : "down");
      setIsAnimating(true);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
        // Reset animation state after a short delay
        setTimeout(() => {
          setIsAnimating(false);
          setChangeDirection(null);
        }, 300);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, showChange]);

  return (
    <span
      className={cn(
        "tabular-nums transition-colors duration-300",
        isAnimating && changeDirection === "up" && "text-profit",
        isAnimating && changeDirection === "down" && "text-loss",
        className
      )}
    >
      {format(displayValue)}
    </span>
  );
}

/**
 * Animated Currency Component
 *
 * Specialized version for currency display.
 */
interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  className?: string;
  showChange?: boolean;
}

export function AnimatedCurrency({
  value,
  currency = "USD",
  className,
  showChange = false,
}: AnimatedCurrencyProps) {
  const format = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <AnimatedNumber
      value={value}
      format={format}
      className={className}
      showChange={showChange}
    />
  );
}

/**
 * Animated Percentage Component
 *
 * Specialized version for percentage display.
 */
interface AnimatedPercentProps {
  value: number;
  className?: string;
  showSign?: boolean;
  showChange?: boolean;
}

export function AnimatedPercent({
  value,
  className,
  showSign = true,
  showChange = false,
}: AnimatedPercentProps) {
  const format = (v: number) => {
    const sign = showSign && v >= 0 ? "+" : "";
    return `${sign}${v.toFixed(2)}%`;
  };

  return (
    <AnimatedNumber
      value={value}
      format={format}
      className={className}
      showChange={showChange}
    />
  );
}
