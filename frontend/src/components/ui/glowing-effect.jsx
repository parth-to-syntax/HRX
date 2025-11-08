"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function GlowingEffect({
  spread = 40,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  borderWidth = 3,
  className,
}) {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 rounded-[inherit] pointer-events-none", className)}
      style={{
        opacity: isHovering && glow && !disabled ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(${spread}px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(13, 148, 136, 0.4), transparent ${proximity}%)`,
          pointerEvents: "none",
        }}
      />
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow: isHovering && glow && !disabled
            ? `0 0 ${borderWidth}px rgba(13, 148, 136, 0.6), inset 0 0 ${borderWidth}px rgba(13, 148, 136, 0.3)`
            : "none",
          transition: "box-shadow 0.3s ease",
        }}
      />
    </div>
  );
}
