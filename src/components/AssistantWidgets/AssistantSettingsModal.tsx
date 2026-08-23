import React from "react";
import { motion } from "framer-motion";
import { X, Settings2, BrainCircuit, Palette, MapPin } from "lucide-react";

export default function AssistantSettingsModal({
  showSettings, setShowSettings, googleCseId, setGoogleCsetId,
  persona, setPersona, maxImageCount, setMaxImageCount,
  useGoogleEngine, setUseGoogleEngine, useBraveEngine, setUseBraveEngine,
  useTavilyEngine, setUseTavilyEngine, enableYouTubeSearch, setEnableYouTubeSearch,
  hudOpacity, setHudOpacity, customDirective, setCustomDirective,
  isLocationLocked, toggleLocationLock, baseZone, setBaseZone,
  privacyMode, setPrivacyMode, autoClearImages, setAutoClearImages,
  enableImageSearch, setEnableImageSearch, exportChatHistory, clearMemory,
  themeColors, hudOpacityOptions, personaOptions, maxImageOptions
}: any) {
  if (!showSettings) return null;
  const t = themeColors;

  return (
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black/60 backdrop-blur-3xl border border-white/10 w-full max-w-3xl rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col max-h-[85vh] overflow-hidden">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
          <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${t.text}`}>
            <Settings2 className="w-4 h-4" /> Universal Matrix Settings &amp; Advanced Engines
          </h3>
          <button 
            type="button"
            onClick={() => setShowSettings(false)}
            className="bg-white/5 border border-white/10 text-zinc-400 p-2 rounded-xl cursor-pointer hover:bg-white/10 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-4 pr-1 custom-scrollbar">
          
          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner">
            <label className="text-[10px] text-zinc-400 font-black uppercase block mb-2 tracking-widest">Google Custom Search Engine (CSE) ID</label>
            <input 
              type="text" 
              value={googleCseId} 
              onChange={(e) => setGoogleCsetId(e.target.value)} 
              placeholder="e.g. 0123456789abcdef0:xyz123"
              className="w-full min-h-[40px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-white/30 transition-colors shadow-inner"
            />
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5"/> Override Primary Copilot Persona</span>
            <select 
              value={persona} 
              onChange={(e) => setPersona(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-[10px] font-bold rounded-lg px-3 py-2 outline-none cursor-pointer shadow-inner w-full uppercase tracking-wider"
            >
              {personaOptions.map((p: any) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Image &amp; Research Engine Configuration</span>
            
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Max Image Results (Up to 20):</span>
              <select 
                value={maxImageCount} 
                onChange={(e) => setMaxImageCount(Number(e.target.value))}
                className={`bg-black/50 ${t.text} border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer shadow-inner`}
              >
                {maxImageOptions.map((m: number) => <option key={m} value={m}>{m} Results</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2 border-t border-white/5 flex-wrap">
              <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                <input type="checkbox" checked={useGoogleEngine} onChange={(e) => setUseGoogleEngine(e.target.checked)} className="accent-current" /> Google CSE
              </label>
              <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                <input type="checkbox" checked={useBraveEngine} onChange={(e) => setUseBraveEngine(e.target.checked)} className="accent-current" /> Brave Images
              </label>
              <label className="text-[9px] text-zinc-300 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider">
                <input type="checkbox" checked={useTavilyEngine} onChange={(e) => setUseTavilyEngine(e.target.checked)} className="accent-current" /> Tavily Deep
              </label>
              <label className="text-[9px] text-cyan-400 flex items-center gap-1.5 cursor-pointer font-bold uppercase tracking-wider drop-shadow-sm">
                <input type="checkbox" checked={enableYouTubeSearch} onChange={(e) => setEnableYouTubeSearch(e.target.checked)} className="accent-cyan-400" /> YouTube Research
              </label>
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-1.5"><Palette className="w-3.5 h-3.5"/> Glassmorphic HUD Opacity</span>
            <select 
              value={hudOpacity} 
              onChange={(e) => setHudOpacity(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-[10px] font-bold rounded-lg px-3 py-2 outline-none cursor-pointer shadow-inner w-full uppercase tracking-wider"
            >
              {hudOpacityOptions.map((opt: any) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
            </select>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner">
            <label className="text-[10px] text-zinc-400 font-black uppercase block mb-2 tracking-widest">Hardware &amp; Weight Specs (AI Context)</label>
            <textarea 
              value={customDirective} 
              onChange={(e) => setCustomDirective(e.target.value)} 
              placeholder="Enter custom hardware parameters..."
              className="w-full min-h-[70px] bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-white/30 resize-none transition-colors shadow-inner"
            />
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">Location Target Lock</span>
                <span className="text-[8px] text-zinc-500 uppercase font-bold">Lock current GPS or custom zone universally</span>
              </div>
              <button 
                type="button"
                onClick={toggleLocationLock}
                className={`min-h-[36px] px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-300 active:scale-95 cursor-pointer ${isLocationLocked ? `bg-white/10 border-white/20 ${t.text}` : 'bg-black/50 border-white/10 text-zinc-500 hover:text-white shadow-inner'}`}
              >
                {isLocationLocked ? "LOCKED" : "GPS AUTO"}
              </button>
            </div>
            
            <div className="pt-2 border-t border-white/5">
              <label className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block mb-2">Custom Base Zone / City (Universal Fallback)</label>
              <input 
                type="text" 
                value={baseZone} 
                onChange={(e) => setBaseZone(e.target.value)} 
                placeholder="e.g. Denver, CO or London, UK"
                className="w-full min-h-[44px] bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-bold text-white outline-none focus:border-white/30 transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
            <div>
              <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest block">Incognito Privacy Mode</span>
              <span className="text-[8px] text-zinc-500 uppercase font-bold">Disables local storage conversation logging</span>
            </div>
            <button 
              type="button"
              onClick={() => setPrivacyMode(!privacyMode)} 
              className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${privacyMode ? 'bg-rose-500' : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${privacyMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
            <div>
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block">Auto-Clear Optical Feed</span>
              <span className="text-[8px] text-zinc-500 uppercase font-bold">Clears uploaded image after every prompt</span>
            </div>
            <button 
              type="button"
              onClick={() => setAutoClearImages(!autoClearImages)} 
              className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${autoClearImages ? t.bg : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${autoClearImages ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Fetch Town / Trail Pictures</span>
            <button 
              type="button"
              onClick={() => setEnableImageSearch(!enableImageSearch)} 
              className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer shadow-inner border border-white/10 ${enableImageSearch ? t.bg : 'bg-zinc-800'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${enableImageSearch ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="bg-black/40 p-4 rounded-2xl border border-white/10 shadow-inner flex justify-between items-center">
            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Active Log Maintenance</span>
            <div className="flex gap-2">
              <button type="button" onClick={exportChatHistory} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-sm">Export Log</button>
              <button type="button" onClick={clearMemory} className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-sm">Clear Log</button>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex justify-end">
          <button 
            type="button"
            onClick={() => setShowSettings(false)}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/10 cursor-pointer transition-all active:scale-95 shadow-md"
          >
            Close Window
          </button>
        </div>

      </motion.div>
    </div>
  );
}