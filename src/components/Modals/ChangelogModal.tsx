"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ChangelogModal({
  showChangelogModal,
  dismissChangelogModal,
  activeTheme,
  cornerStyle,
  reducedMotion,
  currentVersion
}: any) {
  if (!showChangelogModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismissChangelogModal} className="absolute inset-0 bg-black/80 backdrop-blur-xl"></motion.div>
        <motion.div initial={{ scale: reducedMotion ? 1 : 0.9, opacity: 0, y: reducedMotion ? 0 : 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: reducedMotion ? 1 : 0.9, opacity: 0, y: reducedMotion ? 0 : 20 }} className={`bg-black/60 backdrop-blur-2xl border border-white/10 ${cornerStyle} p-6 sm:p-8 max-w-lg w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative z-10 flex flex-col gap-4`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${cornerStyle} ${activeTheme.bg} ${activeTheme.text} border ${activeTheme.border}`}><Sparkles className={`w-6 h-6 ${reducedMotion ? '' : 'animate-pulse'}`} /></div>
              <div><h2 className="text-base font-black text-white uppercase tracking-widest">SYSTEM CHANGE LOG</h2><span className={`text-[10px] ${activeTheme.text} font-mono uppercase tracking-wider block font-bold`}>Version {currentVersion} Live Release</span></div>
            </div>
            <button type="button" onClick={dismissChangelogModal} className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="space-y-3 py-1 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 shadow-inner">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${activeTheme.text} mb-2 flex items-center gap-1.5`}><ShieldCheck className="w-3.5 h-3.5"/> Rural E-Rides GO v{currentVersion} Master Changelog</h3>
              <ul className="text-[11px] text-zinc-300 space-y-3 font-medium list-none">
                <li className="flex gap-2">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 ${activeTheme.text} shrink-0`}/> 
                  <div>
                    <strong className="text-white text-xs">Google One-Tap Auth Integration:</strong> Securely link your account and bypass passwords entirely with Google Sign-In.<br/>
                    <span className="text-amber-400 font-bold tracking-wide mt-1 block">⚠️ IMPORTANT: If you register using standard email instead of Google, you MUST check your SPAM or Junk folder for your 6-digit access code!</span>
                  </div>
                </li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>Deep AI Telemetry Upgrades:</strong> Upgraded neural net cloud scanning for real-time ride diagnostics, thermal stress indexing, KERS regen harvesting, and AI-learned range efficiency.</li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>IMU Crash Detection & Auto-SOS:</strong> Accelerometer monitoring with a 10-second countdown timer and automatic SMS emergency dispatch.</li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>Live Pinpoint Speed Limit Engine:</strong> Commercial TomTom and open-source OSM data lookup with real-time school zone alerts.</li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>Live Open-Meteo AQI & Solar UV Suite:</strong> Real-time air quality and ultraviolet index tracking piped into the cockpit and radar HUD.</li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>Strict Hardware Magnetometer Lock:</strong> 60fps GPU-accelerated compass orientation tracking with a tactical vision cone.</li>
                <li className="flex gap-2"><CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${activeTheme.text} shrink-0`}/> <strong>Community Board Mission Broadcasting:</strong> One-tap GPX run export and mission broadcast directly to the social community feed.</li>
              </ul>
            </div>
          </div>

          <button type="button" onClick={dismissChangelogModal} className={`w-full ${activeTheme.bg} text-black font-black uppercase tracking-widest py-3.5 ${cornerStyle} text-xs shadow-lg ${reducedMotion ? '' : 'active:scale-95 transition-all'} cursor-pointer font-mono mt-2 shrink-0`}>Acknowledge &amp; Launch Cockpit</button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}