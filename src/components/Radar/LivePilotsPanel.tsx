"use client";

import React from "react";
import { Users, MapPin } from "lucide-react";

export default function LivePilotsPanel(props: any) {
  const {
    sortedRiders, speedFilter, setSpeedFilter, statusFilter, setStatusFilter,
    useMetric, handleZoomTo, t, bgPanel, brd, txtMuted, txtMain, bgList
  } = props;

  return (
    <div className={`${bgPanel} border ${brd} rounded-2xl p-4 flex flex-col h-[320px] shadow-2xl`}>
      <div className="flex justify-between items-center mb-2 shrink-0">
         <span className={`text-[10px] ${txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5 font-mono`}>
           <Users className={`w-4 h-4 ${t.text} animate-pulse`} /> LIVE PILOTS ({sortedRiders.length})
         </span>
         <div className="flex gap-1">
           <select value={speedFilter} onChange={(e) => setSpeedFilter(e.target.value)} className={`bg-black/60 text-[8px] font-mono font-bold text-cyan-400 border border-zinc-800 rounded px-1.5 py-1 outline-none cursor-pointer`}>
             <option value="ALL">Speed: All</option>
             <option value="STATIONARY">Stationary</option>
             <option value="CRUISING">Cruising (&lt;30)</option>
             <option value="HIGH_SPEED">Fast (&gt;30)</option>
           </select>
           <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`bg-black/60 text-[8px] font-mono font-bold text-emerald-400 border border-zinc-800 rounded px-1.5 py-1 outline-none cursor-pointer`}>
             <option value="ALL">Status: All</option>
             <option value="Cruising">Cruising</option>
             <option value="Off-Roading">Off-Roading</option>
             <option value="Group Ride">Group Ride</option>
             <option value="Charging">Charging</option>
           </select>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {sortedRiders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <span className={`text-zinc-500 text-[10px] font-bold uppercase tracking-widest`}>No Active Pilots Matching Filters</span>
          </div>
        ) : (
          sortedRiders.map((rider: any) => {
            const isLive = (Date.now() - (rider.lastUpdated || Date.now())) < 60000 * 5; 
            return (
              <div key={rider.id} className={`p-3 rounded-xl ${bgList} border ${brd} flex items-center justify-between shadow-inner`}>
                <div className="min-w-0 pr-2">
                  <div className={`text-xs font-bold ${txtMain} truncate mb-0.5`}>{rider.name}</div>
                  <span className={`text-[9px] ${txtMuted} font-mono font-bold truncate flex items-center gap-1.5`}>
                    {isLive ? <span className={`w-1.5 h-1.5 rounded-full ${t.bg} animate-pulse`} /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
                    💨 {useMetric ? `${(rider.speed * 1.60934).toFixed(1)} KM/H` : `${(rider.speed || 0).toFixed(1)} MPH`} • 🔋 85%
                  </span>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-black font-mono ${t.text}`}>{rider.distance < 0.1 ? "HERE" : `${rider.distance.toFixed(1)}${useMetric ? 'km' : 'mi'}`}</span>
                  <button onClick={() => handleZoomTo(rider.lat, rider.lng)} className={`min-h-[28px] px-2 flex items-center justify-center gap-1 text-[9px] font-black ${t.text} hover:${txtMain} uppercase rounded-md ${t.dim} transition-all active:scale-95 cursor-pointer`}><MapPin className="w-3 h-3"/> Locate</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}