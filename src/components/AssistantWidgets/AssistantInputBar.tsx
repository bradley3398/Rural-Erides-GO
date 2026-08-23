import React from "react";
import { ImagePlus, Camera, Mic, MicOff, ImageIcon, Youtube, Send, X, Loader2 } from "lucide-react";

export default function AssistantInputBar({
  input, setInput, handleSearch, selectedImage, clearSelectedImage,
  isUploadingImg, fileInputRef, cameraInputRef, handleImageUpload,
  toggleListening, isListening, enableImageSearch, setEnableImageSearch,
  enableYouTubeSearch, setEnableYouTubeSearch, isSearching, deepReasoningMode,
  fontSizeClass, themeColors
}: any) {
  const t = themeColors;

  return (
    <div className="mt-2 flex flex-col gap-2 shrink-0 relative z-10 border-t border-white/10 pt-3">
      
      <div className="flex gap-2 items-center justify-between">
        {selectedImage ? (
          <div className="relative inline-block w-fit">
            <img src={selectedImage} alt="" className={`h-10 w-10 object-cover rounded-lg border ${t.border} shadow-lg`} />
            <button type="button" onClick={clearSelectedImage} className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-lg cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImg} className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl cursor-pointer shadow-md shrink-0">
              {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4.5 h-4.5" />}
            </button>

            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={isUploadingImg} className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-xl cursor-pointer shadow-md shrink-0">
              {isUploadingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4.5 h-4.5" />}
            </button>

            <button type="button" onClick={toggleListening} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer shadow-md shrink-0 ${isListening ? "bg-rose-900/60 border-rose-500/50 text-rose-400 animate-pulse" : "bg-white/5 border-white/10 text-zinc-300 hover:text-white"}`}>
              {isListening ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button type="button" onClick={() => setEnableImageSearch(!enableImageSearch)} className={`min-h-[44px] px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${enableImageSearch ? `${t.dim}` : 'bg-black/40 border-white/10 text-zinc-500'}`}>
            <ImageIcon className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">{enableImageSearch ? "Pics ON" : "Pics OFF"}</span>
          </button>
          <button type="button" onClick={() => setEnableYouTubeSearch(!enableYouTubeSearch)} className={`min-h-[44px] px-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm ${enableYouTubeSearch ? 'bg-rose-950/40 text-rose-400 border-rose-900/50' : 'bg-black/40 border-white/10 text-zinc-500'}`}>
            <Youtube className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">{enableYouTubeSearch ? "YT ON" : "YT OFF"}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <textarea 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch(input); } }}
          rows={1}
          className={`flex-1 min-w-0 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl py-3 px-4 text-white ${fontSizeClass} font-bold outline-none focus:border-white/30 placeholder:text-zinc-500 min-h-[44px] max-h-[120px] custom-scrollbar shadow-inner resize-none leading-relaxed`}
          placeholder="Ask Copilot or input trail logs..."
        />
        
        <button 
          type="button"
          onClick={() => handleSearch(input)}
          disabled={(!input.trim() && !selectedImage) || isSearching || isUploadingImg}
          className={`min-h-[44px] h-[44px] w-16 shrink-0 rounded-xl disabled:opacity-20 flex items-center justify-center cursor-pointer shadow-lg ${deepReasoningMode ? 'bg-amber-500 text-black' : `${t.bg} text-black`}`}
        >
          <Send className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}