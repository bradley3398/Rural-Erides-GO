import React, { useState, useEffect } from "react";
import { Wrench, CircleDashed, Disc, Cog, Battery } from "lucide-react";

export default function PredictiveMaintenance({ totalMiles, safeRides, triggerHaptic, ui }: any) {
  const [tireOdoOffset, setTireOdoOffset] = useState<number>(0);
  const [brakeOdoOffset, setBrakeOdoOffset] = useState<number>(0);
  const [chainOdoOffset, setChainOdoOffset] = useState<number>(0);

  useEffect(() => {
    setTireOdoOffset(Number(localStorage.getItem("rt_tire_offset")) || 0);
    setBrakeOdoOffset(Number(localStorage.getItem("rt_brake_offset")) || 0);
    setChainOdoOffset(Number(localStorage.getItem("rt_chain_offset")) || 0);
  }, []);

  const updateOffset = (key: string, value: number, setter: any) => {
    triggerHaptic();
    setter(value);
    localStorage.setItem(key, value.toString());
  };

  const activeTirePressureMil = Math.max(0, Math.round(totalMiles - tireOdoOffset));
  const activeBrakePadMil = Math.max(0, Math.round(totalMiles - brakeOdoOffset));
  const activeChainOdoMil = Math.max(0, Math.round(totalMiles - chainOdoOffset));

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-5 rounded-3xl border shadow-xl transition-colors`}>
      <div className={`flex flex-col sm:flex-row sm:items-end justify-between mb-4 border-b ${ui.brd} pb-4`}>
        <div>
          <h3 className={`${ui.txtMain} font-black flex items-center gap-2 uppercase tracking-widest text-sm sm:text-base mb-1`}>
            <Wrench className={`w-5 h-5 ${ui.t.text}`} /> Predictive Maintenance
          </h3>
          <p className={`text-[10px] ${ui.txtMuted} font-mono uppercase tracking-widest`}>Lifecycle tracking based on total telemetry ({Math.round(totalMiles)} miles)</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Tire Tread */}
        <div className={`${ui.bgList} border ${ui.brd} p-4 rounded-xl shadow-inner`}>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <CircleDashed className="w-4 h-4 text-cyan-500" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${ui.txtMain}`}>Tire Tread Life</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${ui.txtMuted}`}>{activeTirePressureMil} / 1500 mi</span>
          </div>
          <div className={`w-full h-2 ${ui.bgBase} rounded-full overflow-hidden`}>
            <div className={`h-full ${activeTirePressureMil > 1300 ? 'bg-rose-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (activeTirePressureMil / 1500) * 100)}%` }}></div>
          </div>
          <div className="mt-2 text-right">
             <button onClick={() => updateOffset("rt_tire_offset", totalMiles, setTireOdoOffset)} className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${ui.brd} ${ui.txtMuted} hover:${ui.txtMain} transition-colors cursor-pointer`}>Log Tire Replacement</button>
          </div>
        </div>

        {/* Brake Pads */}
        <div className={`${ui.bgList} border ${ui.brd} p-4 rounded-xl shadow-inner`}>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Disc className="w-4 h-4 text-rose-500" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${ui.txtMain}`}>Brake Pad Wear</span>
            </div>
            <span className={`text-[10px] font-mono font-bold ${ui.txtMuted}`}>{activeBrakePadMil} / 500 mi</span>
          </div>
          <div className={`w-full h-2 ${ui.bgBase} rounded-full overflow-hidden`}>
            <div className={`h-full ${activeBrakePadMil > 450 ? 'bg-rose-500' : 'bg-rose-400'}`} style={{ width: `${Math.min(100, (activeBrakePadMil / 500) * 100)}%` }}></div>
          </div>
          <div className="mt-2 text-right">
             <button onClick={() => updateOffset("rt_brake_offset", totalMiles, setBrakeOdoOffset)} className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${ui.brd} ${ui.txtMuted} hover:${ui.txtMain} transition-colors cursor-pointer`}>Log Brake Replacement</button>
          </div>
        </div>

        {/* Battery Health Logbook */}
        <div className={`${ui.bgList} border ${ui.brd} p-4 rounded-xl shadow-inner`}>
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-500" />
              <span className={`text-[10px] font-black uppercase tracking-widest ${ui.txtMain}`}>Battery Health & Voltage Sag</span>
            </div>
            {(() => {
               const ridesWithSag = safeRides.filter((r: any) => r.minVoltage && r.minVoltage !== 999 && r.batteryVoltage);
               if (ridesWithSag.length === 0) return <span className={`text-[10px] font-mono font-bold ${ui.txtMuted}`}>No Data Yet</span>;
               
               const latestRide = ridesWithSag[0];
               const nominal = latestRide.batteryVoltage || 48;
               const peak = nominal * 1.166;
               const minV = nominal * 0.8125;
               const restingVolts = minV + ((peak - minV) * ((latestRide.startingBattery || 100) / 100));
               const maxSag = Math.max(0, restingVolts - latestRide.minVoltage).toFixed(1);
               
               let healthColor = "text-emerald-500"; let healthStatus = "Optimal";
               if (Number(maxSag) > (nominal * 0.15)) { healthColor = "text-amber-500"; healthStatus = "Degrading"; }
               if (Number(maxSag) > (nominal * 0.25)) { healthColor = "text-rose-500"; healthStatus = "Critical Sag"; }

               return (
                 <div className="text-right">
                   <span className={`text-[10px] font-mono font-black ${healthColor}`}>{healthStatus}</span>
                   <span className={`text-[10px] font-mono font-bold ${ui.txtMuted} block`}>Last Peak Sag: -{maxSag}V</span>
                 </div>
               );
            })()}
          </div>
          <div className="mt-2 text-left text-[8px] text-zinc-500 uppercase font-bold">
            Tracks extreme voltage dips under heavy electrical load to detect cell imbalance.
          </div>
        </div>
      </div>
    </div>
  );
}