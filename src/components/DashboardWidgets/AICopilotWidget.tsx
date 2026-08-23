import React from "react";
import { BrainCircuit, Globe, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AICopilotWidget({ 
  ui, triggerCloudAiAnalysis, isFetchingCloudAi, cloudAiAnalysis, aiAdvice, 
  learnedEfficiency, motorEfficiencyPct, pilotRiskIndex, topographyRangeImpact, 
  estStatorTemp, estRotorTemp, liveRideScore, aeroDragForce, bonusRegenMiles, 
  terrainClassifier, thermalRunawayIndex, distLabel 
}: any) {
  return (
    <div className={`${ui.bgPanel} p-4 sm:p-5 rounded-3xl border shadow-xl transition-colors space-y-4 ${ui.brd}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm`}>
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`${ui.txtMain} font-black uppercase tracking-widest text-xs flex items-center gap-2`}>
              AI Telemetry Copilot Matrix
            </h3>
            <p className={`text-[8px] ${ui.txtMuted} font-mono uppercase mt-0.5`}>Dynamic Neural Range & Cloud Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={triggerCloudAiAnalysis} disabled={isFetchingCloudAi} className={`flex-1 sm:flex-none px-3 py-2 rounded-lg border text-[9px] font-mono font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${isFetchingCloudAi ? 'bg-cyan-950/40 text-cyan-500 border-cyan-900/50' : 'bg-cyan-600 hover:bg-cyan-500 text-black border-cyan-500'}`}>
            {isFetchingCloudAi ? <Loader2 className="w-3 h-3 animate-spin"/> : <Globe className="w-3 h-3"/>}
            {isFetchingCloudAi ? "Uplinking..." : "Deep Cloud Scan"}
          </button>
          <div className={`hidden sm:block px-2.5 py-1.5 rounded-lg border text-[9px] font-mono font-black uppercase tracking-widest ${aiAdvice.color} bg-black/40`}>
            {aiAdvice.status}
          </div>
        </div>
      </div>
      
      {/* Expanded AI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-5 gap-2.5">
        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>AI Efficiency</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${ui.t.text}`}>{learnedEfficiency}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>Wh/{distLabel}</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Motor Efficiency</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-mono font-black text-cyan-400">{motorEfficiencyPct}%</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>Optimal</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Pilot Risk Index</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${pilotRiskIndex > 70 ? 'text-rose-500 animate-pulse' : pilotRiskIndex > 40 ? 'text-amber-400' : 'text-cyan-400'}`}>{pilotRiskIndex}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>/ 100</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Range Impact</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${topographyRangeImpact < 0 ? 'text-rose-500' : 'text-[#39ff14]'}`}>{topographyRangeImpact > 0 ? '+' : ''}{topographyRangeImpact.toFixed(1)}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>{distLabel}</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Stator / Rotor Temp</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${estStatorTemp > 180 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {Math.round(estStatorTemp)}° / {Math.round(estRotorTemp)}°
            </span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>F</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Live AI Score</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${liveRideScore.includes('S') ? 'text-purple-400' : 'text-[#39ff14]'}`}>{liveRideScore}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>Class</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Aero Drag</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-mono font-black text-rose-400">{Math.round(aeroDragForce)}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>Newtons</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>KERS Recaptured</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-mono font-black text-emerald-400">+{bonusRegenMiles.toFixed(2)}</span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>{distLabel}</span>
          </div>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Terrain Class</span>
          <span className="text-[10px] font-mono font-black text-purple-400 truncate">{terrainClassifier}</span>
        </div>

        <div className={`${ui.bgList} p-3 rounded-2xl border ${ui.brd} flex flex-col justify-between shadow-inner`}>
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1`}>Thermal Stress</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-mono font-black ${thermalRunawayIndex > 60 ? 'text-rose-500' : thermalRunawayIndex > 35 ? 'text-amber-400' : 'text-[#39ff14]'}`}>
              {thermalRunawayIndex}%
            </span>
            <span className={`text-[8px] ${ui.txtMuted} uppercase font-mono`}>{thermalRunawayIndex > 60 ? 'High' : 'Nominal'}</span>
          </div>
        </div>
      </div>

      {/* Active AI Recommendation Banner */}
      <div className={`p-3.5 rounded-2xl bg-black/50 border border-zinc-800 flex flex-col gap-2 shadow-inner`}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-bounce mt-0.5" />
          <div className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wide leading-relaxed">
            <span className="text-cyan-400 font-black">LOCAL MATRIX: </span>{aiAdvice.msg}
          </div>
        </div>
        <AnimatePresence>
          {(cloudAiAnalysis || isFetchingCloudAi) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 pt-2 border-t border-zinc-800/50 mt-1">
              <Globe className={`w-4 h-4 shrink-0 mt-0.5 ${isFetchingCloudAi ? 'text-cyan-600 animate-spin' : 'text-purple-400 animate-pulse'}`} />
              <div className={`text-[10px] font-mono font-bold uppercase tracking-wide leading-relaxed ${isFetchingCloudAi ? 'text-zinc-500' : 'text-zinc-200'}`}>
                <span className={isFetchingCloudAi ? 'text-cyan-600 font-black' : 'text-purple-400 font-black'}>DEEP CLOUD SCAN: </span>
                {cloudAiAnalysis || "Transmitting live telemetry to cloud neural net for deep analysis..."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}