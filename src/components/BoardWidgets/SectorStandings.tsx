import React from "react";
import { Award, Activity } from "lucide-react";

export default function SectorStandings({ topSpeedRecord, topScout, scoutCount, mvpUser, mvpVolts, isGpsLocked, useMetric, themeColors, onOpenProfile }: any) {
  const t = themeColors;
  return (
    <div className="mb-6 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 ${t.bg} opacity-5 rounded-full blur-[80px] pointer-events-none`}></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-white/10 pb-4 gap-3">
        <h3 className={`text-sm font-black uppercase tracking-widest ${t.text} flex items-center gap-2`}>
          <Award className="w-5 h-5" /> 
          {isGpsLocked ? "Local 50-Mile Sector Standings" : "Global Network Standings"}
        </h3>
        <span className="text-[9px] font-mono text-zinc-400 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 w-fit">
          <Activity className="w-3 h-3 text-amber-400 animate-pulse" /> LIVE SYNC
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-inner cursor-pointer hover:bg-amber-900/30 transition-colors" onClick={() => topSpeedRecord.user !== "Awaiting Data" && onOpenProfile(topSpeedRecord.user)}>
          <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)] shrink-0">1</div>
          <div className="min-w-0">
            <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest block mb-0.5">Top Speed Record</span>
            <span className="text-white font-bold text-sm truncate block">{topSpeedRecord.user}</span>
            <span className="text-[10px] text-zinc-400 font-mono block truncate">{topSpeedRecord.speed} {useMetric ? 'KM/H' : 'MPH'} • {topSpeedRecord.vehicle}</span>
          </div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-inner cursor-pointer hover:bg-emerald-900/30 transition-colors" onClick={() => topScout !== "Awaiting Data" && onOpenProfile(topScout)}>
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] shrink-0">2</div>
          <div className="min-w-0">
            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest block mb-0.5">Elite Trail Scout</span>
            <span className="text-white font-bold text-sm truncate block">{topScout}</span>
            <span className="text-[10px] text-zinc-400 font-mono block truncate">{scoutCount} Verified Paths Logged</span>
          </div>
        </div>
        <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-inner cursor-pointer hover:bg-cyan-900/30 transition-colors" onClick={() => mvpUser !== "Awaiting Data" && onOpenProfile(mvpUser)}>
          <div className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">3</div>
          <div className="min-w-0">
            <span className="text-[9px] text-cyan-500 font-black uppercase tracking-widest block mb-0.5">Community MVP</span>
            <span className="text-white font-bold text-sm truncate block">{mvpUser}</span>
            <span className="text-[10px] text-zinc-400 font-mono block truncate">{mvpVolts} Volts Earned</span>
          </div>
        </div>
      </div>
    </div>
  );
}