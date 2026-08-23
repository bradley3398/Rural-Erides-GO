import React from "react";
import { Globe } from "lucide-react";

export default function TacticalGrid({ showTactical, setShowTactical, tacticalFeatures, handleSearch, themeColors }: any) {
  const t = themeColors;

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowTactical(!showTactical)}
        className="w-full min-h-[44px] flex items-center justify-between bg-white/5 border border-white/10 px-4 rounded-xl mb-2 text-zinc-300 hover:text-white transition-all duration-300 active:scale-95 shadow-md shrink-0 cursor-pointer backdrop-blur-md"
      >
        <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
          <Globe className={`w-3.5 h-3.5 ${t.text}`} /> Tactical Quick Actions &amp; Scout Filters (20 Modes)
        </span>
      </button>

      {showTactical && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-2 shrink-0 overflow-y-auto max-h-[160px] custom-scrollbar p-0.5">
          {tacticalFeatures.map((feature: any) => (
            <button 
              key={feature.id}
              type="button"
              onClick={() => handleSearch(feature.prompt)} 
              className="min-h-[44px] flex items-center gap-2 bg-black/40 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white text-[9px] uppercase font-black px-3 py-2 rounded-xl transition-all active:scale-95 text-left cursor-pointer shadow-inner backdrop-blur-md"
            >
              <feature.icon className={`w-3.5 h-3.5 shrink-0 ${t.text}`} />
              <span className="truncate tracking-wide">{feature.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}