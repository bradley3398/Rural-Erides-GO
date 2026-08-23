"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, X } from "lucide-react";

export default function WatchlistDrawer(props: any) {
  const {
    showWatchlistDrawer, setShowWatchlistDrawer,
    savedWatchlist, filteredWatchlist,
    watchlistSearch, setWatchlistSearch,
    handleExportWatchlist, handleClearWatchlist,
    setActiveVideo
  } = props;

  if (!showWatchlistDrawer) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex justify-end bg-black/80 backdrop-blur-xl">
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="w-full max-w-md bg-black/80 backdrop-blur-3xl border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" /> Saved Watchlist Vault ({savedWatchlist.length})
              </h3>
              <button type="button" onClick={() => setShowWatchlistDrawer(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {savedWatchlist.length > 0 && (
              <div className="space-y-2 mb-4">
                <input 
                  type="text" 
                  value={watchlistSearch} 
                  onChange={(e) => setWatchlistSearch(e.target.value)} 
                  placeholder="Search saved watchlist..." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30 font-bold shadow-inner"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleExportWatchlist} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95">
                    Export List
                  </button>
                  <button type="button" onClick={handleClearWatchlist} className="flex-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95">
                    Clear Vault
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-3 max-h-[62vh] overflow-y-auto custom-scrollbar pr-1">
              {filteredWatchlist.length === 0 ? (
                <p className="text-xs text-zinc-400 font-mono text-center py-10 uppercase font-bold">No saved videos found in vault.</p>
              ) : (
                filteredWatchlist.map((item: any) => (
                  <div key={item.id} onClick={() => { setActiveVideo({ id: item.videoId, title: item.title, thumbnailUrl: item.thumbnail, url: `https://youtu.be/${item.videoId}`, category: {label: "Watchlist", color: "text-amber-400 bg-amber-950/40"}, views: "0", ytLikes: "0", publishedAt: new Date().toISOString(), timeAgo: "Saved" }); setShowWatchlistDrawer(false); }} className="bg-black/50 border border-white/10 p-3 rounded-xl flex items-center gap-3 shadow-inner hover:border-white/30 transition-colors cursor-pointer group">
                    <img src={item.thumbnail} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0 border border-white/10" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">{item.title}</h4>
                      <span className="text-[9px] text-zinc-400 font-mono">ID: {item.videoId}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button type="button" onClick={() => setShowWatchlistDrawer(false)} className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs py-3 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/10 shadow-md">Close Vault</button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}