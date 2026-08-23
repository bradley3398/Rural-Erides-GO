import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, X, AlertTriangle, Camera, Video, ImagePlus, Mic, MicOff, 
  Sparkles, Loader2, ShoppingBag, Wrench, BarChart2, Sliders, Youtube, 
  Gauge, Thermometer, Background as BackgroundIcon, Palette 
} from "lucide-react";

export default function PostComposer({
  isComposerOpen, setIsComposerOpen, postText, setPostText, postCategory, setPostCategory,
  pevType, setPevType, postTemplate, setPostTemplate, isHelpNeeded, setIsHelpNeeded,
  itemPrice, setItemPrice, itemCondition, setItemCondition, modTags, setModTags,
  username, pfpUrl, useMetric, handlePublish, isPublishing, safetyWarning, setSafetyWarning,
  mediaPreview, setMediaFile, setMediaPreview, videoPreview, setVideoFile, setVideoPreview,
  fileInputRef, cameraInputRef, videoInputRef, handleMediaPick, handleCameraSnap, handleVideoPick,
  showAdvanced, setShowAdvanced, showPollBuilder, setShowPollBuilder, showCustomizer, setShowCustomizer,
  youtubeUrl, setYoutubeUrl, topSpeed, setTopSpeed, motorTemp, setMotorTemp,
  pollQuestion, setPollQuestion, pollOptions, setPollOptions, isDictating, toggleVoiceDictation,
  enhanceWithAI, isEnhancing, triggerHaptic, themeColors, PEV_TEMPLATES, CATEGORIES, 
  PEV_TYPES, CONDITION_TYPES 
}: any) {
  const t = themeColors;
  const activeThemeConfig = PEV_TEMPLATES.find((temp: any) => temp.id === postTemplate) || PEV_TEMPLATES[0];

  return (
    <div className={`border rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden transition-all duration-500 ${activeThemeConfig.id !== "none" ? activeThemeConfig.css : "bg-black/80 border-white/10"} ${isHelpNeeded ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : ''}`} style={activeThemeConfig.bgUrl ? { backgroundImage: `url('${activeThemeConfig.bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      {activeThemeConfig.bgUrl && <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-0 pointer-events-none"></div>}

      {activeThemeConfig.icon && isComposerOpen && (
        <div className="absolute top-0 left-0 w-full bg-black/50 border-b border-white/5 px-4 py-1.5 flex items-center justify-center backdrop-blur-sm z-10">
           <span className="text-[8px] font-black uppercase tracking-widest text-white/80 drop-shadow-md">{activeThemeConfig.icon} - PREVIEW</span>
        </div>
      )}

      <div className={`relative z-10 ${activeThemeConfig.icon && isComposerOpen ? 'pt-10 pb-5 px-5' : 'p-5'}`}>
        {!isComposerOpen ? (
          <div className="flex items-center gap-3 cursor-text" onClick={() => { triggerHaptic("LIGHT"); setIsComposerOpen(true); }}>
            <div className={`w-10 h-10 rounded-full bg-zinc-900 border ${t.border} flex items-center justify-center font-black ${t.text} shadow-inner overflow-hidden shrink-0`}>
              {pfpUrl ? <img src={pfpUrl} className="w-full h-full object-cover" /> : (username ? username.charAt(0).toUpperCase() : "+")}
            </div>
            <div className={`flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold ${postText ? t.text : 'text-zinc-500'} hover:border-white/20 transition-all duration-300 shadow-inner truncate`}>
              {postText ? "Draft in progress... Click to resume" : "Broadcast to the Universal Network (use @Callsign to tag)..."}
            </div>
            <div className="hidden sm:flex gap-1 shrink-0">
              <button type="button" onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="p-3 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl shadow-inner cursor-pointer"><Camera className="w-4 h-4" /></button>
              <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-3 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl shadow-inner cursor-pointer"><ImagePlus className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                {isHelpNeeded ? <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse"/> : <Send className={`w-4 h-4 ${t.text}`}/>} 
                {isHelpNeeded ? "Emergency Hardware Assistance Signal" : "New Transmission Matrix"}
              </h3>
              <button type="button" onClick={() => { triggerHaptic("LIGHT"); setIsComposerOpen(false); }} className="text-zinc-500 hover:text-white transition-colors p-2 cursor-pointer"><X className="w-4 h-4"/></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block mb-1.5">Rider Callsign</label>
                <div className={`flex items-center justify-between bg-black/80 border border-white/10 text-xs ${t.text} rounded-xl p-3 font-bold shadow-inner`}>
                  <span className="text-zinc-300 truncate">{username}</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block mb-1.5">Vehicle Classification</label>
                <select value={pevType} onChange={(e) => setPevType(e.target.value)} className={`w-full bg-black/60 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold ${t.text} appearance-none outline-none cursor-pointer shadow-inner backdrop-blur-md`}>
                  {PEV_TYPES.map((cat: string) => <option key={cat} value={cat} className="bg-black">{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[9px] text-zinc-400 font-black uppercase tracking-widest block">Log Payload (use @ to tag)</label>
                <select value={postCategory} onChange={(e) => {
                  const newCat = e.target.value;
                  setPostCategory(newCat);
                  if (newCat === "Marketplace") setPostTemplate("market");
                  else if (postTemplate === "market") setPostTemplate("none");
                }} className={`bg-transparent text-[10px] font-black uppercase tracking-widest ${t.text} outline-none cursor-pointer appearance-none text-right`}>
                  {CATEGORIES.map((cat: string) => <option key={cat} value={cat} className="bg-black">[{cat}]</option>)}
                </select>
              </div>
              <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Broadcast to the network..." className="w-full bg-black/60 border border-white/10 rounded-xl p-4 pb-16 text-white text-xs font-medium resize-none focus:outline-none min-h-[120px] shadow-inner backdrop-blur-md" />
              
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                <button type="button" onClick={toggleVoiceDictation} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest cursor-pointer ${isDictating ? 'bg-rose-600 border-rose-500 text-white animate-pulse' : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'}`}>
                  {isDictating ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />} {isDictating ? 'Recording...' : 'Dictate'}
                </button>

                <button type="button" onClick={enhanceWithAI} disabled={!postText.trim() || isEnhancing} className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 ${t.text} text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer disabled:opacity-50`}>
                  {isEnhancing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} {isEnhancing ? "Polishing..." : "AI Polish"}
                </button>
              </div>
            </div>

            {(postCategory === "Marketplace" || postTemplate === "market") && (
              <div className="bg-emerald-950/20 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-[10px] tracking-widest"><ShoppingBag className="w-4 h-4"/> Marketplace Listing Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="e.g. $450 or Trade" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none shadow-inner" />
                  <select value={itemCondition} onChange={e => setItemCondition(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-emerald-400 outline-none cursor-pointer shadow-inner">
                    {CONDITION_TYPES.map((c: string) => <option key={c} value={c} className="bg-black">{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {postCategory === "Custom Builds" && (
              <div className="bg-purple-950/20 backdrop-blur-md border border-purple-500/30 p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-purple-400 font-black uppercase text-[10px] tracking-widest"><Wrench className="w-4 h-4"/> Mod Shop Component Tags</div>
                <input type="text" placeholder="e.g. Hydraulic Brakes, 72V Controller..." value={modTags} onChange={e => setModTags(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none shadow-inner" />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-black/40 border border-white/10 rounded-xl shadow-inner">
              <span className="text-[10px] font-black uppercase text-white">Flag as Diagnostic SOS</span>
              <button type="button" onClick={() => { triggerHaptic("LIGHT"); setIsHelpNeeded(!isHelpNeeded); if(!isHelpNeeded) setPostCategory("Hardware Diagnostics"); }} className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${isHelpNeeded ? 'bg-red-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}>
                <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {mediaPreview && (
              <div className="relative w-full h-42 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                <img src={mediaPreview} alt="" className="w-full h-full object-cover opacity-90" />
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="absolute top-3 right-3 bg-black/80 p-2 rounded-full text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            )}

            {videoPreview && (
              <div className="relative w-full h-42 rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-black">
                <video src={videoPreview} className="w-full h-full object-contain" controls />
                <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(null); }} className="absolute top-3 right-3 bg-black/80 p-2 rounded-full text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            )}

            <AnimatePresence>
              {showCustomizer && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-3 overflow-hidden shadow-inner">
                   <label className={`text-[10px] ${t.text} font-black uppercase tracking-widest block mb-2 flex items-center gap-1.5`}><Palette className="w-4 h-4"/> Custom PEV Background Templates</label>
                   <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {PEV_TEMPLATES.map((temp: any) => (
                        <button key={temp.id} type="button" onClick={() => { triggerHaptic("LIGHT"); setPostTemplate(temp.id); if(temp.id === "market") setPostCategory("Marketplace"); }} className={`p-3 rounded-xl min-w-[140px] text-[9px] font-black uppercase tracking-widest border cursor-pointer shrink-0 ${postTemplate === temp.id ? `${t.border} ${t.bgSubtle} ${t.text} ${t.glow}` : 'border-white/10 bg-black/40 text-zinc-400'}`}>
                          {temp.name}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}

              {showPollBuilder && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-3 overflow-hidden shadow-inner">
                  <div className={`flex items-center gap-2 ${t.text} font-black uppercase tracking-widest text-[10px]`}><BarChart2 className="w-4 h-4"/> Build Poll</div>
                  <input type="text" placeholder="Question..." value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pollOptions.map((opt: any, idx: number) => (
                      <input key={opt.id} type="text" placeholder={`Option ${idx+1}`} value={opt.text} onChange={e=>{
                        const newOpts = [...pollOptions]; newOpts[idx].text = e.target.value; setPollOptions(newOpts);
                      }} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" />
                    ))}
                  </div>
                </motion.div>
              )}

              {showAdvanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-black/60 border border-white/10 p-4 rounded-2xl space-y-4 overflow-hidden shadow-inner">
                  <div>
                    <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-500"/> YouTube Link</label>
                    <input type="text" placeholder="Paste Video URL..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5`}><Gauge className={`w-3.5 h-3.5 ${t.text}`}/> Top Speed</label>
                      <input type="number" placeholder="0.0" value={topSpeed} onChange={(e) => setTopSpeed(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-amber-400"/> Motor Temp</label>
                      <input type="number" placeholder="0.0" value={motorTemp} onChange={(e) => setMotorTemp(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 w-full sm:w-auto">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaPick} className="hidden" />
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleCameraSnap} className="hidden" />
                <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoPick} className="hidden" />
                
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="p-3 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl cursor-pointer"><Camera className="w-4 h-4" /></button>
                <button type="button" onClick={() => videoInputRef.current?.click()} className="p-3 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl cursor-pointer"><Video className="w-4 h-4" /></button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl cursor-pointer"><ImagePlus className="w-4 h-4" /></button>
                <button type="button" onClick={() => setShowCustomizer(!showCustomizer)} className={`p-3 rounded-xl border cursor-pointer ${showCustomizer ? `${t.bgSubtle} ${t.text} ${t.borderSubtle}` : 'bg-black/50 text-zinc-400 border-white/10'}`}><Palette className="w-4 h-4" /></button>
                <button type="button" onClick={() => setShowPollBuilder(!showPollBuilder)} className={`p-3 rounded-xl border cursor-pointer ${showPollBuilder ? `${t.bgSubtle} ${t.text} ${t.borderSubtle}` : 'bg-black/50 text-zinc-400 border-white/10'}`}><BarChart2 className="w-4 h-4" /></button>
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-1.5 p-3 rounded-xl text-[10px] font-black uppercase border cursor-pointer ${showAdvanced ? "bg-white/10 text-white border-white/30" : "bg-black/50 text-zinc-400 border-white/10"}`}><Sliders className="w-4 h-4" /></button>
              </div>

              <button type="submit" disabled={isPublishing || !postText.trim() || !username.trim()} className={`font-black text-xs px-6 py-3.5 rounded-xl uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shrink-0 cursor-pointer ${isHelpNeeded ? 'bg-red-500 hover:bg-red-400 text-white' : `${t.bg} text-black hover:opacity-90 ${t.glow}`}`}>
                {isPublishing ? <><Loader2 className="w-4 h-4 animate-spin"/> Syncing</> : <><Send className="w-4 h-4" /> Broadcast</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}