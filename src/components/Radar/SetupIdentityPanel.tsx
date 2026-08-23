"use client";

import React from "react";
import { Settings, Cpu, Navigation, ShieldAlert, Activity, EyeOff } from "lucide-react";

export default function SetupIdentityPanel(props: any) {
  const {
    t, bgPanel, brd, txtMain, txtMuted, bgList, bgInput, meshLatency, gpsPrecision,
    isSharingLocation, toggleBroadcast, callsign, pevType, setPevType, estRange, setEstRange,
    useMetric, userStatus, setUserStatus, isGhostMode, handleGhostModeToggle, saveRadarConfig, profileSaved
  } = props;

  return (
    <div className={`${bgPanel} border ${brd} rounded-2xl p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] relative overflow-hidden flex flex-col justify-between`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${t.bg}`}></div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`${txtMain} font-black text-sm tracking-widest flex items-center gap-2 uppercase`}>
            <Settings className={`w-4 h-4 ${t.text}`} /> SETUP & IDENTITY
          </h3>
          <div className="flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
            <Cpu className="w-3 h-3 animate-pulse" /> RTT: {meshLatency}ms | {gpsPrecision}
          </div>
        </div>

        <div className={`mb-4 ${bgList} p-3 rounded-xl border ${brd} flex items-center justify-between shadow-inner`}>
          <span className={`text-[10px] ${txtMuted} font-bold uppercase tracking-widest flex items-center gap-2`}>
            {isSharingLocation ? <Navigation className={`w-4 h-4 ${t.text} animate-pulse`} /> : <Navigation className="w-4 h-4 text-zinc-600" />}
            Map Visibility Broadcast
          </span>
          <button 
            onClick={toggleBroadcast} 
            className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors shadow-inner cursor-pointer ${isSharingLocation ? t.bg : "bg-zinc-800"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${isSharingLocation ? "translate-x-6" : "translate-x-1"}`}/>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={`text-[10px] ${txtMuted} uppercase tracking-widest block mb-1 font-bold flex justify-between`}>
              <span>Callsign</span>
              <span className="text-rose-500 text-[8px] font-mono flex items-center gap-0.5">
                <ShieldAlert className="w-2.5 h-2.5"/> MASTER SYNC LOCKED
              </span>
            </label>
            <input 
              type="text" 
              value={callsign} 
              disabled={true}
              className={`w-full min-h-[44px] ${bgInput} text-sm rounded-xl px-3 py-2 outline-none font-bold transition-colors cursor-not-allowed opacity-60`} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`text-[10px] ${txtMuted} uppercase tracking-widest block mb-1 font-bold`}>Active PEV</label>
              <select value={pevType} onChange={(e) => setPevType(e.target.value)} className={`w-full min-h-[44px] ${bgInput} text-xs ${t.text} rounded-xl px-2 py-2 outline-none focus:${t.border} font-bold cursor-pointer`}>
                <option value="Electric Scooter">Scooter</option>
                <option value="Electric Bike">E-Bike</option>
                <option value="Electric Trike">Trike</option>
                <option value="Electric Moped">Moped</option>
                <option value="EUC / Unicycle">EUC</option>
              </select>
            </div>
            <div>
              <label className={`text-[10px] ${txtMuted} uppercase tracking-widest block mb-1 font-bold`}>Est. Range ({useMetric ? 'km' : 'mi'})</label>
              <input type="number" min="0" max="200" value={estRange} onChange={(e) => setEstRange(parseInt(e.target.value) || 0)} className={`w-full min-h-[44px] ${bgInput} text-xs ${t.text} rounded-xl px-3 py-2 outline-none focus:${t.border} font-bold`} />
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${bgList} border ${brd} px-2 py-2 rounded-xl min-h-[44px] shadow-inner`}>
            <Activity className={`w-4 h-4 ${txtMuted} shrink-0`} />
            <select value={userStatus} onChange={(e) => setUserStatus(e.target.value)} className={`w-full bg-transparent text-[11px] font-mono font-black ${txtMain} outline-none cursor-pointer`}>
              <option value="Cruising">🟢 Cruising</option>
              <option value="Off-Roading">🟣 Off-Roading</option>
              <option value="Group Ride">🚴‍♂️ Group Ride</option>
              <option value="Taking a Break">☕ Taking a Break</option>
              <option value="Charging">⚡ Charging</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className={`text-[10px] ${txtMuted} font-bold flex items-center gap-1.5`}><EyeOff className="w-3.5 h-3.5 text-rose-500"/> Ghost Mode (Hide Tracking)</span>
            <button onClick={() => handleGhostModeToggle(!isGhostMode)} className={`relative inline-flex min-h-[28px] min-w-[50px] items-center rounded-full transition-colors cursor-pointer ${isGhostMode ? "bg-rose-500" : "bg-zinc-800"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${isGhostMode ? "translate-x-6" : "translate-x-1"}`}/></button>
          </div>
        </div>
      </div>
      <button onClick={saveRadarConfig} className={`mt-4 w-full min-h-[44px] py-2 ${bgList} hover:bg-white/10 ${txtMain} border ${brd} text-xs font-black uppercase rounded-xl transition-all duration-300 active:scale-95 cursor-pointer shadow-md`}>
        {profileSaved ? <span className={t.text}>Radar Config Saved</span> : "Save Telemetry Config"}
      </button>
    </div>
  );
}