import React from "react";
import { ShieldAlert, Activity, LifeBuoy, Zap, Cpu, Flame, Wrench, Navigation, Droplets, Wind, BatteryCharging, Gauge, ShoppingBag } from "lucide-react";

export default function EngineeringToolsTab({
  selectedErrorCode, setSelectedErrorCode, getErrorCodeDetails,
  factoryPeakVolts, setFactoryPeakVolts, measuredLoadVolts, setMeasuredLoadVolts,
  testLoadAmps, setTestLoadAmps, calculateBatteryHealth, selectedSymptom,
  setSelectedSymptom, getSymptomTriageGuide, kwhRate, setKwhRate,
  chargerAmps, setChargerAmps, calcVoltage, calcAh, hillGradePercent,
  setHillGradePercent, targetClimbSpeed, setTargetClimbSpeed, riderWeight,
  setRiderWeight, vehicleWeight, setVehicleWeight, ambientTempF, setAmbientTempF,
  brakeFluidType, setBrakeFluidType, getBrakeFluidInfo, calcWhPerMile,
  setCalcWhPerMile, oldTireSize, setOldTireSize, newTireSize, setNewTireSize,
  currentSpeed, setCurrentSpeed, stockAmps, setStockAmps, shuntSolderPercent,
  setShuntSolderPercent, selectedBoltSize, setSelectedBoltSize, getDynamicTorqueSpec,
  customWireAmps, setCustomWireAmps, getRecommendedAWG, budgetItems, setBudgetItems,
  newItemName, setNewItemName, newItemCost, setNewItemCost, themeColors
}: any) {
  const t = themeColors;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TOOL 1: E-CODE VAULT */}
        <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
          <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
            <ShieldAlert className="w-4 h-4 text-rose-500" /> 1. Universal Display Error Code (E-Code) Diagnostic Vault
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <select value={selectedErrorCode} onChange={(e) => setSelectedErrorCode(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white font-bold outline-none cursor-pointer min-h-[48px]">
              {["E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08", "E09", "E10"].map(code => (
                <option key={code} value={code}>{code} - {getErrorCodeDetails(code).fault}</option>
              ))}
            </select>
            <div className="md:col-span-2 bg-zinc-950 border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between"><span className="text-zinc-400">Fault:</span><span className="text-rose-400 font-bold">{getErrorCodeDetails(selectedErrorCode).fault}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Component:</span><span className="text-cyan-400 font-bold">{getErrorCodeDetails(selectedErrorCode).component}</span></div>
              <p className="text-xs text-zinc-200 font-bold pt-1">{getErrorCodeDetails(selectedErrorCode).fix}</p>
            </div>
          </div>
        </div>

        {/* TOOL 2: BATTERY HEALTH METER */}
        <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl col-span-1 md:col-span-2 backdrop-blur-md">
          <h4 className={`text-xs font-black uppercase tracking-widest ${t.text} flex items-center gap-2 font-mono`}>
            <Activity className="w-4 h-4 text-cyan-400" /> 2. Battery Health &amp; Internal Resistance (IR) Meter
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="space-y-3">
              <label className="text-[9px] text-zinc-400 uppercase font-black block">Factory Peak Volts: {factoryPeakVolts}V</label>
              <input type="range" min="36" max="84" step="0.2" value={factoryPeakVolts} onChange={(e) => setFactoryPeakVolts(Number(e.target.value))} className="w-full accent-current cursor-pointer" />
              <label className="text-[9px] text-zinc-400 uppercase font-black block">Loaded Volts: {measuredLoadVolts}V</label>
              <input type="range" min="30" max="80" step="0.2" value={measuredLoadVolts} onChange={(e) => setMeasuredLoadVolts(Number(e.target.value))} className="w-full accent-current cursor-pointer" />
            </div>
            <div className="md:col-span-2 bg-zinc-950 border border-white/10 p-4 rounded-2xl flex flex-col justify-center space-y-2">
              {(() => {
                const metrics = calculateBatteryHealth();
                return (
                  <>
                    <div className="flex justify-between"><span className="text-zinc-400">Health:</span><span className="text-emerald-400 font-bold">{metrics.health}%</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Internal Resistance:</span><span className="text-cyan-400 font-bold">{metrics.ir} mΩ</span></div>
                    <p className="text-xs text-zinc-300 font-bold pt-1">{metrics.status}</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}