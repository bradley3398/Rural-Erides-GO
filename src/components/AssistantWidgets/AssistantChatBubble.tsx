import React from "react";
import { UserCircle, BrainCircuit, Youtube, ImageIcon, Maximize2, Volume2, Square, Copy, Check } from "lucide-react";

export default function AssistantChatBubble({ 
  m, i, callsign, persona, t, fontSizeClass, performanceMode, 
  currentlyReadingIndex, handleTTS, copyToClipboard, copiedIndex, 
  setLightboxImg, maxImageCount 
}: any) {
  return (
    <div className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
      
      <div className={`flex items-center gap-1.5 mb-1.5 ${m.role === 'user' ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${m.role === 'user' ? `${t.border} bg-white/5` : `${t.bg} border-transparent shadow-lg`}`}>
          {m.role === 'user' ? <UserCircle className={`w-3 h-3 ${t.text}`} /> : <BrainCircuit className="w-3 h-3 text-black" />}
        </div>
        <span className="text-[8px] font-mono font-black text-zinc-500 tracking-widest uppercase">
          [{m.timestamp || "Log"} // {m.role === 'user' ? (callsign ? callsign : 'PILOT') : `SYSTEM.${persona?.toUpperCase() || 'AI'}`}]
        </span>
      </div>

      <div className={`p-4 rounded-2xl ${fontSizeClass} whitespace-pre-wrap leading-relaxed max-w-[90%] font-sans relative overflow-hidden ${
        m.role === 'user' 
          ? `${t.bg} text-black font-bold rounded-tr-sm shadow-xl` 
          : `bg-black/60 backdrop-blur-2xl border ${t.subtle} text-zinc-100 rounded-tl-sm font-medium shadow-[0_4px_30px_rgba(0,0,0,0.5)]`
      }`}>
        
        {m.role === 'ai' && !performanceMode && (
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        )}

        <div className="relative z-10 space-y-2">
          {((m.text || '').split('\n')).map((line: string, lineIdx: number) => {
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
            const cleanLine = line.replace(/^[\*\-]\s/, '');
            
            const formattedLine = cleanLine.split(/(\*\*.*?\*\*)/g).map((part: string, pIdx: number) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className="font-black text-white tracking-wide">{part.slice(2, -2)}</strong>;
              }
              return <span key={pIdx}>{part}</span>;
            });

            if (isBullet) {
              return (
                <div key={lineIdx} className="flex items-start gap-2.5 pl-2 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 shadow-lg ${m.role === 'user' ? 'bg-black/50' : `${t.bg} shadow-[0_0_8px_currentColor]`}`} />
                  <div className="flex-1 leading-relaxed">{formattedLine}</div>
                </div>
              );
            }
            return <p key={lineIdx} className="min-h-[1rem] leading-relaxed">{formattedLine}</p>;
          })}
        </div>

        {m.youtubeVideos?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
            <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
              <Youtube className="w-3.5 h-3.5 text-rose-500" /> Integrated Research &amp; Media Feed:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {m.youtubeVideos.map((yt: any, ytIdx: number) => (
                <div key={ytIdx} className="rounded-xl border border-white/10 bg-black/60 overflow-hidden flex flex-col shadow-inner">
                  <div className="relative w-full aspect-video bg-zinc-950">
                    {yt.videoId ? (
                      <iframe src={`https://www.youtube.com/embed/${yt.videoId}`} title={yt.title} className="w-full h-full border-0" allowFullScreen />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] uppercase font-mono">Video Unavailable</div>
                    )}
                  </div>
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <span className="text-[10px] font-bold text-zinc-200 line-clamp-2">{yt.title}</span>
                    <a href={yt.url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-mono text-zinc-400 hover:text-rose-400 truncate mt-1 block">Open on YouTube ↗</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {m.webImages?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
            <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-cyan-400" /> Discovered Route &amp; Terrain Photos (Up to {maxImageCount} Results):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {m.webImages.map((imgUrl: string, imgIdx: number) => (
                <div key={imgIdx} onClick={() => setLightboxImg(imgUrl)} className="block relative group overflow-hidden rounded-xl border border-white/10 bg-black/50 cursor-pointer aspect-square shadow-sm">
                  <img src={imgUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 mix-blend-lighten" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className={`flex gap-3 mt-1.5 px-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'} w-full items-center`}>
         {m.role === 'ai' && (
           <>
              <button 
                type="button"
                onClick={() => handleTTS(m.text || '', i)} 
                className={`min-h-[36px] px-2 text-[9px] font-black uppercase flex items-center gap-1.5 cursor-pointer border border-white/5 rounded-lg bg-black/35 backdrop-blur-md shadow-inner ${currentlyReadingIndex === i ? 'text-amber-400 animate-pulse' : `${t.text} hover:text-white`}`}
              >
                {currentlyReadingIndex === i ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {currentlyReadingIndex === i ? "Halt Feed" : "Read Aloud"}
              </button>

              <button 
                type="button"
                onClick={() => copyToClipboard(m.text || '', i)} 
                className="min-h-[36px] px-2 text-[9px] font-black uppercase flex items-center gap-1.5 cursor-pointer border border-white/5 rounded-lg bg-black/35 backdrop-blur-md shadow-inner text-zinc-400 hover:text-white"
              >
                {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === i ? "Synced" : "Copy Log"}
              </button>

              <span className="text-[8px] font-mono font-black text-zinc-600 tracking-widest uppercase ml-auto">
                TOKENS: {(m.text || '').split(/\s+/).length}
              </span>
           </>
         )}
      </div>
    </div>
  );
}