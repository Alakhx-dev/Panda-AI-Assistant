import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

export const CursorGlow = () => {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouse = useCallback((e: MouseEvent) => {
    requestAnimationFrame(() => {
      setMousePos({ x: e.clientX, y: e.clientY });
    });
  }, []);

  useEffect(() => {
    if (isMobile) return;
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [isMobile, handleMouse]);

  if (isMobile) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="absolute rounded-full"
        style={{
          left: mousePos.x - 250,
          top: mousePos.y - 250,
          width: 500,
          height: 500,
          background: `radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, hsl(var(--secondary) / 0.05) 35%, transparent 65%)`,
          transition: "left 0.12s cubic-bezier(0.25, 0.1, 0.25, 1), top 0.12s cubic-bezier(0.25, 0.1, 0.25, 1)",
          willChange: "left, top",
        }}
      />
    </motion.div>
  );
};
