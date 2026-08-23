"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, X, Wrench, Map, Ruler, Grid, Search, Layout } from "lucide-react";

export default function FeedSettingsPanel(props: any) {
  const {
    showSettingsPanel, setShowSettingsPanel, t,
    userFleetConfig, setUserFleetConfig,
    userTerrainConfig, setUserTerrainConfig,
    aiPersonality, setAiPersonality,
    aiDetailLevel, setAiDetailLevel,
    aiThinkingLevel, setAiThinkingLevel,
    aiCreativityLevel, setAiCreativityLevel,
    hideDescriptionBox, setHideDescriptionBox,
    autoTheaterOnSelect, setAutoTheaterOnSelect,
    aiUnitSystem, setAiUnitSystem,
    gridDensity, setGridDensity,
    aiWebGrounding, setAiWebGrounding,
    aiOutputLength, setAiOutputLength,
    autoLoadAiScan, setAutoLoadAiScan,
    displayDiagnosticHUD, setDisplayDiagnosticHUD,
    showRawJsonData, setShowRawJsonData
  } = props;

  if (!showSettingsPanel) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-black/60 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${t.text} flex items-center gap-1.5`}><Database className="w-4 h-4"/> Feed Parameter Calibration Matrix</span>
          <button type="button" onClick={() => setShowSettingsPanel(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/10 pb-5">
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 shadow-inner">
            <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2"><Wrench className="w-3.5 h-3.5"/> Operator Fleet Config</span>
            <input type="text" value={userFleetConfig} onChange={(e) => setUserFleetConfig(e.target.value)} placeholder="e.g. Aostirmotor A20..." className={`w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:${t.border} shadow-inner`}/>
          </div>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-2 shadow-inner">
            <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest flex items-center gap-2"><Map className="w-3.5 h-3.5"/> Local Terrain Matrix</span>
            <input type="text" value={userTerrainConfig} onChange={(e) => setUserTerrainConfig(e.target.value)} placeholder="e.g. Stigler, OK Urban & Trail..." className={`w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:${t.border} shadow-inner`}/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between space-y-3 shadow-inner">
            <div>
              <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest block mb-1.5">AI Telemetry Model Tuning</span>
              <div className="flex flex-wrap bg-black/60 p-1 rounded-lg border border-white/10 gap-1 shadow-inner">
                <button type="button" onClick={() => setAiPersonality("companion")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${aiPersonality === "companion" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Companion</button>
                <button type="button" onClick={() => setAiPersonality("mechanic")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${aiPersonality === "mechanic" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Mechanic</button>
                <button type="button" onClick={() => setAiPersonality("systems")} className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${aiPersonality === "systems" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Avionics</button>
              </div>
            </div>
            
            <div>
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest block mb-1">AI Output Depth Focus</span>
              <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 gap-1 mb-2 shadow-inner">
                <button type="button" onClick={() => setAiDetailLevel("compact")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiDetailLevel === "compact" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Compact</button>
                <button type="button" onClick={() => setAiDetailLevel("standard")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiDetailLevel === "standard" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Standard</button>
                <button type="button" onClick={() => setAiDetailLevel("deep")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiDetailLevel === "deep" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Deep Dive</button>
              </div>
              
              <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest block mb-1">3.1 Flash-Lite Thinking Level</span>
              <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 gap-1 shadow-inner">
                <button type="button" onClick={() => setAiThinkingLevel("minimal")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiThinkingLevel === "minimal" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Min</button>
                <button type="button" onClick={() => setAiThinkingLevel("low")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiThinkingLevel === "low" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Low</button>
                <button type="button" onClick={() => setAiThinkingLevel("medium")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiThinkingLevel === "medium" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>Med</button>
                <button type="button" onClick={() => setAiThinkingLevel("high")} className={`flex-1 py-0.5 text-[7.5px] font-black uppercase rounded transition-all cursor-pointer ${aiThinkingLevel === "high" ? `${t.primary} text-black shadow-sm` : "text-zinc-400 hover:text-white"}`}>High</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Cognitive Creativity Tone</span>
                <span className="text-[8px] font-mono text-zinc-300 font-bold">{aiCreativityLevel.toFixed(1)}</span>
              </div>
              <input type="range" min="0.2" max="1.2" step="0.1" value={aiCreativityLevel} onChange={e => setAiCreativityLevel(parseFloat(e.target.value))} className={`w-full ${t.text} accent-current cursor-pointer`} />
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col gap-2 xl:col-span-1 md:col-span-2 shadow-inner">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setHideDescriptionBox(!hideDescriptionBox)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer shadow-inner ${hideDescriptionBox ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
                {hideDescriptionBox ? "👁️ Show Descriptions" : "🙈 Hide Descriptions"}
              </button>
              <button type="button" onClick={() => setAutoTheaterOnSelect(!autoTheaterOnSelect)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer shadow-inner ${autoTheaterOnSelect ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
                {autoTheaterOnSelect ? "🎬 Auto-Theater ON" : "📺 Auto-Theater OFF"}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAiUnitSystem(u => u === "imperial" ? "metric" : "imperial")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-inner ${aiUnitSystem === "metric" ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
                <Ruler className="w-3.5 h-3.5"/> Units: {aiUnitSystem.toUpperCase()}
              </button>
              <button type="button" onClick={() => setGridDensity(g => g === "standard" ? "compact" : "standard")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-inner ${gridDensity === "compact" ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
                <Grid className="w-3.5 h-3.5"/> Grid: {gridDensity.toUpperCase()}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAiWebGrounding(!aiWebGrounding)} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-inner ${aiWebGrounding ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/50" : "bg-black/50 border-white/10 text-zinc-400"}`}>
                <Search className="w-3.5 h-3.5"/> Search Grounding: {aiWebGrounding ? "ON" : "OFF"}
              </button>
              <button type="button" onClick={() => setAiOutputLength(l => l === "normal" ? "extended" : "normal")} className={`p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-inner ${aiOutputLength === "extended" ? "bg-purple-950/40 text-purple-300 border-purple-500/50" : "bg-black/50 border-white/10 text-zinc-400"}`}>
                <Layout className="w-3.5 h-3.5"/> Max Tokens: {aiOutputLength.toUpperCase()}
              </button>
            </div>

            <button type="button" onClick={() => setAutoLoadAiScan(!autoLoadAiScan)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer shadow-inner ${autoLoadAiScan ? `${t.bgSubtle} ${t.text} ${t.border}` : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
              {autoLoadAiScan ? "🤖 Auto-AI Scan: ENGAGED" : "🤖 Auto-AI Scan: MANUAL"}
            </button>
            <button type="button" onClick={() => setDisplayDiagnosticHUD(!displayDiagnosticHUD)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center cursor-pointer shadow-inner ${displayDiagnosticHUD ? "bg-cyan-950/40 text-cyan-300 border-cyan-500/50" : "bg-black/50 border-white/10 text-zinc-300 hover:text-white"}`}>
              {displayDiagnosticHUD ? "📊 Diagnostics HUD Ribbon: ON" : "📊 Diagnostics HUD Ribbon: OFF"}
            </button>
            
            <button type="button" onClick={() => setShowRawJsonData(!showRawJsonData)} className={`w-full p-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all duration-300 active:scale-95 text-center mt-2 cursor-pointer shadow-inner ${showRawJsonData ? "bg-rose-950/40 text-rose-300 border-rose-500/50" : "bg-black/50 border-white/5 text-zinc-500 hover:text-zinc-300"}`}>
              {showRawJsonData ? "Hide Architecture Matrix" : "Show JSON Debug Matrix"}
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}