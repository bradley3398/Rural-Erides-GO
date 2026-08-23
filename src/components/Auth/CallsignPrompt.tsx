"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function CallsignPrompt(props: any) {
  const {
    missingCallsignInput, setMissingCallsignInput,
    authError, isProcessingAuth, handleSetMissingCallsign,
    activeTheme, cornerStyle, reducedMotion, typographyClass
  } = props;

  return (
    <div className={`min-h-screen bg-[#030305] flex items-center justify-center p-4 text-zinc-100 ${typographyClass} relative overflow-hidden`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none"></div>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-black/60 backdrop-blur-2xl border border-white/10 ${cornerStyle} p-6 sm:p-8 max-w-md w-full shadow-2xl relative z-10`}>
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4"><ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" /><div><h2 className="text-sm font-black uppercase text-white tracking-widest">Callsign Required</h2><p className="text-[10px] text-zinc-400 font-mono">Account Identity Incomplete</p></div></div>
        <p className="text-xs text-zinc-200 leading-relaxed mb-4 font-bold">Your account is authenticated, but you do not have a designated Rider Callsign. Please enter a callsign to bind to your pilot profile.</p>
        {authError && <p className="text-xs font-bold text-red-400 mb-3">{authError}</p>}
        <form onSubmit={handleSetMissingCallsign} className="space-y-4">
          <input type="text" required value={missingCallsignInput} onChange={(e) => setMissingCallsignInput(e.target.value)} placeholder="e.g. ApexRider" className={`w-full bg-black/50 border border-white/10 text-xs font-bold text-white ${cornerStyle} p-3 outline-none focus:border-amber-500 shadow-inner`} />
          <button type="submit" disabled={isProcessingAuth} className={`w-full bg-amber-500 text-black font-black uppercase tracking-widest py-3 ${cornerStyle} text-xs shadow-lg cursor-pointer ${reducedMotion ? '' : 'active:scale-95 transition-all'}`}>{isProcessingAuth ? <Loader2 className={`w-4 h-4 ${reducedMotion ? '' : 'animate-spin'} mx-auto`} /> : "Bind Callsign & Proceed"}</button>
        </form>
      </motion.div>
    </div>
  );
}