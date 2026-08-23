import React from "react";
import { Award, Filter, Map as MapIcon, Timer, Download, ChevronUp, ChevronDown, Trash2, Gauge, Zap, Battery, ZapOff, TrendingUp, Scale, Orbit, ShieldAlert, Mountain, Activity, DollarSign, CloudRain, Disc, BrainCircuit, BookOpen, Save, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const safeNum = (val: any, fallback = 0) => {
  const parsed = Number(val);
  return (isNaN(parsed) || !isFinite(parsed)) ? fallback : parsed;
};

const safePct = (val: any) => {
  const num = safeNum(val);
  return Math.max(0, Math.min(100, num));
};

export default function MissionLogs(props: any) {
  const { 
    safeRides, logFilter, setLogFilter, expandedRideId, setExpandedRideId, 
    lifetimeSeconds, totalFinancialSavings, lifetimeTopSpeed, speedLabel, distLabel, 
    useMetric, exportRideGPX, setSavedRides, handleBroadcastRideToBoard, 
    triggerHistoricalAiDebrief, isFetchingHistoricalAi, historicalAiAnalysis, 
    updateRideNote, tirePsi, callsign, ui, tx 
  } = props;

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-5 rounded-3xl border shadow-xl transition-colors`}>
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-4 border-b ${ui.brd} pb-4`}>
        <div>
          <h3 className={`${ui.txtMain} font-black flex items-center gap-2 uppercase tracking-widest text-sm sm:text-base mb-1`}>
            <Award className={`w-5 h-5 ${ui.t.text}`} /> {tx('logs')}
          </h3>
          <p className={`text-[10px] ${ui.txtMuted} font-mono uppercase tracking-widest`}>Historical Telemetry Archives & Energy Efficiency Matrix</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
          <div className="text-left sm:text-right">
            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest`}>Total Run Timeline</div>
            <div className={`${ui.t.text} font-mono font-bold text-xs tabular-nums`}>{Math.floor(lifetimeSeconds / 3600)}h {Math.floor((lifetimeSeconds % 3600) / 60)}m</div>
          </div>
          <div className={`text-left sm:text-right border-l ${ui.brd} pl-4`}>
            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest`}>Total Gas & Wear Saved</div>
            <div className={`text-emerald-500 font-mono font-bold text-xs tabular-nums`}>${totalFinancialSavings.toFixed(2)}</div>
          </div>
          <div className={`text-left sm:text-right border-l ${ui.brd} pl-4`}>
            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest`}>Lifetime Max Speed</div>
            <div className={`${ui.t.text} font-mono font-bold text-xs tabular-nums`}>{useMetric ? (lifetimeTopSpeed * 1.609).toFixed(1) : lifetimeTopSpeed.toFixed(1)} {speedLabel}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto custom-scrollbar pb-1">
          <Filter className={`w-4 h-4 ${ui.txtMuted} shrink-0 mt-3`} />
          <button onClick={() => setLogFilter("ALL")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${logFilter === 'ALL' ? `${ui.t.bg} text-black` : `${ui.bgCard} ${ui.brd} border ${ui.txtMuted}`}`}>All Matrix runs</button>
          <button onClick={() => setLogFilter("SPEED")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${logFilter === 'SPEED' ? `${ui.t.bg} text-black` : `${ui.bgCard} ${ui.brd} border ${ui.txtMuted}`}`}>Speed Runs</button>
          <button onClick={() => setLogFilter("LONG")} className={`min-h-[44px] px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer ${logFilter === 'LONG' ? `${ui.t.bg} text-black` : `${ui.bgCard} ${ui.brd} border ${ui.txtMuted}`}`}>Long Radius</button>
      </div>

      {safeRides.length === 0 ? (
        <div className={`text-center py-10 ${ui.bgCard} border border-dashed ${ui.brd} rounded-2xl`}>
           <MapIcon className={`w-8 h-8 ${ui.txtMuted} mx-auto mb-3`} />
           <div className={`${ui.txtMuted} font-mono text-xs uppercase font-bold tracking-widest`}>No active run profiles compiled in storage.</div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
          {safeRides.filter((ride: any) => {
            if (logFilter === "ALL") return true;
            if (logFilter === "SPEED" && safeNum(ride?.maxSpeed) >= 20) return true;
            if (logFilter === "LONG" && safeNum(ride?.distance) >= 5) return true;
            return true;
          }).map((ride: any, index: number) => (
            <div key={ride.id || index} className={`${ui.bgBase} rounded-2xl border ${ui.brd} flex flex-col gap-4 shadow-inner overflow-hidden group hover:border-zinc-500 transition-colors`}>
               <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center border-b border-transparent gap-4 cursor-pointer" onClick={() => setExpandedRideId(expandedRideId === ride.id ? null : ride.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-xl border-2 ${
                        ride.rideScore === 'S+' ? 'bg-purple-950/40 border-purple-500 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]' :
                        ride.rideScore === 'S' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                        ride.rideScore === 'A' ? 'bg-[#39ff14]/10 border-[#39ff14]/50 text-[#39ff14]' :
                        'bg-amber-950/40 border-amber-500/50 text-amber-500'
                    }`}>
                       {ride.rideScore || 'A'}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`${ui.txtMain} font-black text-lg sm:text-xl`}>{useMetric ? (safeNum(ride.distance) * 1.609).toFixed(2) : safeNum(ride.distance).toFixed(2)} <span className={`text-[10px] ${ui.txtMuted} ml-0.5`}>{distLabel}</span></span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded ${ui.t.dim}`}>{ride.powerMode || "N/A"}</span>
                      </div>
                      <div className={`${ui.txtMuted} font-bold text-[10px] uppercase tracking-wide flex flex-wrap gap-2 items-center`}>
                        <span className={ui.t.text}>{callsign || "Pilot"}</span>
                        <span>•</span>
                        <span className={ui.txtMain}>{ride.vehicleModel || "Unknown PEV"}</span>
                        <span>•</span>
                        <span>{ride.date} ({ride.startTime || "00:00"} - {ride.endTime || "00:00"})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3"/> {Math.floor(safeNum(ride.duration)/60)}m {Math.floor(safeNum(ride.duration)%60)}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-between sm:justify-start gap-3 sm:border-l ${ui.brd} sm:pl-6 pt-2 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0`}>
                     <div className="text-left sm:text-right mr-2">
                       <div className={`text-[8px] sm:text-[9px] ${ui.txtMuted} font-black uppercase tracking-widest`}>Top Speed</div>
                       <div className={`${ui.txtMain} font-mono font-bold text-sm`}>{useMetric ? (safeNum(ride.maxSpeed) * 1.609).toFixed(1) : safeNum(ride.maxSpeed).toFixed(1)} {speedLabel}</div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); exportRideGPX(ride); }} className={`p-2.5 ${ui.bgList} ${ui.txtMuted} hover:text-cyan-400 border ${ui.brd} rounded-xl transition-colors cursor-pointer`} title="Export GPX Track">
                        <Download className="w-3.5 h-3.5"/>
                     </button>
                     {expandedRideId === ride.id ? <ChevronUp className={ui.txtMuted}/> : <ChevronDown className={ui.txtMuted}/>}
                     <button onClick={(e) => { 
                       e.stopPropagation(); 
                       const newRides = safeRides.filter((r: any) => r.id !== ride.id);
                       setSavedRides(newRides); 
                       localStorage.setItem("universal_erides_rides", JSON.stringify(newRides)); 
                     }} className={`min-h-[44px] min-w-[44px] flex items-center justify-center ${ui.bgList} ${ui.txtMuted} border ${ui.brd} rounded-xl hover:bg-rose-950 hover:text-rose-500 hover:border-rose-900/50 transition-colors cursor-pointer`}>
                       <Trash2 className="w-4 h-4"/>
                     </button>
                  </div>
               </div>

               <AnimatePresence>
                 {expandedRideId === ride.id && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <div className={`border-t ${ui.brd} ${ui.bgCard} p-4 sm:p-5 space-y-4`}>
                       {Array.isArray(ride.tags) && ride.tags.length > 0 && (
                         <div className="flex flex-wrap gap-2">
                           {ride.tags.map((tag: string, i: number) => (
                             <span key={`${ride.id}-tag-${i}`} className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded ${ui.bgBase} border ${ui.t.border} ${ui.t.text}`}>#{tag}</span>
                           ))}
                         </div>
                       )}

                       <div className={`${ui.bgList} border ${ui.brd} p-3 rounded-xl flex flex-wrap justify-between gap-2 font-mono text-[9.5px]`}>
                          <div><span className={ui.txtMuted}>BATTERY PACK:</span> <strong className="text-white">{ride.batteryVoltage || 48}V ({ride.batteryTopology || '14S'})</strong></div>
                          <div><span className={ui.txtMuted}>CAPACITY:</span> <strong className="text-white">{ride.batteryCapacity || 15} Ah</strong></div>
                          <div><span className={ui.txtMuted}>MOTOR:</span> <strong className="text-white">{ride.motorWattage || 1000} W</strong></div>
                          <div><span className={ui.txtMuted}>CONTROLLER:</span> <strong className="text-white">{ride.controllerAmps || 25} A</strong></div>
                          <div><span className={ui.txtMuted}>WHEEL:</span> <strong className="text-white">{ride.wheelSize || 10}"</strong></div>
                       </div>

                       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Gauge className="w-3 h-3 text-cyan-500"/> {tx('avg_speed')}</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{useMetric ? (safeNum(ride.avgSpeed) * 1.609).toFixed(1) : safeNum(ride.avgSpeed).toFixed(1)} {speedLabel}</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Zap className="w-3 h-3 text-amber-500"/> Peak Watts</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.peakWatts).toFixed(0)} W</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Battery className="w-3 h-3 text-cyan-500"/> Ah Used</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.totalAhConsumed).toFixed(2)} Ah</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><ZapOff className="w-3 h-3 text-rose-400"/> Min Voltage</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.minVoltage).toFixed(1)} V</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><TrendingUp className="w-3 h-3 text-emerald-500"/> Max Grade</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.maxGrade).toFixed(1)}%</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Scale className="w-3 h-3 text-purple-400"/> Max G-Force</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.maxGForce).toFixed(2)}G</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Orbit className="w-3 h-3 text-cyan-400"/> Cornering Gs</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.maxLateralG).toFixed(2)}G</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><ShieldAlert className="w-3 h-3 text-rose-500"/> Hard Brakes</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.hardBrakes).toFixed(0)}</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Mountain className="w-3 h-3 text-amber-500"/> Rough Bumps</div>
                            <div className={`text-xs font-mono font-black ${ui.txtMain}`}>{safeNum(ride.suspensionBumps).toFixed(0)}</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center relative overflow-hidden`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Activity className={`w-3 h-3 ${ui.t.text}`}/> Efficiency</div>
                            <div className={`text-xs font-mono font-black ${ui.t.text}`}>{safeNum(ride.efficiencyWhPerMile).toFixed(1)} <span className={`text-[8px] ${ui.txtMuted}`}>Wh/{useMetric?'km':'mi'}</span></div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><DollarSign className="w-3 h-3 text-emerald-500"/> Gas Saved</div>
                            <div className="text-xs font-mono font-black text-emerald-500">${safeNum(ride.financialSavings).toFixed(2)}</div>
                          </div>

                          <div className={`${ui.bgList} p-3 rounded-xl border ${ui.brd} text-center shadow-inner flex flex-col justify-center`}>
                            <div className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1`}><Zap className="w-3 h-3 text-yellow-400"/> Charge Cost</div>
                            <div className={`text-xs font-mono font-black text-yellow-400`}>${((safeNum(ride.totalWhConsumed) / 1000) * 0.15).toFixed(2)}</div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                            <CloudRain className="w-5 h-5 text-cyan-500 shrink-0" />
                            <div>
                              <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Weather Snapshot</div>
                              <div className={`text-xs font-bold ${ui.txtMain}`}>{ride.weatherCondition || "Offline"}</div>
                            </div>
                         </div>

                         <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                            <Disc className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                              <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Tire Pressure & Towing</div>
                              <div className={`text-xs font-bold ${ui.txtMain}`}>{ride.tirePsiLogged || tirePsi} PSI • {ride.towingTrailer ? "Trailer Attached" : "Solo Vehicle"}</div>
                            </div>
                         </div>

                         <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                            <Battery className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="w-full">
                              <div className={`flex justify-between text-[8px] font-black uppercase tracking-widest ${ui.txtMuted} w-full mb-1`}>
                                <span>Start: {safePct(ride.startingBattery)}%</span>
                                <span>End: {safePct(ride.endingBattery)}%</span>
                              </div>
                              <div className={`w-full h-1.5 ${ui.bgBase} rounded-full flex justify-between overflow-hidden`}>
                                 <div className="h-full bg-emerald-500" style={{width: `${safePct(ride.endingBattery)}%`}}></div>
                                 <div className="h-full bg-rose-500/50" style={{width: `${safePct(safeNum(ride.startingBattery, 100) - safeNum(ride.endingBattery, 0))}%`}}></div>
                              </div>
                            </div>
                         </div>
                       </div>

                       <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-4 shadow-inner space-y-3`}>
                         <div className={`flex items-center justify-between`}>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${ui.txtMuted} flex items-center gap-1.5`}><BrainCircuit className="w-3.5 h-3.5 text-cyan-400"/> Post-Flight AI Debrief</span>
                            <button 
                               onClick={() => triggerHistoricalAiDebrief(ride)} 
                               disabled={isFetchingHistoricalAi === ride.id}
                               className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${isFetchingHistoricalAi === ride.id ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : `${ui.t.bg} text-black cursor-pointer hover:opacity-80 shadow-md`}`}
                            >
                               {isFetchingHistoricalAi === ride.id ? 'Analyzing Log...' : 'Generate AI Debrief'}
                            </button>
                         </div>
                         {historicalAiAnalysis[ride.id] && (
                           <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-lg bg-black/40 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300 leading-relaxed shadow-inner`}>
                             <span className="text-cyan-400 font-black">AI CO-PILOT: </span> {historicalAiAnalysis[ride.id]}
                           </motion.div>
                         )}
                       </div>

                       <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-4 shadow-inner space-y-3`}>
                          <div className={`text-[9px] font-black uppercase tracking-widest ${ui.txtMuted} mb-2 flex items-center justify-between`}>
                            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5"/> Pilot Journal & Maintenance Notes</span>
                            <Save className={`w-3.5 h-3.5 ${ui.t.text} opacity-50`} />
                          </div>
                          <textarea 
                            value={ride.rideNote || ""} 
                            onChange={(e) => updateRideNote(ride.id, e.target.value)}
                            placeholder="Log terrain conditions, maintenance issues, or modifications felt during this run..."
                            className={`w-full ${ui.bgBase} border ${ui.brd} rounded-lg p-3 text-xs font-bold ${ui.txtMain} outline-none focus:${ui.t.border} transition-colors custom-scrollbar resize-none h-20`}
                          />
                          <button 
                            onClick={() => handleBroadcastRideToBoard(ride)}
                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${ui.t.bg} text-black`}
                          >
                            <Send className="w-4 h-4"/> Broadcast Mission Run to Community Board
                          </button>
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}