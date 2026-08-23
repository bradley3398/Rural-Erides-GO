"use client";

import React from "react";
import { motion } from "framer-motion";
import { RadioReceiver, Sliders, Zap, Signal, Mic } from "lucide-react";

export default function WalkieTalkieWidget(props: any) {
  const {
    activeChannel, setActiveChannel, squelchLevel, setSquelchLevel, micBoost, setMicBoost,
    walkieFeed, getTimeAgo, isRecording, startRecording, stopRecording,
    t, bgPanel, brd, txtMain, txtMuted, bgInput, bgList, bgCard
  } = props;

  return (
    <div className={`${bgPanel} border ${brd} rounded-2xl p-4 flex flex-col shadow-2xl relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-full h-1 ${t.bg}`}></div>
      
      <div className={`flex items-center justify-between mb-3 border-b ${brd} pb-2.5`}>
        <div className="flex items-center gap-2">
          <RadioReceiver className={`w-4 h-4 ${t.text} animate-pulse`} />
          <h3 className={`${txtMain} font-black text-xs tracking-wider uppercase`}>TAC-RADIO WALKIE-TALKIE</h3>
        </div>
        <span className={`text-[9px] ${txtMuted} font-mono font-bold`}>{activeChannel}</span>
      </div>

      <div className="space-y-2.5 mb-3">
        <select 
          value={activeChannel} 
          onChange={(e) => setActiveChannel(e.target.value)}
          className={`w-full ${bgInput} text-[11px] font-mono font-black rounded-xl px-2.5 py-2 outline-none cursor-pointer shadow-inner`}
        >
          <option value="CH-1: GENERAL FLEET">📡 CH-1: GENERAL FLEET</option>
          <option value="CH-2: TRAIL CREW">🌲 CH-2: TRAIL CREW</option>
          <option value="CH-3: EMERGENCY TAC">🚨 CH-3: EMERGENCY TAC</option>
          <option value="CH-4: NIGHT RECON">🌙 CH-4: NIGHT RECON</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setSquelchLevel((prev: number) => (prev >= 5 ? 1 : prev + 1))}
            className={`py-1.5 ${bgList} border ${brd} ${txtMuted} hover:${txtMain} rounded-lg text-[9px] font-mono font-bold uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-inner`}
          >
            <Sliders className="w-3 h-3 text-cyan-400"/> Squelch: {squelchLevel}
          </button>
          <button 
            onClick={() => setMicBoost(!micBoost)}
            className={`py-1.5 border rounded-lg text-[9px] font-mono font-black uppercase flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-inner ${micBoost ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' : `${bgList} ${brd} ${txtMuted}`}`}
          >
            <Zap className="w-3 h-3"/> Boost: {micBoost ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className={`${bgCard} border ${brd} rounded-xl p-3 h-[160px] overflow-y-auto space-y-2 mb-3 custom-scrollbar shadow-inner`}>
        <div className={`flex justify-between items-center text-[9px] ${txtMuted} font-mono mb-1`}>
          <span>Audio Feed ({walkieFeed.length}) - 1m Auto-Expire</span>
          <span className="text-emerald-400 flex items-center gap-1"><Signal className="w-2.5 h-2.5 animate-pulse"/> LIVE</span>
        </div>
        {walkieFeed.length === 0 ? (
          <div className="h-24 flex flex-col items-center justify-center text-center p-2">
            <span className={`text-zinc-600 text-[9px] font-bold uppercase tracking-widest`}>No Active Voice Logs (Auto-purges in 1m)</span>
          </div>
        ) : (
          walkieFeed.map((item: any) => (
            <div key={item.id} className={`p-2 rounded-lg ${bgList} border ${brd} flex flex-col gap-1.5 shadow-inner`}>
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className={`font-bold ${txtMain}`}>{item.sender}</span>
                <span className={txtMuted}>{getTimeAgo(item.timestamp)}</span>
              </div>
              <audio controls src={item.audioData} className="w-full h-7 outline-none rounded" controlsList="nodownload noplaybackrate" />
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col items-center">
        <motion.button 
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          animate={isRecording ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={isRecording ? { repeat: Infinity, duration: 0.6 } : {}}
          className={`w-full min-h-[46px] rounded-xl border-2 flex items-center justify-center gap-2 font-black uppercase font-mono tracking-widest transition-all shadow-lg cursor-pointer select-none ${
            isRecording 
              ? 'bg-rose-600 border-white text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse' 
              : `bg-black/60 ${t.border} ${t.text} hover:${t.bg} hover:text-black`
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>{isRecording ? 'TRANSMITTING...' : 'HOLD TO TALK (PTT)'}</span>
        </motion.button>
      </div>

    </div>
  );
}