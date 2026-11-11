"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ServerWakingBanner() {
  const [isWaking, setIsWaking] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const handleWaking = () => {
      setIsWaking(true);
      setSeconds(0);
    };
    const handleReady = () => {
      setIsWaking(false);
      setSeconds(0);
    };

    window.addEventListener("proofsy:server-waking", handleWaking);
    window.addEventListener("proofsy:server-ready", handleReady);

    return () => {
      window.removeEventListener("proofsy:server-waking", handleWaking);
      window.removeEventListener("proofsy:server-ready", handleReady);
    };
  }, []);

  useEffect(() => {
    if (!isWaking) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWaking]);

  return (
    <AnimatePresence>
      {isWaking && (
        <motion.aside
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-[100] bg-indigo-950/95 backdrop-blur-md text-white border-b border-indigo-500/40 px-4 py-2.5 shadow-xl flex items-center justify-center gap-3 text-xs"
        >
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          <span className="font-medium">
            <strong>Waking server from sleep...</strong> The backend is spinning up from Render free tier ({seconds}s elapsed). Thanks for your patience!
          </span>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

