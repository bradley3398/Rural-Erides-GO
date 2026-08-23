import React from "react";
import { 
  Globe, Sliders, LifeBuoy, FileText, Loader2, Wrench, 
  ExternalLink, Copy, Trash2, ShoppingCart, ShoppingBag 
} from "lucide-react";

export default function PartsFinderTab({
  universalPartQuery, setUniversalPartQuery, partsMake, setPartsMake,
  partsModel, setPartsModel, partsCategory, setPartsCategory, searchLiveParts,
  partsDifficultyFilter, setPartsDifficultyFilter, exportToCSV,
  buildManifest, copyManifest, clearManifest, isSearchingParts,
  hasSearchedParts, filteredParts, displayCountParts, setDisplayCountParts,
  addToManifest, userRegion, getRegionalDomainSuffix, themeColors
}: any) {
  const t = themeColors;

  return (
    <div className="space-y-4">
      <div className="bg-black/40 border border-white/10 p-5 rounded-3xl space-y-4 backdrop-blur-xl shadow-inner">
        <div className="grid grid-cols-1 gap-4 bg-black/60 p-4 border border-white/10 rounded-2xl shadow-inner">
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-widest ${t.text} font-mono flex items-center gap-1`}>
              <Globe className="w-3.5 h-3.5" /> Universal Component Lookup Profile
            </label>
            <div className="flex items-center gap-2 bg-black border border-white/10 rounded-2xl px-3 py-1.5 flex-1 min-h-[48px]">
              <input 
                type="text"
                value={universalPartQuery}
                onChange={(e) => setUniversalPartQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchLiveParts()}
                placeholder="e.g. 20x4.0 fat tire inner tube, hydraulic brake pads..."
                className="bg-transparent border-none text-xs text-white outline-none w-full font-bold px-2 py-2 min-h-[40px]"
              />
              <button 
                type="button"
                onClick={() => searchLiveParts()}
                disabled={isSearchingParts || !universalPartQuery.trim()}
                className={`${t.bg} text-black px-5 min-h-[40px] rounded-xl font-black uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50`}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {buildManifest.length > 0 && (
          <div className={`${t.dim} border rounded-2xl p-4 flex justify-between items-center font-mono text-xs shadow-inner`}>
            <div className={`flex items-center gap-2 ${t.text}`}>
              <FileText className="w-4 h-4" />
              <span>Active Build Worksheet Manifest: <strong>{buildManifest.length} Components</strong></span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={copyManifest} className="text-zinc-300 uppercase text-[9px] font-black cursor-pointer px-3 py-1 bg-black/40 rounded-xl border border-white/10">Export</button>
              <button type="button" onClick={clearManifest} className="text-zinc-400 hover:text-rose-400 uppercase text-[9px] font-black cursor-pointer px-3 py-1 bg-black/40 rounded-xl border border-white/10">Clear</button>
            </div>
          </div>
        )}

        {isSearchingParts && (
          <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
            <Loader2 className={`w-10 h-10 ${t.text} animate-spin`} />
            <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>Sweeping global component supply lines...</div>
          </div>
        )}

        {!isSearchingParts && filteredParts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 bg-black/20">
            <Wrench className="w-8 h-8 opacity-20" />
            {hasSearchedParts ? "0 Parts Discovered." : "Initiate real-time scans to aggregate factory stores."}
          </div>
        ) : !isSearchingParts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParts.slice(0, displayCountParts).map((part: any, index: number) => (
              <div key={index} className="bg-black/50 border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 shadow-xl">
                <div className="w-full sm:w-28 h-28 bg-white border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 shrink-0">
                  <img src={part.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <div className="flex-1 flex flex-col justify-between font-mono text-[10px]">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 ${t.text} font-bold uppercase`}>{part.category}</span>
                      <span className={`${t.text} font-black text-xs`}>{part.estimatedPrice}</span>
                    </div>
                    <h4 className="text-zinc-100 font-black text-xs uppercase mt-2 line-clamp-1">{part.partName}</h4>
                    <p className="text-zinc-400 mt-1">Compatibility: {part.compatibility}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <a href={part.partUrl} target="_blank" rel="noreferrer" className={`flex-1 ${t.bg} text-black font-black uppercase text-[9px] min-h-[44px] py-2 px-3 rounded-2xl text-center flex items-center justify-center gap-1.5`}>
                      Acquire Component <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button type="button" onClick={() => addToManifest(part)} className="bg-white/5 border border-white/10 text-zinc-300 hover:text-white px-3.5 min-h-[44px] rounded-2xl text-[9px] uppercase font-bold cursor-pointer">
                      + Worksheet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}