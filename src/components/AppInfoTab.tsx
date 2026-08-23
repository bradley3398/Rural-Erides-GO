"use client";

import React from "react";
import { Info, Globe } from "lucide-react";

export default function AppInfoTab({
  icon,
  activeTheme,
  cornerStyle,
  reducedMotion,
  typographyClass,
  setActiveTab,
  triggerHaptic,
  currentVersion
}: any) {
  return (
    <div className={`space-y-6 max-w-4xl mx-auto p-4 ${typographyClass}`}>
      <div className={`bg-white/5 border border-white/10 ${cornerStyle} p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl ${reducedMotion ? '' : 'transition-all duration-300'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Info className={`w-36 h-36 ${activeTheme.text}`} /></div>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-white/10 pb-6">
            <img src={icon} alt="App Logo" className={`w-16 h-16 ${cornerStyle} border border-white/20 object-cover shadow-lg shrink-0`} />
            <div className="flex-1">
              <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradient}`}>RURAL ERIDES GO</h2>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-1">Version {currentVersion} Universal Core • Built for Personal Electric Vehicle Pilots</p>
            </div>
            <button type="button" onClick={() => { triggerHaptic(); setActiveTab("DASH"); }} className={`min-h-[44px] px-5 py-2.5 ${cornerStyle} text-[10px] font-black uppercase tracking-widest border ${reducedMotion ? '' : 'transition-all active:scale-95'} ${activeTheme.bg} text-black border-transparent shadow-lg cursor-pointer`}>Return to Cockpit</button>
          </div>

          <div className={`bg-black/40 border border-white/5 p-6 ${cornerStyle} shadow-inner space-y-4`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">About the Creator &amp; Mission</span>
            <div className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">Lord Bradley Callison <span className="text-xs">👑</span></div>
            <div className={`text-lg font-black uppercase tracking-widest ${activeTheme.text} ${reducedMotion ? '' : 'animate-pulse'} drop-shadow-md`}>KEEP IT RURAL YALL</div>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed"><strong>The Mission:</strong> To elevate personal electric vehicle (PEV) riding from a simple pastime into a connected, data-driven experience. Designed and engineered for riders worldwide who rely on e-bikes, e-trikes, and scooters for daily utility, trail scouting, and delivery work—proving that advanced micro-mobility thrives just as naturally on rural roads and backcountry trails as it does in big cities.</p>
            <div className="mt-6 pt-5 border-t border-white/10">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-3">Open Source Project</span>
              <a href="https://github.com/bradley3398/Rural-Erides-GO" target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center gap-2 text-[11px] sm:text-xs font-black text-black bg-cyan-500 hover:bg-cyan-400 py-3.5 px-4 ${cornerStyle} ${reducedMotion ? '' : 'active:scale-95 transition-all'} shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer uppercase tracking-wider`}><Globe className="w-4 h-4" /> bradley3398/Rural-Erides-GO: For ebike enthusiast</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}