import React from "react";
import { 
  Globe, Sparkles, Search, Sliders, Layers, FileText, Loader2, 
  ChevronUp, ChevronDown, ExternalLink, Cpu, AlertTriangle, 
  ChevronLeft, ChevronRight, Maximize2 
} from "lucide-react";

export default function SpecEngineTab({
  dbSearch, setDbSearch, searchLiveSpecs, handleRandomDiscovery,
  specCategoryFilter, setSpecCategoryFilter, specSortBy, setSpecSortBy,
  exportToCSV, isSearchingDb, hasSearchedDb, filteredAndSortedSpecs,
  displayCountSpecs, setDisplayCountSpecs, expandedPevIdx, setExpandedPevIdx,
  activeImageIndices, setActiveImageIndices, compareList, toggleCompare,
  setActiveVideoUrl, setActiveVideoTitle, setLightboxState, themeColors
}: any) {
  const t = themeColors;

  return (
    <div className="space-y-6">
      <div className={`flex flex-col md:flex-row justify-between items-center gap-3 bg-black/40 p-3 rounded-2xl border ${t.borderSubtle} shadow-inner`}>
        <div className={`flex items-center gap-2 bg-black/60 border border-white/10 rounded-2xl px-3 py-1.5 flex-1 w-full min-h-[48px] shadow-inner`}>
          <Globe className={`w-4 h-4 ${t.text} animate-pulse shrink-0`} />
          <input 
            type="text"
            value={dbSearch}
            onChange={(e) => setDbSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLiveSpecs()}
            placeholder="Search any model configuration (e.g. Dualtron Storm, Segway GT2...)"
            className="bg-transparent border-none text-xs text-white outline-none w-full font-bold placeholder:text-zinc-600 px-2 min-h-[40px]"
          />
          <button 
            type="button"
            onClick={() => searchLiveSpecs()}
            disabled={isSearchingDb || !dbSearch.trim()}
            className={`${t.bg} text-black px-5 min-h-[40px] rounded-xl font-black uppercase tracking-widest text-[10px] cursor-pointer shadow-md disabled:opacity-50 shrink-0`}
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            type="button"
            onClick={handleRandomDiscovery}
            disabled={isSearchingDb}
            className={`flex-1 md:flex-none bg-white/5 hover:bg-white/10 border border-white/10 ${t.text} px-4 min-h-[48px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-inner`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${t.text}`} /> Random Discovery
          </button>
          
          <button 
            type="button"
            onClick={() => searchLiveSpecs()}
            disabled={isSearchingDb || !dbSearch.trim()}
            className={`flex-1 md:flex-none ${t.bg} disabled:opacity-50 text-black px-6 min-h-[48px] rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg`}
          >
            {isSearchingDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Max-Capacity Scan
          </button>
        </div>
      </div>

      {filteredAndSortedSpecs.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/50 p-3 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs">
              <Sliders className={`w-3.5 h-3.5 ${t.text}`} />
              <select value={specCategoryFilter} onChange={(e) => setSpecCategoryFilter(e.target.value)} className="bg-black/60 border border-white/10 text-white text-[10px] font-bold rounded-xl px-3 py-2 outline-none cursor-pointer min-h-[40px]">
                <option value="all">All Categories</option>
                <option value="e-bike">E-Bike</option>
                <option value="e-scooter">E-Scooter</option>
                <option value="euc">EUC</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Layers className={`w-3.5 h-3.5 ${t.text}`} />
              <select value={specSortBy} onChange={(e) => setSpecSortBy(e.target.value)} className="bg-black/60 border border-white/10 text-white text-[10px] font-bold rounded-xl px-3 py-2 outline-none cursor-pointer min-h-[40px]">
                <option value="default">Default Match</option>
                <option value="speed_desc">Top Speed (High to Low)</option>
                <option value="range_desc">Max Range (High to Low)</option>
                <option value="price_asc">Price (Low to High)</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={() => exportToCSV("specs")} className="px-4 min-h-[44px] rounded-2xl text-[9px] font-black uppercase tracking-widest border bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white cursor-pointer shrink-0">
            <FileText className="w-3.5 h-3.5 inline mr-1" /> CSV Export
          </button>
        </div>
      )}

      {isSearchingDb && (
        <div className="text-center py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className={`w-10 h-10 ${t.text} animate-spin`} />
          <div className={`${t.text} font-mono text-[10px] uppercase tracking-widest animate-pulse`}>Parsing global specification nodes...</div>
        </div>
      )}

      {!isSearchingDb && filteredAndSortedSpecs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 bg-black/20">
          <Globe className="w-8 h-8 opacity-20" />
          {hasSearchedDb ? "0 Compatible Technical Datasheets Parsed." : "Execute a search to isolate high-fidelity vehicle arrays."}
        </div>
      ) : !isSearchingDb && (
        <div className="flex flex-col gap-4">
          {filteredAndSortedSpecs.slice(0, displayCountSpecs).map((pev: any, idx: number) => {
            const isExpanded = expandedPevIdx === idx;
            const currentImgIdx = activeImageIndices[idx] || 0;
            const totalImages = pev.imageUrls?.length || 1;
            const isComparing = compareList.some((p: any) => p.name === pev.name && p.brand === pev.brand);

            return (
              <div key={idx} className="bg-black/50 border border-white/10 rounded-3xl p-5 flex flex-col shadow-xl backdrop-blur-md">
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="w-full lg:w-48 flex flex-col gap-2 shrink-0">
                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-white border border-white/10 relative flex items-center justify-center shadow-inner">
                      <img src={pev.imageUrls?.[currentImgIdx]} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndices((prev: any) => ({ ...prev, [idx]: currentImgIdx === 0 ? totalImages - 1 : currentImgIdx - 1 })); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setActiveImageIndices((prev: any) => ({ ...prev, [idx]: currentImgIdx === totalImages - 1 ? 0 : currentImgIdx + 1 })); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setLightboxState({ pevIdx: idx, imgIdx: currentImgIdx })} className="absolute bottom-2 right-2 bg-black/80 p-2 rounded-xl text-white cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono">{pev.brand}</div>
                          <h4 className="text-white font-black text-base uppercase leading-tight">{pev.name}</h4>
                        </div>
                        <button type="button" onClick={() => toggleCompare(pev)} className={`text-[9px] font-black uppercase px-4 min-h-[40px] rounded-2xl border cursor-pointer ${isComparing ? "bg-amber-500 text-black border-amber-400 font-black" : "bg-white/5 text-zinc-300 border-white/10"}`}>
                          {isComparing ? "✓ In Matrix" : "+ Compare"}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3.5 text-[10px] font-mono bg-black/40 p-3 rounded-2xl border border-white/5">
                        <div className="flex justify-between"><span className="text-zinc-500">PRICE:</span><span className={`${t.text} font-bold`}>{pev.price}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">SPEED:</span><span className="text-white font-bold">{pev.topSpeed}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-500">RANGE:</span><span className="text-white font-bold">{pev.range}</span></div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setExpandedPevIdx(isExpanded ? null : idx)} className={`flex-1 bg-white/5 border border-white/10 ${t.text} font-black text-[10px] uppercase min-h-[46px] rounded-2xl cursor-pointer flex items-center justify-center gap-2`}>
                        {isExpanded ? <>Collapse Details <ChevronUp className="w-4 h-4" /></> : <>Expand Data Sheet <ChevronDown className="w-4 h-4" /></>}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-white/10 bg-black/50 p-5 rounded-2xl space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] font-mono">
                      <div className="space-y-1"><p className="text-zinc-400 text-[9px]">Tires:</p><p className="text-zinc-200 font-bold bg-black/60 p-2.5 rounded-xl">{pev.tireProfile || "N/A"}</p></div>
                      <div className="space-y-1"><p className="text-zinc-400 text-[9px]">Brakes:</p><p className="text-zinc-200 font-bold bg-black/60 p-2.5 rounded-xl">{pev.brakingSystem || "N/A"}</p></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}