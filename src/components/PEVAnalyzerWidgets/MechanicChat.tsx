import React from "react";
import { 
  Wrench, UploadCloud, XCircle, Camera, CheckCircle, 
  AlertTriangle, Trash2, History, Mic, MicOff, Volume2, Square, 
  ImagePlus, ListChecks, Copy, Check, Loader2 
} from "lucide-react";

export default function MechanicChat({
  scanHistory, clearAllHistory, loadPreviousSession, activeSessionId,
  galleryInputRef, cameraInputRef, handleFileChange, previewUrl, clearImage,
  analyzeImage, isAnalyzing, messages, setMessages, errorMsg, question, setQuestion,
  toggleListening, isListening, currentlyReadingId, handleTTS, copyToClipboard,
  copiedId, chatEndRef, themeColors
}: any) {
  const t = themeColors;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-[#0a0a0f] p-4 rounded-3xl border border-white/10 shadow-xl space-y-3 backdrop-blur-xl">
          <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
            <Camera className={`w-3.5 h-3.5 ${t.text}`} /> Optical Inputs
          </h3>
          
          <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleFileChange} className="hidden" />
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />

          {!previewUrl ? (
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="border border-white/10 hover:border-white/20 rounded-2xl p-4 min-h-[56px] text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer shadow-inner"
              >
                <ImagePlus className={`w-5 h-5 text-zinc-400 group-hover:text-white transition-colors`} />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Upload Photo</span>
              </button>
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="border border-white/10 hover:border-white/20 rounded-2xl p-4 min-h-[56px] text-center bg-black/40 transition-all flex flex-col items-center justify-center gap-1.5 group cursor-pointer shadow-inner"
              >
                <Camera className={`w-5 h-5 text-zinc-400 group-hover:text-white transition-colors`} />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Open Camera</span>
              </button>
            </div>
          ) : (
            <div className={`relative rounded-2xl overflow-hidden border ${t.borderSubtle} bg-zinc-950 shadow-inner`}>
              <img src={previewUrl} alt="Inspection Target" className="w-full h-40 object-contain" />
              <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-black/80 hover:bg-rose-950 text-zinc-300 hover:text-rose-400 p-2 rounded-xl transition-all cursor-pointer shadow-lg">
                <XCircle className="w-4 h-4" />
              </button>
              <div className={`absolute bottom-2 left-2 bg-black/80 px-2.5 py-1 rounded-xl text-[8px] ${t.text} font-mono font-black flex items-center gap-1 shadow-md`}>
                <CheckCircle className="w-3 h-3" /> FRAME RECOGNIZED
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a0f] p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col h-[280px] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Garage Log Ledger
            </h3>
            {scanHistory.length > 0 && (
              <button type="button" onClick={clearAllHistory} className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer p-2 rounded-xl">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {scanHistory.length === 0 ? (
              <div className="text-center py-8 text-zinc-600">
                <Wrench className="w-5 h-5 mx-auto mb-2 opacity-20" />
                <p className="text-[8px] uppercase font-black tracking-widest">No Logs Logged</p>
              </div>
            ) : (
              scanHistory.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => loadPreviousSession(item)}
                  className={`p-3 min-h-[48px] bg-black/50 border rounded-2xl cursor-pointer transition-all shadow-inner ${activeSessionId === item.id ? `${t.borderSubtle} ${t.dim}` : 'border-white/5 hover:border-white/10 text-zinc-400'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-mono font-bold text-zinc-500">{item.timestamp}</span>
                    {activeSessionId === item.id && <span className={`w-1.5 h-1.5 rounded-full ${t.bg} animate-pulse`} />}
                  </div>
                  <p className="text-[9px] font-black text-zinc-200 truncate tracking-wide uppercase">{item.title}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-xl h-[595px] overflow-hidden backdrop-blur-xl">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <Wrench className={`w-12 h-12 ${t.text} mb-3 animate-pulse`} />
              <p className="text-[11px] text-zinc-400 font-black uppercase tracking-widest text-center font-mono">
                RURAL MECHANIC ACTIVE.<br/>Feed terminal prompt or snap hardware asset to index diagnostics.
              </p>
            </div>
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-3xl text-xs whitespace-pre-wrap leading-relaxed max-w-[90%] sm:max-w-[85%] shadow-lg ${
                  m.role === 'user' ? `${t.dim} text-zinc-100 rounded-br-sm border` : 'bg-[#181a20]/90 backdrop-blur-md border border-white/10 text-zinc-100 rounded-bl-sm font-medium shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                }`}>
                  {m.image && <img src={m.image} alt="" className="max-w-full h-32 object-cover rounded-2xl mb-3 border border-white/10" />}
                  <div className="relative z-10 space-y-2">
                    {m.text.split('\n').map((line: string, lineIdx: number) => (
                      <p key={lineIdx} className="min-h-[1rem] leading-relaxed">{line}</p>
                    ))}
                  </div>

                  {m.checklist && m.checklist.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                      <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest block flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" /> Interactive Troubleshooting Checklist:
                      </span>
                      {m.checklist.map((item: any, cIdx: number) => (
                        <label key={cIdx} className="flex items-center gap-2.5 min-h-[44px] text-xs text-zinc-200 cursor-pointer">
                          <input type="checkbox" checked={item.completed} onChange={() => {
                            setMessages((prev: any) => prev.map((msg: any) => {
                              if (msg.id !== m.id || !msg.checklist) return msg;
                              const updated = [...msg.checklist];
                              updated[cIdx] = { ...updated[cIdx], completed: !updated[cIdx].completed };
                              return { ...msg, checklist: updated };
                            }));
                          }} className="w-5 h-5 accent-current rounded cursor-pointer shrink-0" />
                          <span className={item.completed ? "line-through text-zinc-500 font-normal" : "font-bold"}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {m.role === 'ai' && (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => handleTTS(m.text, m.id)} className={`text-[10px] min-h-[38px] px-3 font-bold uppercase flex items-center gap-1.5 cursor-pointer bg-black/50 border border-white/10 rounded-xl ${currentlyReadingId === m.id ? 'text-rose-400' : `${t.text}`}`}>
                      {currentlyReadingId === m.id ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {currentlyReadingId === m.id ? "Kill Audio" : "Voice Read"}
                    </button>
                    <button type="button" onClick={() => copyToClipboard(m.text, m.id)} className="text-[10px] min-h-[38px] px-3 font-bold uppercase flex items-center gap-1.5 text-zinc-400 hover:text-white cursor-pointer bg-black/50 border border-white/10 rounded-xl">
                      <Copy className="w-3.5 h-3.5" /> {copiedId === m.id ? "Synced" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-[#181a20]/90 border border-white/10 rounded-2xl p-4 flex items-center gap-2 shadow-lg">
                <Loader2 className={`w-4 h-4 ${t.text} animate-spin`} />
                <span className="text-xs text-zinc-300 font-mono">Analyzing telemetry payload...</span>
              </div>
            </div>
          )}
          
          {errorMsg && <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs rounded-2xl p-4 flex gap-3 items-start"><AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />{errorMsg}</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 bg-black/60 border-t border-white/10 flex gap-2 items-end backdrop-blur-xl">
          <button type="button" onClick={toggleListening} className={`p-3.5 min-h-[48px] min-w-[48px] rounded-2xl border flex items-center justify-center cursor-pointer ${isListening ? "bg-rose-500/25 border-rose-500 text-rose-400 animate-pulse" : "bg-white/5 border-white/10 text-zinc-300"}`}>
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); analyzeImage(); } }}
            rows={1}
            placeholder="Submit mechanical parameter inquiry..."
            className="flex-1 bg-black/50 border border-white/10 text-xs text-white rounded-2xl py-3 px-4 outline-none font-bold min-h-[48px] max-h-[120px] resize-none leading-relaxed shadow-inner"
          />
          
          <button type="button" onClick={() => analyzeImage()} disabled={isAnalyzing || (!question.trim() && !previewUrl)} className={`p-3.5 h-[48px] w-16 shrink-0 rounded-2xl font-black uppercase text-xs flex items-center justify-center border ${t.bg} text-black cursor-pointer shadow-lg disabled:opacity-30`}>
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}