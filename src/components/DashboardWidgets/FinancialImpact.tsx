import React, { useState, useEffect } from "react";
import { DollarSign, Fuel, Car, Wrench, Leaf, Droplets, Zap } from "lucide-react";

export default function FinancialImpact({ totalMiles, ui }: { totalMiles: number, ui: any }) {
  const [localGasPrice, setLocalGasPrice] = useState<number>(3.50);
  const [referenceMpg, setReferenceMpg] = useState<number>(25);
  
  const CO2_SAVED_PER_MILE_LBS = 0.89;
  const IRS_MILEAGE_RATE = 0.76;

  useEffect(() => {
    setLocalGasPrice(Number(localStorage.getItem("pev_local_gas_price")) || 3.50);
    setReferenceMpg(Number(localStorage.getItem("pev_reference_mpg")) || 25);
  }, []);

  useEffect(() => {
    localStorage.setItem("pev_local_gas_price", localGasPrice.toString());
    localStorage.setItem("pev_reference_mpg", referenceMpg.toString());
  }, [localGasPrice, referenceMpg]);

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-5 rounded-3xl border shadow-xl transition-colors space-y-5 ${ui.brd}`}>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${ui.brd} pb-4 gap-3 w-full`}>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-500/50 p-2.5 rounded-xl text-emerald-400 shadow-md">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`${ui.txtMain} font-black uppercase tracking-widest text-sm`}>Financial Savings & Environmental Impact</h3>
            <p className={`text-[9px] ${ui.txtMuted} font-mono uppercase mt-0.5`}>IRS Standard Rate ($0.76/mi) • Gas & Wear Avoidance Matrix</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${ui.bgCard} p-3.5 rounded-2xl border ${ui.brd} space-y-1.5`}>
          <label className={`text-[9px] font-black uppercase tracking-widest ${ui.txtMuted} flex items-center gap-1.5`}>
            <Fuel className="w-3.5 h-3.5 text-amber-400" /> Local Fuel Price ($/Gal)
          </label>
          <input 
            type="number" step="0.05" min="1" max="10" 
            value={localGasPrice} 
            onChange={e => setLocalGasPrice(Number(e.target.value))} 
            className={`w-full min-h-[44px] ${ui.bgInput} rounded-xl px-3 text-xs font-mono font-bold outline-none border ${ui.brd} focus:border-emerald-500`}
          />
        </div>

        <div className={`${ui.bgCard} p-3.5 rounded-2xl border ${ui.brd} space-y-1.5`}>
          <label className={`text-[9px] font-black uppercase tracking-widest ${ui.txtMuted} flex items-center gap-1.5`}>
            <Car className="w-3.5 h-3.5 text-cyan-400" /> Comparison Car MPG
          </label>
          <input 
            type="number" step="1" min="5" max="100" 
            value={referenceMpg} 
            onChange={e => setReferenceMpg(Number(e.target.value))} 
            className={`w-full min-h-[44px] ${ui.bgInput} rounded-xl px-3 text-xs font-mono font-bold outline-none border ${ui.brd} focus:border-emerald-500`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>Total Savings</span>
          <span className="text-sm font-black font-mono text-emerald-400 tabular-nums">${(totalMiles * IRS_MILEAGE_RATE).toFixed(2)}</span>
        </div>
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <Fuel className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>Gas Saved</span>
          <span className="text-sm font-black font-mono text-amber-400 tabular-nums">${((totalMiles / Math.max(1, referenceMpg)) * localGasPrice).toFixed(2)}</span>
        </div>
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <Wrench className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>Wear Avoided</span>
          <span className="text-sm font-black font-mono text-rose-400 tabular-nums">${Math.max(0, totalMiles * (IRS_MILEAGE_RATE - (localGasPrice / Math.max(1, referenceMpg)))).toFixed(2)}</span>
        </div>
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <Leaf className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>CO2 Reduced</span>
          <span className="text-sm font-black font-mono text-emerald-500 tabular-nums">{(totalMiles * CO2_SAVED_PER_MILE_LBS).toFixed(1)} lbs</span>
        </div>
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <Droplets className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>Fuel Unburned</span>
          <span className="text-sm font-black font-mono text-cyan-400 tabular-nums">{(totalMiles / Math.max(1, referenceMpg)).toFixed(1)} Gal</span>
        </div>
        <div className={`${ui.bgList} p-3.5 rounded-2xl border ${ui.brd} text-center flex flex-col justify-between shadow-inner`}>
          <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <span className={`text-[8px] ${ui.txtMuted} font-black uppercase tracking-widest block mb-0.5`}>Cost / E-Mile</span>
          <span className="text-sm font-black font-mono text-yellow-400 tabular-nums">~$0.02 / mi</span>
        </div>
      </div>
    </div>
  );
}