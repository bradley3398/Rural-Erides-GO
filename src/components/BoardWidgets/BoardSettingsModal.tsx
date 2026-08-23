import React from "react";
import { motion } from "framer-motion";
import { X, Settings, Lock } from "lucide-react";

export default function BoardSettingsModal({
  isSettingsOpen, setIsSettingsOpen, username, pfpUrl, userFleet, setUserFleet,
  userBio, setUserBio, defaultPostCategory, setDefaultPostCategory,
  dataSaverMode, setDataSaverMode, privacyMode, setPrivacyMode,
  pfpInputRef, handlePfpUpload, triggerHaptic, themeColors, CATEGORIES
}: any) {
  if (!isSettingsOpen) return null;
  const t = themeColors;

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black/90 border border-white/10 rounded-3xl w-full max-w-lg h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
         <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0">
           <h3 className={`text-sm font-black uppercase tracking-widest ${t.text} flex items-center gap-2`}><Settings className="w-4 h-4"/> Identity & Config</h3>
           <button type="button" onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white p-2 bg-black/50 rounded-full border border-white/10 cursor-pointer"><X className="w-4 h-4"/></button>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
            <div className="flex items-center gap-4">
               <div className={`w-16 h-16 rounded-full border-2 ${t.border} bg-zinc-800 flex items-center justify-center text-2xl font-black text-white overflow-hidden shadow-lg`}>
                 {pfpUrl ? <img src={pfpUrl} className="w-full h-full object-cover"/> : username.charAt(0).toUpperCase()}
               </div>
               <div className="flex-1">
                 <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Avatar Upload</label>
                 <input type="file" accept="image/*" ref={pfpInputRef} onChange={handlePfpUpload} className="hidden" />
                 <button type="button" onClick={() => pfpInputRef.current?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black uppercase text-white transition-colors cursor-pointer shadow-inner">Change Image</button>
               </div>
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex justify-between">
                <span>Pilot Callsign</span>
                <span className="text-rose-500 flex items-center gap-1"><Lock className="w-2.5 h-2.5"/> Locked</span>
              </label>
              <input type="text" value={username} disabled={true} className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-zinc-500 shadow-inner cursor-not-allowed" />
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5">Fleet Signature</label>
              <input type="text" value={userFleet} onChange={(e) => { setUserFleet(e.target.value); localStorage.setItem("rural_erides_fleet", e.target.value); }} placeholder="e.g. Surron Light Bee X, A20..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 transition-colors shadow-inner" />
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5">Bio / Description</label>
              <textarea value={userBio} onChange={(e) => { setUserBio(e.target.value); localStorage.setItem("rural_erides_bio", e.target.value); }} placeholder="Tell the crew about your riding style..." rows={3} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 transition-colors shadow-inner resize-none" />
            </div>

            <div>
              <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5">Default Broadcast Category</label>
              <select value={defaultPostCategory} onChange={(e) => { setDefaultPostCategory(e.target.value); localStorage.setItem("rural_default_category", e.target.value); }} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 appearance-none outline-none cursor-pointer shadow-inner">
                 {CATEGORIES.map((cat: string) => <option key={cat} value={cat} className="bg-black">{cat}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
               <div>
                 <span className="text-[10px] text-white font-black uppercase tracking-widest block">Data Saver Mode</span>
                 <p className="text-[9px] text-zinc-500 font-bold">Hide media on trail networks</p>
               </div>
               <button type="button" onClick={() => { setDataSaverMode(!dataSaverMode); localStorage.setItem("rural_data_saver", (!dataSaverMode).toString()); }} className={`relative inline-flex min-h-[24px] min-w-[42px] items-center rounded-full transition-colors cursor-pointer ${dataSaverMode ? 'bg-amber-500' : 'bg-zinc-800'}`}>
                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${dataSaverMode ? 'translate-x-5' : 'translate-x-1'}`} />
               </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
               <div>
                 <span className="text-[10px] text-white font-black uppercase tracking-widest block">Incognito Mode</span>
                 <p className="text-[9px] text-zinc-500 font-bold">Hide telemetry and typing indicators</p>
               </div>
               <button type="button" onClick={() => { setPrivacyMode(!privacyMode); localStorage.setItem("rt_privacy_mode", (!privacyMode).toString()); }} className={`relative inline-flex min-h-[24px] min-w-[42px] items-center rounded-full transition-colors cursor-pointer ${privacyMode ? 'bg-rose-500' : 'bg-zinc-800'}`}>
                 <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${privacyMode ? 'translate-x-5' : 'translate-x-1'}`} />
               </button>
            </div>

         </div>
         <div className="p-4 border-t border-white/10 bg-black/50 shrink-0">
            <button type="button" onClick={() => { setIsSettingsOpen(false); triggerHaptic("HEAVY"); }} className={`w-full min-h-[44px] ${t.bg} text-black rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg cursor-pointer transition-all active:scale-95`}>Save Profile</button>
         </div>
      </motion.div>
    </div>
  );
}