import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CustomCursor = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorHover, setCursorHover] = useState(false);

  useEffect(() => {
    const move = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);

    const hoverables = document.querySelectorAll("button, a, input, [data-hover]");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", () => setCursorHover(true));
      el.addEventListener("mouseleave", () => setCursorHover(false));
    });

    return () => {
      window.removeEventListener("mousemove", move);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", () => setCursorHover(true));
        el.removeEventListener("mouseleave", () => setCursorHover(false));
      });
    };
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      animate={{
        x: cursorPos.x - 10,
        y: cursorPos.y - 10,
        scale: cursorHover ? 1.6 : 1,
        opacity: cursorHover ? 1 : 0.9,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="relative">
        {/* Outer glow ring */}
        <div className="w-6 h-6 rounded-full border border-cyan-400 opacity-90 blur-[1px] shadow-[0_0_12px_3px_rgba(0,255,255,0.8)]"></div>
        {/* Inner core */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_4px_rgba(0,255,255,0.7)] -translate-x-1/2 -translate-y-1/2"></div>
      </div>
    </motion.div>
  );
};

export default CustomCursor;
