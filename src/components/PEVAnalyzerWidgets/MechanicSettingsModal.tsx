import React from "react";
import { motion } from "framer-motion";
import { X, Settings2, User, UserCircle, Cpu, Shield, Layers, Activity, Award, MapPin, ShoppingCart, Gauge, Sparkles } from "lucide-react";

export default function MechanicSettingsModal({
  showSettings, setShowSettings, callsign, userFleet, setUserFleet,
  aiModelVersion, setAiModelVersion, safeSearchLevel, setSafeSearchLevel,
  maxSpecResultsCount, setMaxSpecResultsCount, autoClearPhoto, setAutoClearPhoto,
  ttsRate, setTtsRate, ttsPitch, setTtsPitch, autoSaveLogs, setAutoSaveLogs,
  autoReadAloud, setAutoReadAloud, aiDetailLevel, setAiDetailLevel,
  searchScope, setSearchScope, userRegion, setUserRegion, preferredMarketplace,
  setPreferredMarketplace, unitSystem, setUnitSystem, theme, setTheme,
  saveConfiguration, themeColors
}: any) {
  if (!showSettings) return null;
  const t = themeColors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0a0a0f]/90 backdrop-blur-3xl border border-white/15 w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5 shrink-0">
          <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
            <Settings2 className="w-4 h-4" /> Rural Mechanic Master Configuration Matrix
          </h3>
          <button 
            type="button"
            onClick={() => setShowSettings(false)}
            className="bg-white/5 border border-white/10 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><User className={`w-3 h-3 ${t.text}`}/> Operator Callsign</span>
              </label>
              <input 
                type="text" 
                value={callsign} 
                disabled={true} 
                className="w-full bg-black/60 border border-white/10 text-xs text-zinc-400 rounded-xl px-4 py-3 outline-none cursor-not-allowed font-mono font-bold min-h-[48px] shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <UserCircle className={`w-3 h-3 ${t.text}`}/> Active PEV Fleet Declaration
              </label>
              <input 
                type="text" 
                value={userFleet} 
                onChange={(e) => setUserFleet(e.target.value)} 
                placeholder="e.g. Universal Performance PEV Fleet..." 
                className="w-full bg-black/50 border border-white/10 text-xs text-white rounded-xl px-4 py-3 outline-none focus:border-white/30 transition-colors min-h-[48px] shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Cpu className={`w-3 h-3 ${t.text}`}/> AI Core Engine Model
              </label>
              <select
                value={aiModelVersion}
                onChange={(e) => setAiModelVersion(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono cursor-pointer min-h-[44px]"
              >
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Shield className={`w-3 h-3 ${t.text}`}/> Web Search SafeSearch
              </label>
              <select
                value={safeSearchLevel}
                onChange={(e) => setSafeSearchLevel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono cursor-pointer min-h-[44px]"
              >
                <option value="active">Active Strict Filtering</option>
                <option value="moderate">Moderate Filtering</option>
                <option value="off">Disabled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className={`w-3 h-3 ${t.text}`}/> Max Spec Sheets Per Search
              </label>
              <select
                value={maxSpecResultsCount}
                onChange={(e) => setMaxSpecResultsCount(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none font-mono cursor-pointer min-h-[44px]"
              >
                <option value={5}>5 Records</option>
                <option value={10}>10 Records</option>
                <option value={20}>20 Records</option>
              </select>
            </div>

            <div className="flex justify-between items-center px-1">
              <div>
                <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest block">Auto-Clear Optical Photo</span>
                <span className="text-[8px] text-zinc-500 uppercase">Clear photo after analysis</span>
              </div>
              <button 
                type="button"
                onClick={() => setAutoClearPhoto(!autoClearPhoto)} 
                className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer border border-white/10 ${autoClearPhoto ? t.bg : 'bg-zinc-800'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${autoClearPhoto ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Activity className={`w-3 h-3 ${t.text}`}/> Diagnostic Depth
              </label>
              <div className="flex gap-1.5">
                {['compact', 'standard', 'exhaustive'].map(lvl => (
                  <button 
                    key={lvl} 
                    type="button"
                    onClick={() => setAiDetailLevel(lvl)}
                    className={`flex-1 min-h-[44px] py-2 text-[9px] font-black uppercase rounded-lg border transition-all cursor-pointer ${aiDetailLevel === lvl ? `${t.dim}` : 'bg-black text-zinc-500 border-zinc-800'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <Award className={`w-3 h-3 ${t.text}`}/> Component Tier
              </label>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none cursor-pointer min-h-[48px]"
              >
                <option value="all">All Options</option>
                <option value="oem_only">OEM Only</option>
                <option value="aftermarket_only">Aftermarket</option>
                <option value="third_party">3rd Party / Clones</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
                <MapPin className={`w-3 h-3 ${t.text}`}/> Region Framework
              </label>
              <select
                value={userRegion}
                onChange={(e) => setUserRegion(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none font-mono text-white cursor-pointer min-h-[48px]"
              >
                <option value="US">United States (USD - $)</option>
                <option value="UK">United Kingdom (GBP - £)</option>
                <option value="EU">Eurozone (EUR - €)</option>
                <option value="CA">Canada (CAD - $)</option>
                <option value="AU">Australia (AUD - $)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className={`w-3 h-3 ${t.text}`}/> Diagnostic Theme Engine
            </label>
            <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setTheme('rural')} className={`w-10 h-10 rounded-full bg-[#39ff14] border-2 border-black cursor-pointer ${theme === 'rural' ? 'ring-2 ring-white' : ''}`}></button>
                <button type="button" onClick={() => setTheme('cyan')} className={`w-10 h-10 rounded-full bg-cyan-500 border-2 border-black cursor-pointer ${theme === 'cyan' ? 'ring-2 ring-white' : ''}`}></button>
                <button type="button" onClick={() => setTheme('emerald')} className={`w-10 h-10 rounded-full bg-emerald-500 border-2 border-black cursor-pointer ${theme === 'emerald' ? 'ring-2 ring-white' : ''}`}></button>
                <button type="button" onClick={() => setTheme('amber')} className={`w-10 h-10 rounded-full bg-amber-500 border-2 border-black cursor-pointer ${theme === 'amber' ? 'ring-2 ring-white' : ''}`}></button>
                <button type="button" onClick={() => setTheme('rose')} className={`w-10 h-10 rounded-full bg-rose-500 border-2 border-black cursor-pointer ${theme === 'rose' ? 'ring-2 ring-white' : ''}`}></button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={() => setShowSettings(false)}
            className="bg-white/5 border border-white/10 text-zinc-300 hover:text-white px-5 min-h-[48px] rounded-xl font-black uppercase text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={saveConfiguration} 
            className={`${t.bg} text-black px-6 min-h-[48px] rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg cursor-pointer`}
          >
            Save &amp; Sync Globally
          </button>
        </div>

      </div>
    </div>
  );
}