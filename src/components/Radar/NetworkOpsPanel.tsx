"use client";

import React from "react";
import { Radar, Users, Calendar, X, AlertTriangle, Zap, AlertOctagon } from "lucide-react";

export default function NetworkOpsPanel(props: any) {
  const {
    handleSendPing, handleAssembleHere, isSettingMeetup, setIsSettingMeetup,
    meetupDesc, setMeetupDesc, handleProposeMeetup, customPin, isSettingHazard,
    setIsSettingHazard, hazardType, setHazardType, handleDropHazard, isSettingWaypoint,
    setIsSettingWaypoint, waypointTitle, setWaypointTitle, waypointCategory,
    setWaypointCategory, handleDropWaypoint, handleSendSOS,
    t, bgPanel, brd, txtMain, txtMuted, bgList, bgInput
  } = props;

  return (
    <div className={`${bgPanel} border ${brd} rounded-2xl p-5 shadow-[0_0_20px_rgba(163,230,53,0.05)] relative overflow-hidden flex flex-col justify-between`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-500"></div>
      <div>
        <h3 className={`${txtMain} font-black text-sm tracking-widest flex items-center gap-2 mb-4 uppercase`}>
          <Radar className="w-4 h-4 text-amber-400 animate-pulse" /> NETWORK OPS
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => handleSendPing("⚡ Need a Charge Station")} className={`min-h-[44px] py-1.5 ${bgList} border ${brd} hover:${t.border} ${txtMuted} ${t.hover} text-[9px] font-black rounded-xl uppercase transition-all cursor-pointer shadow-sm`}>
              ⚡ Need Charge
            </button>
            <button onClick={() => handleSendPing("☕ Taking a Pit Stop")} className={`min-h-[44px] py-1.5 ${bgList} border ${brd} hover:${t.border} ${txtMuted} ${t.hover} text-[9px] font-black rounded-xl uppercase transition-all cursor-pointer shadow-sm`}>
              ☕ Pit Stop
            </button>
            <button onClick={() => handleSendPing("🌲 Trail is Clear")} className={`min-h-[44px] py-1.5 ${bgList} border ${brd} hover:${t.border} ${txtMuted} ${t.hover} text-[9px] font-black rounded-xl uppercase transition-all cursor-pointer shadow-sm`}>
              🌲 Clear Trail
            </button>
            <button onClick={() => handleSendPing("🛑 Hazard Up Ahead")} className={`min-h-[44px] py-1.5 ${bgList} border ${brd} hover:border-amber-500/50 ${txtMuted} hover:text-amber-400 text-[9px] font-black rounded-xl uppercase transition-all cursor-pointer shadow-sm`}>
              🛑 Hazard Ahead
            </button>
          </div>

          <button onClick={handleAssembleHere} className={`w-full min-h-[44px] py-2 bg-emerald-950/40 border border-emerald-900/50 hover:border-emerald-500/50 text-emerald-400 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner`}>
            <Users className="w-4 h-4" /> ⛺ Assemble Fleet Here (Muster)
          </button>

          {isSettingMeetup ? (
            <div className="flex gap-2">
              <input type="text" value={meetupDesc} onChange={(e) => setMeetupDesc(e.target.value)} placeholder="Group Ride Tag..." className={`flex-1 min-h-[44px] ${bgInput} text-xs text-white rounded-xl px-3 outline-none focus:border-blue-500 font-bold`} />
              <button onClick={handleProposeMeetup} className="min-w-[50px] min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-md">HOST</button>
              <button onClick={() => setIsSettingMeetup(false)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${bgList} border ${brd} ${txtMain} rounded-xl cursor-pointer`}><X className="w-4 h-4"/></button>
            </div>
          ) : (
            <button onClick={() => setIsSettingMeetup(true)} disabled={!customPin} className={`w-full min-h-[44px] py-2 bg-blue-950/40 border border-blue-900/50 hover:border-blue-500/50 text-blue-400 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer shadow-inner`}>
              <Calendar className="w-4 h-4" /> Schedule Group Ride
            </button>
          )}

          {isSettingHazard ? (
            <div className="flex gap-2">
              <select value={hazardType} onChange={(e) => setHazardType(e.target.value)} className={`flex-1 min-h-[44px] ${bgInput} text-xs text-yellow-500 rounded-xl px-2 outline-none font-bold cursor-pointer`}>
                <option value="🕳️ Pothole / Washout">Pothole/Washout</option>
                <option value="🐕 Loose Animal">Loose Animal</option>
                <option value="🚧 Roadwork">Roadwork</option>
                <option value="🚔 Speed Trap">Speed Trap</option>
              </select>
              <button onClick={handleDropHazard} className="min-w-[50px] min-h-[44px] bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-md">SET</button>
              <button onClick={() => setIsSettingHazard(false)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${bgList} border ${brd} ${txtMain} rounded-xl cursor-pointer`}><X className="w-4 h-4"/></button>
            </div>
          ) : (
            <button onClick={() => setIsSettingHazard(true)} disabled={!customPin} className={`w-full min-h-[44px] py-2 ${bgList} border ${brd} hover:border-yellow-500/50 text-yellow-500 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer shadow-inner`}>
              <AlertTriangle className="w-4 h-4" /> Mark Hazard at Target Pin
            </button>
          )}

          {isSettingWaypoint ? (
            <div className="space-y-2 pt-1">
              <input type="text" value={waypointTitle} onChange={(e) => setWaypointTitle(e.target.value)} placeholder="Waypoint Name..." className={`w-full min-h-[44px] ${bgInput} text-xs text-white rounded-xl px-3 outline-none focus:border-cyan-500 font-bold`} />
              <div className="flex gap-2">
                <select value={waypointCategory} onChange={(e) => setWaypointCategory(e.target.value)} className={`flex-1 min-h-[44px] ${bgInput} text-xs text-cyan-400 rounded-xl px-2 outline-none font-bold cursor-pointer`}>
                  <option value="⚡ Charging Station">⚡ Charging Station</option>
                  <option value="🌲 Trailhead / Singletrack">🌲 Trailhead</option>
                  <option value="🔧 DIY Repair / Air Pump">🔧 Repair / Air Pump</option>
                  <option value="📸 Scenic Lookout">📸 Scenic Lookout</option>
                </select>
                <button onClick={handleDropWaypoint} className="min-w-[50px] min-h-[44px] bg-cyan-600 hover:bg-cyan-500 text-black text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-md">PIN</button>
                <button onClick={() => setIsSettingWaypoint(false)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${bgList} border ${brd} ${txtMain} rounded-xl cursor-pointer`}><X className="w-4 h-4"/></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsSettingWaypoint(true)} disabled={!customPin} className={`w-full min-h-[44px] py-2 bg-cyan-950/40 border border-cyan-900/50 hover:border-cyan-500/50 text-cyan-400 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 disabled:opacity-40 transition-all cursor-pointer shadow-inner`}>
              <Zap className="w-4 h-4" /> Drop Trail Waypoint
            </button>
          )}

          <button onClick={handleSendSOS} className={`w-full min-h-[44px] py-2 bg-red-950/30 border border-red-900 hover:bg-red-900/50 text-red-500 text-xs font-black rounded-xl uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-inner`}>
            <AlertOctagon className="w-4 h-4 animate-pulse" /> Broadcast S.O.S
          </button>
        </div>
      </div>
    </div>
  );
}