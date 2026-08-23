"use client";

import React, { useState } from "react";
import { FileSignature, Check, Sparkles } from "lucide-react";

export default function LegalOnboarding({
  activeTheme,
  cornerStyle,
  performanceMode,
  reducedMotion,
  typographyClass,
  triggerHaptic,
  onComplete
}: any) {
  const [agreedTos, setAgreedTos] = useState(false);
  const [agreedSafety, setAgreedSafety] = useState(false);
  const [agreedBattery, setAgreedBattery] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedConduct, setAgreedConduct] = useState(false);
  const [agreedMedia, setAgreedMedia] = useState(false);
  const [agreedHardware, setAgreedHardware] = useState(false);

  const finishOnboarding = () => { 
    triggerHaptic(); 
    if (agreedTos && agreedSafety && agreedBattery && agreedPrivacy && agreedConduct && agreedMedia && agreedHardware) { 
      onComplete();
    } else { 
      alert("CRITICAL ERROR: All 7 legal security, telemetry, content, and hardware modification protocols must be actively acknowledged to unlock the avionics suite."); 
    } 
  };

  return (
    <div className={`min-h-screen bg-[#030305] flex items-center justify-center p-4 sm:p-6 text-zinc-100 ${typographyClass} relative overflow-hidden`}>
      {!performanceMode && <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${activeTheme.bg} opacity-10 rounded-full blur-[150px] pointer-events-none`}></div>}
      <div className={`bg-[#0d0e15]/60 ${activeTheme.blur} border border-white/10 ${cornerStyle} p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative z-10 flex flex-col h-[90vh]`}>
        <div className="flex flex-col items-center justify-center mb-6 shrink-0">
          <FileSignature className={`w-12 h-12 ${activeTheme.text} mb-4 ${performanceMode ? '' : activeTheme.shadow}`} />
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white text-center leading-tight">MANDATORY PILOT BRIEFING</h1>
          <p className="text-[10px] text-zinc-300 font-mono mt-2 uppercase tracking-widest text-center">Creator & Developer: Lord Bradley Callison</p>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 sm:pr-3 custom-scrollbar space-y-4 pb-4">
          {/* 1. TOS Waiver */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedTos ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedTos(!agreedTos); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedTos ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedTos && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">1. Comprehensive Liability Waiver & Release of All Claims</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I hereby fully release, indemnify, and hold harmless Lord Bradley Callison, Rural ERides GO, its developers, affiliates, and assigns from any and all claims, demands, liabilities, damages, or lawsuits arising out of my use of this application or my operation of any Personal Electric Vehicle (PEV). I assume 100% of the risk for property damage, injury, or death.</span>
              </div>
            </button>
          </div>

          {/* 2. Battery Risk */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedBattery ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedBattery(!agreedBattery); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedBattery ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedBattery && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">2. High-Voltage Battery & Fire Risk Acknowledgment</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I acknowledge that operating high-power lithium-ion/LiFePO4 batteries carries an inherent risk of thermal runaway, catastrophic fire, or explosion. I agree to monitor my voltage sag and battery health. The Creator bears zero responsibility for hardware failure, fires, or associated property loss.</span>
              </div>
            </button>
          </div>

          {/* 3. Safety Laws */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedSafety ? `${activeTheme.bg} text-black border-transparent` : 'bg-red-950/20 border-red-900/40 hover:border-red-800/60 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedSafety(!agreedSafety); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedSafety ? 'border-black bg-black/20' : 'border-red-500'}`}>{agreedSafety && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1 text-red-500">3. Traffic Laws & Distracted Riding Protocol</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I swear to obey all local, state, and federal traffic laws. I will wear safety gear. I understand that interacting with a screen while operating a high-speed vehicle is extremely dangerous. I agree to mount my device securely and rely on audio/haptic cues while in motion.</span>
              </div>
            </button>
          </div>

          {/* 4. Privacy & Telemetry */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedPrivacy ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedPrivacy(!agreedPrivacy); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedPrivacy ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedPrivacy && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">4. GPS Telemetry & Data Collection Consent</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I grant explicit permission for this avionics suite to track, store, and process my real-time geographic location, speed, altitude, and hardware metrics. I understand this data is used to generate route maps and community leaderboards. I may opt-in to privacy zones, but core telemetry requires GPS access.</span>
              </div>
            </button>
          </div>

          {/* 5. Conduct */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedConduct ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedConduct(!agreedConduct); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedConduct ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedConduct && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">5. Community Guidelines & Acceptable Conduct</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I agree to maintain a respectful demeanor on the Universal Network. I will not post spam, hate speech, illegal content, or harass other pilots. Violations will result in an immediate, unappealable ban from the network.</span>
              </div>
            </button>
          </div>

          {/* 6. Media */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedMedia ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedMedia(!agreedMedia); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedMedia ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedMedia && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">6. User-Generated Content License</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">By broadcasting logs, images, or routes to the Board, I grant the Creator a non-exclusive right to display this content. I verify that I own the rights to the photos/videos I upload and take sole legal responsibility for my transmissions.</span>
              </div>
            </button>
          </div>

          {/* 7. Hardware */}
          <div className={`p-4 sm:p-5 ${cornerStyle} border transition-all duration-300 shadow-inner ${agreedHardware ? `${activeTheme.bg} text-black border-transparent` : 'bg-black/40 border-white/5 hover:border-white/10 text-zinc-400'}`}>
            <button type="button" onClick={() => { triggerHaptic(); setAgreedHardware(!agreedHardware); }} className="w-full text-left flex gap-3 cursor-pointer">
              <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${agreedHardware ? 'border-black bg-black/20' : 'border-zinc-500'}`}>{agreedHardware && <Check className="w-3.5 h-3.5" />}</div>
              <div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider block mb-1">7. Hardware Modification & Firmware Disclaimer</span>
                <span className="text-[9px] font-mono leading-relaxed opacity-80 block">I understand that any advice, diagnostics, or mod-shop information obtained from this platform, including AI Co-Pilot analysis, is at my own risk. The Creator is not liable for voided warranties, broken components, or accidents resulting from user modifications.</span>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/10 shrink-0">
          <button 
            type="button" 
            onClick={finishOnboarding} 
            disabled={!agreedTos || !agreedSafety || !agreedBattery || !agreedPrivacy || !agreedConduct || !agreedMedia || !agreedHardware} 
            className={`w-full font-black uppercase tracking-widest py-4 ${cornerStyle} flex items-center justify-center gap-3 transition-all cursor-pointer ${agreedTos && agreedSafety && agreedBattery && agreedPrivacy && agreedConduct && agreedMedia && agreedHardware ? `${activeTheme.bg} text-black ${activeTheme.shadow} ${reducedMotion ? '' : 'active:scale-95'}` : 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/10'}`}
          >
            <Sparkles className="w-5 h-5" /> Initialize Avionics Sequence
          </button>
        </div>
      </div>
    </div>
  );
}