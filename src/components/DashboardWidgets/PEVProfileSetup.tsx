import React from "react";
import { Truck, Save, Play } from "lucide-react";

export default function PEVProfileSetup(props: any) {
  const {
    isTracking, handleSaveCurrentPevProfile, savedPevProfiles, handleLoadPevProfile,
    customVehicleName, setCustomVehicleName, pevType, setPevType, wheelSize, setWheelSize,
    batteryPercent, setBatteryPercent, batteryCapacity, setBatteryCapacity,
    peakVoltage, setPeakVoltage, motorWattage, setMotorWattage, controllerAmps,
    setControllerAmps, batteryVoltage, setBatteryVoltage, startTracking, triggerHaptic, ui, tx
  } = props;

  if (isTracking) return null;

  return (
    <div className={`p-5 sm:p-6 rounded-3xl border ${ui?.bgPanel} shadow-2xl space-y-5`}>
      <div className={`flex justify-between items-center flex-wrap gap-2 border-b ${ui?.brd} pb-3`}>
        <h3 className={`${ui?.t?.text} font-black uppercase tracking-widest text-xs flex items-center gap-2`}>
          <Truck className="w-4 h-4"/> Active PEV Profile Configuration
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleSaveCurrentPevProfile}
            className={`min-h-[36px] px-3 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer`}
          >
            <Save className="w-3.5 h-3.5"/> Save Profile
          </button>
        </div>
      </div>

      {savedPevProfiles?.length > 0 && (
        <div className="space-y-1.5">
          <span className={`text-[8px] font-black uppercase tracking-widest ${ui?.txtMuted}`}>Select Saved Fleet PEV for Session</span>
          <select 
            onChange={(e) => {
              const found = savedPevProfiles.find((p: any) => p.id === e.target.value);
              if (found) handleLoadPevProfile(found);
            }}
            className={`${ui?.bgInput} w-full p-3 rounded-xl font-mono font-bold border ${ui?.brd} cursor-pointer`}
          >
            <option value="">-- Choose from Saved Fleet Profiles --</option>
            {savedPevProfiles.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.watts}W • {p.volts}V • {p.ah}Ah)</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <span className={`text-[8px] font-black uppercase tracking-widest ${ui?.txtMuted}`}>Universal Presets</span>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {[
            { name: "Standard E-Scooter", type: "Scooter", wheels: 10, ah: 15, volts: 48, peak: 54.6, watts: 1000, amps: 25 },
            { name: "Commuter E-Bike", type: "Bike", wheels: 26, ah: 15, volts: 48, peak: 54.6, watts: 750, amps: 22 },
            { name: "Utility E-Trike", type: "Scooter", wheels: 16, ah: 20, volts: 48, peak: 54.6, watts: 1000, amps: 25 },
            { name: "Performance EUC", type: "Unicycle", wheels: 18, ah: 22, volts: 84, peak: 100.8, watts: 2500, amps: 40 }
          ].map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleLoadPevProfile(preset)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl border ${ui?.bgList} ${ui?.txtMuted} hover:${ui?.txtMain} text-[9px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer`}
            >
              ⚡ {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          <div className="col-span-2">
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1.5`}>Vehicle Name / Signature</label>
            <input type="text" value={customVehicleName || ""} onChange={e => setCustomVehicleName(e.target.value)} placeholder="e.g. Universal PEV" className={`${ui?.bgInput} w-full p-3 rounded-xl font-mono font-bold border ${ui?.brd} focus:border-cyan-500 transition-colors shadow-inner`} />
          </div>
          <div className="col-span-2 sm:col-span-2">
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1.5`}>PEV Class Topology</label>
            <select value={pevType || "Scooter"} onChange={e => setPevType && setPevType(e.target.value)} className={`${ui?.bgInput} w-full p-3 rounded-xl font-mono font-bold border ${ui?.brd} cursor-pointer`}>
               <option value="Scooter">E-Scooter</option>
               <option value="Bike">E-Bike</option>
               <option value="Unicycle">EUC</option>
               <option value="Skateboard">E-Skate</option>
            </select>
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Tire Diameter</label>
            <input type="number" step="0.5" value={wheelSize || 10} onChange={e => setWheelSize(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Start Battery %</label>
            <input type="number" min="1" max="100" value={batteryPercent || 100} onChange={e => setBatteryPercent(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Pack Ah Capacity</label>
            <input type="number" value={batteryCapacity || 15} onChange={e => setBatteryCapacity(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Peak Voltage</label>
            <input type="number" step="0.1" value={peakVoltage || 54.6} onChange={e => setPeakVoltage(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Motor Output</label>
            <input type="number" step="50" value={motorWattage || 1000} onChange={e => setMotorWattage(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>ESC Limit</label>
            <input type="number" value={controllerAmps || 25} onChange={e => setControllerAmps(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
          <div className={`${ui?.bgList} p-3 rounded-xl border ${ui?.brd} flex flex-col justify-between`}>
            <label className={`text-[8px] ${ui?.txtMuted} font-black uppercase tracking-widest block mb-1`}>Nominal Volts</label>
            <input type="number" step="1" value={batteryVoltage || 48} onChange={e => setBatteryVoltage(Number(e.target.value))} className={`bg-transparent w-full text-sm font-mono font-black ${ui?.txtMain} outline-none tabular-nums`} />
          </div>
      </div>

      <div className="pt-2 flex justify-center mt-2">
        <button
          onClick={() => { triggerHaptic && triggerHaptic(); startTracking && startTracking(); }}
          className={`w-full min-h-[54px] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${ui?.t?.bg} text-black hover:opacity-90 ${ui?.t?.shadow} scale-[1.01] cursor-pointer`}
        >
          <Play className="w-4 h-4 fill-current"/> {tx ? tx('start_run') : "START RUN"}
        </button>
      </div>
    </div>
  );
}