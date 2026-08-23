import React from "react";
import { 
  Globe, CircleGauge, ShieldAlert as ShieldAlertIcon, Palette, Sun, EyeOff, 
  SunMoon, Smartphone, Unlock, RotateCw, Crosshair, Scale, Magnet, Activity, 
  Disc, Network, Wifi, BellRing, VolumeX, EyeIcon, Radar, Battery, MapPin 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsMatrix(props: any) {
  const {
    showSettings, configTab, setConfigTab, triggerHaptic, hudStyle, setHudStyle,
    speedSignStyle, setSpeedSignStyle, hudFontColor, setHudFontColor, theme,
    handleThemeChange, isDayMode, toggleSunVisibility, isNightVision, setIsNightVision,
    setIsDayMode, autoNightMode, setAutoNightMode, sensorsUnlocked, requestSensorPermissions,
    getCalibratedLean, pitchAngle, gyroOffset, hardwareGForce, ambientLux, magBaseline,
    calibrateEMF, magAmplifier, setMagAmplifier, magFluxDelta, calibrateIMU,
    brakeSensitivity, setBrakeSensitivity, tireFriction, setTireFriction, networkType,
    networkPing, useMetric, setUseMetric, audioWarnings, setAudioWarnings,
    audioThrottleInterval, setAudioThrottleInterval, visualGForceAlerts, setVisualGForceAlerts,
    gpsSmoothing, setGpsSmoothing, telemetryRate, setTelemetryRate, speedLimitPolling,
    setSpeedLimitPolling, autoWakeSpeed, setAutoWakeSpeed, speedLabel, batteryChemistry,
    setBatteryChemistry, fallbackInput, setFallbackInput, manuallySetFallback, ui, tx
  } = props;

  return (
    <AnimatePresence>
      {showSettings && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-4 sm:p-5 rounded-3xl border shadow-2xl space-y-5 ${ui.bgPanel}`}>
          <div className={`flex items-center justify-between border-b ${ui.brd} pb-3`}>
            <h3 className={`${ui.t.text} font-black uppercase tracking-widest text-xs flex items-center gap-2`}><Globe className="w-4 h-4"/> {tx('config')} MASTER OVERRIDE</h3>
          </div>
          
          <div className={`flex flex-wrap border-b ${ui.brd} ${ui.bgList} rounded-xl shadow-inner mb-4`}>
              <button type="button" onClick={() => { triggerHaptic(); setConfigTab("display"); }} className={`flex-1 min-w-[33%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${configTab === "display" ? `${ui.t.text} bg-zinc-900/50` : `${ui.txtMuted} hover:${ui.txtMain}`}`}>Display</button>
              <button type="button" onClick={() => { triggerHaptic(); setConfigTab("sensors"); }} className={`flex-1 min-w-[33%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${configTab === "sensors" ? `${ui.t.text} bg-zinc-900/50` : `${ui.txtMuted} hover:${ui.txtMain}`}`}>Sensors</button>
              <button type="button" onClick={() => { triggerHaptic(); setConfigTab("preferences"); }} className={`flex-1 min-w-[33%] py-3 px-2 text-[9px] font-black uppercase tracking-widest transition-colors text-center cursor-pointer ${configTab === "preferences" ? `${ui.t.text} bg-zinc-900/50` : `${ui.txtMuted} hover:${ui.txtMain}`}`}>Prefs</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configTab === "display" && (
              <>
                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} col-span-1 md:col-span-2 lg:col-span-3 space-y-4`}>
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex flex-col space-y-0.5">
                      <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><CircleGauge className="w-3.5 h-3.5"/> Speed HUD Style</span>
                      <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Choose your live velocity display layout</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["digital", "analog", "minimalist", "bar", "cyber", "aviation", "orb"] as const).map(style => (
                        <button 
                          key={style} 
                          onClick={() => { triggerHaptic(); setHudStyle(style); }}
                          className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${hudStyle === style ? `${ui.t.bg} text-black font-black border-transparent shadow-md` : `${ui.bgList} ${ui.txtMuted} ${ui.brd}`}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3 pt-3 border-t border-zinc-800">
                    <div className="flex flex-col space-y-0.5">
                      <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><ShieldAlertIcon className="w-3.5 h-3.5"/> Speed Limit Sign UI</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["us", "eu", "minimal"] as const).map(style => (
                        <button key={style} onClick={() => { triggerHaptic(); setSpeedSignStyle(style); }} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${speedSignStyle === style ? `${ui.t.bg} text-black font-black border-transparent shadow-md` : `${ui.bgList} ${ui.txtMuted} ${ui.brd}`}`}>{style}</button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center flex-wrap gap-3 pt-3 border-t border-zinc-800">
                    <div className="flex flex-col space-y-0.5">
                      <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Palette className="w-3.5 h-3.5"/> HUD Font Typography Color</span>
                      <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Customize your speedometer font color</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-lg border border-zinc-800">
                        <input 
                          type="color" 
                          value={hudFontColor} 
                          onChange={(e) => setHudFontColor(e.target.value)} 
                          className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-white">{hudFontColor}</span>
                      </div>
                      <button 
                        onClick={() => { triggerHaptic(); setHudFontColor(ui.t.hex); }} 
                        className="px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        Sync Theme
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center`}>
                  <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Palette className="w-3.5 h-3.5"/> Interface Theme</span>
                  <div className="flex gap-2 shrink-0 overflow-x-auto custom-scrollbar pb-1">
                    <button onClick={() => handleThemeChange('lime')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-[#39ff14] border-2 border-black cursor-pointer ${theme === 'lime' || theme === 'rural' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('cyan')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-cyan-500 border-2 border-black cursor-pointer ${theme === 'cyan' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('emerald')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-emerald-500 border-2 border-black cursor-pointer ${theme === 'emerald' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('amber')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-amber-500 border-2 border-black cursor-pointer ${theme === 'amber' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('rose')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-rose-500 border-2 border-black cursor-pointer ${theme === 'rose' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('purple')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-purple-500 border-2 border-black cursor-pointer ${theme === 'purple' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                    <button onClick={() => handleThemeChange('void')} className={`min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-full bg-zinc-800 border-2 border-zinc-500 cursor-pointer ${theme === 'void' ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}></button>
                  </div>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Sun className="w-3.5 h-3.5"/> Sun Visibility Mode</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>High-Contrast Anti-Glare Interface</span>
                  </div>
                  <button onClick={toggleSunVisibility} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${isDayMode ? "bg-amber-500" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${isDayMode ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><EyeOff className="w-3.5 h-3.5"/> Night Vision Mode</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setIsNightVision(!isNightVision); if(!isNightVision) setIsDayMode(false); setAutoNightMode(false); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${isNightVision ? "bg-rose-600" : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${isNightVision ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center col-span-1 md:col-span-2 lg:col-span-3`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><SunMoon className="w-3.5 h-3.5"/> Auto-Night Vision (Hardware Light Sensor)</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Automatically toggles Night Vision based on device ambient lux readings or local sunset time.</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setAutoNightMode(!autoNightMode); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${autoNightMode ? ui.t.bg : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${autoNightMode ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>
              </>
            )}

            {configTab === "sensors" && (
              <>
                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} col-span-1 md:col-span-2 lg:col-span-3 space-y-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className={`w-5 h-5 ${ui.t.text}`} />
                      <span className={`text-xs font-black uppercase tracking-widest ${ui.txtMain}`}>Raw Hardware Sensor Matrix</span>
                    </div>
                    {!sensorsUnlocked && (
                       <button onClick={requestSensorPermissions} className={`px-4 py-2 text-[9px] font-black uppercase border rounded-lg ${ui.t.bg} text-black shadow-md flex items-center gap-2 hover:opacity-80 cursor-pointer`}>
                         <Unlock className="w-3.5 h-3.5"/> Unlock iOS / Web Sensors
                       </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`${ui.bgList} p-3 rounded-lg border ${ui.brd} flex flex-col gap-1 shadow-inner`}>
                       <span className={`text-[9px] ${ui.txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5`}><RotateCw className="w-3 h-3 text-cyan-400"/> Gyro Lean (X)</span>
                       <span className={`${ui.txtMain} text-sm font-mono font-bold tabular-nums`}>{getCalibratedLean()}°</span>
                    </div>
                    <div className={`${ui.bgList} p-3 rounded-lg border ${ui.brd} flex flex-col gap-1 shadow-inner`}>
                       <span className={`text-[9px] ${ui.txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5`}><Crosshair className="w-3 h-3 text-emerald-400"/> Gyro Pitch (Y)</span>
                       <span className={`${ui.txtMain} text-sm font-mono font-bold tabular-nums`}>{Math.round(pitchAngle - gyroOffset.pitch)}°</span>
                    </div>
                    <div className={`${ui.bgList} p-3 rounded-lg border ${ui.brd} flex flex-col gap-1 shadow-inner`}>
                       <span className={`text-[9px] ${ui.txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5`}><Scale className="w-3 h-3 text-rose-400"/> Accelerometer</span>
                       <span className={`${ui.txtMain} text-sm font-mono font-bold tabular-nums`}>{hardwareGForce.toFixed(2)} G</span>
                    </div>
                    <div className={`${ui.bgList} p-3 rounded-lg border ${ui.brd} flex flex-col gap-1 shadow-inner`}>
                       <span className={`text-[9px] ${ui.txtMuted} font-black uppercase tracking-widest flex items-center gap-1.5`}><Sun className="w-3 h-3 text-amber-400"/> Ambient Light</span>
                       <span className={`${ui.txtMain} text-sm font-mono font-bold tabular-nums`}>{Math.round(ambientLux)} LUX</span>
                    </div>
                  </div>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} col-span-1 md:col-span-2 lg:col-span-3 space-y-3`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Magnet className="w-3.5 h-3.5"/> Motor EMF & Hall Sensor Auto-Tuner</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`text-[8px] ${ui.txtMuted} uppercase block mb-1 tabular-nums`}>Magnetic Baseline Offset: {Math.round(magBaseline)} µT</label>
                      <button onClick={calibrateEMF} className={`w-full min-h-[44px] ${ui.bgList} border ${ui.brd} rounded-lg text-[9px] font-black uppercase tracking-widest ${ui.t.text} hover:opacity-80 cursor-pointer`}>Zero Ambient Field Baseline</button>
                    </div>
                    <div>
                      <label className={`text-[8px] ${ui.txtMuted} uppercase block mb-1 tabular-nums`}>Mag Sensitivity Gain: {magAmplifier}x (Live Flux: {magFluxDelta.toFixed(2)} µT)</label>
                      <input type="range" min="1" max="100" value={magAmplifier} onChange={e => setMagAmplifier(Number(e.target.value))} className="w-full h-8 accent-current cursor-pointer"/>
                    </div>
                  </div>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} col-span-1 md:col-span-2 lg:col-span-3 space-y-3`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><RotateCw className="w-3.5 h-3.5"/> IMU Gyroscope Zeroing</span>
                  </div>
                  <button onClick={calibrateIMU} className={`w-full min-h-[44px] ${ui.bgList} border ${ui.brd} rounded-lg text-[9px] font-black uppercase tracking-widest ${ui.t.text} hover:opacity-80 cursor-pointer`}>Calibrate IMU Mounting Angle</button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> Braking G-Sensor Sensitivity</span>
                  </div>
                  <input type="range" min="2.0" max="6.0" step="0.5" value={brakeSensitivity} onChange={e => setBrakeSensitivity(Number(e.target.value))} className={`w-full h-8 ${theme === 'rural' && !isNightVision && !isDayMode ? 'accent-[#39ff14]' : 'accent-current'}`} />
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Disc className="w-3.5 h-3.5"/> Tire Friction Profile</span>
                  <select value={tireFriction} onChange={(e) => { triggerHaptic(); setTireFriction(e.target.value); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full`}>
                    <option value="Street">Street / Slick</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Off-Road/Knobby">Off-Road / Knobby</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex flex-col gap-2`}>
                  <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Network className="w-3.5 h-3.5"/> Subsystem Network Diagnostics</span>
                  <div className={`text-[8px] ${ui.txtMuted} font-mono uppercase`}>Tracks cellular connection to ensure Rider Radar and Maps don't drop out.</div>
                  <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-zinc-800">
                     <span className="font-mono text-[10px] font-bold text-white flex items-center gap-2"><Wifi className="w-3 h-3 text-cyan-400"/> {networkType.toUpperCase()}</span>
                     <span className="font-mono text-[10px] font-bold text-white tabular-nums">PING: <span className={networkPing > 100 ? 'text-amber-500' : 'text-emerald-400'}>{networkPing}ms</span></span>
                  </div>
                </div>
              </>
            )}

            {configTab === "preferences" && (
              <>
                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Scale className="w-3.5 h-3.5"/> Metric Units (KM/H)</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setUseMetric(!useMetric); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${useMetric ? ui.t.bg : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${useMetric ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><BellRing className="w-3.5 h-3.5"/> Audio Speed Warnings</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setAudioWarnings(!audioWarnings); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${audioWarnings ? ui.t.bg : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${audioWarnings ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center col-span-1 md:col-span-2 lg:col-span-3`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><VolumeX className="w-3.5 h-3.5"/> Global Audio Safety Alerts</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Plays high-pitch tones if speed limits are exceeded or battery hits cutoff voltage.</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setAudioWarnings(!audioWarnings); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${audioWarnings ? ui.t.bg : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${audioWarnings ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center col-span-1 md:col-span-2 lg:col-span-3`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><BellRing className="w-3.5 h-3.5"/> Audio Warning Throttle</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Minimum delay between warning beeps to prevent spamming.</span>
                  </div>
                  <select value={audioThrottleInterval} onChange={(e) => { triggerHaptic(); setAudioThrottleInterval(Number(e.target.value)); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer`}>
                    <option value="1000">1 Second</option>
                    <option value="3000">3 Seconds</option>
                    <option value="5000">5 Seconds</option>
                    <option value="10000">10 Seconds</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center col-span-1 md:col-span-2 lg:col-span-3`}>
                  <div className="flex flex-col space-y-0.5 pr-2">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><EyeIcon className="w-3.5 h-3.5"/> Visual G-Force Flasher Alerts</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Flashes UI panels during extreme acceleration or harsh braking.</span>
                  </div>
                  <button onClick={() => { triggerHaptic(); setVisualGForceAlerts(!visualGForceAlerts); }} className={`relative inline-flex min-h-[32px] min-w-[56px] shrink-0 items-center rounded-full transition-colors cursor-pointer ${visualGForceAlerts ? ui.t.bg : "bg-zinc-800"}`}><span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${visualGForceAlerts ? "translate-x-7" : "translate-x-1"}`}/></button>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> GPS Path Smoothing Factor</span>
                  <select value={gpsSmoothing} onChange={(e) => { triggerHaptic(); setGpsSmoothing(e.target.value as any); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full`}>
                    <option value="Loose">Loose (Faster Response)</option>
                    <option value="Balanced">Balanced (Default)</option>
                    <option value="Strict">Strict (Maximum Anti-Jitter)</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> Telemetry Polling Rate</span>
                  <select value={telemetryRate} onChange={(e) => { triggerHaptic(); setTelemetryRate(Number(e.target.value)); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full`}>
                    <option value="500">Fast (0.5s)</option>
                    <option value="1000">Normal (1.0s)</option>
                    <option value="2000">Slow (2.0s)</option>
                  </select>
                </div>
                
                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <div className="flex flex-col space-y-0.5">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Radar className="w-3.5 h-3.5"/> Speed Limit Scan Matrix</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Aggressive checks every cross-street & turn.</span>
                  </div>
                  <select value={speedLimitPolling} onChange={(e) => { triggerHaptic(); setSpeedLimitPolling(e.target.value as any); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full sm:w-auto mt-2 sm:mt-0`}>
                    <option value="Aggressive">Aggressive (~50ft / All Turns)</option>
                    <option value="Balanced">Balanced (~250ft / Major Turns)</option>
                    <option value="Eco">Eco (~800ft / Conserves Data)</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <div className="flex flex-col space-y-0.5">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Activity className="w-3.5 h-3.5"/> Auto-Wake Trigger Velocity</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Speed required to automatically begin mission recording.</span>
                  </div>
                  <select value={autoWakeSpeed} onChange={(e) => { triggerHaptic(); setAutoWakeSpeed(Number(e.target.value)); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full sm:w-auto mt-2 sm:mt-0`}>
                    <option value="3">Ultra-Sensitive (3 {speedLabel})</option>
                    <option value="5">Low (5 {speedLabel})</option>
                    <option value="10">Standard (10 {speedLabel})</option>
                    <option value="15">Highway (15 {speedLabel})</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} flex justify-between items-center flex-wrap gap-2`}>
                  <div className="flex flex-col space-y-0.5">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><Battery className="w-3.5 h-3.5"/> Battery Chemistry Core</span>
                    <span className={`text-[8px] ${ui.txtMuted} uppercase`}>Adjusts AI voltage sag & thermal runaway tolerances.</span>
                  </div>
                  <select value={batteryChemistry} onChange={(e) => { triggerHaptic(); setBatteryChemistry(e.target.value); }} className={`${ui.bgInput} text-[9px] font-black uppercase min-h-[44px] px-2 rounded outline-none cursor-pointer w-full sm:w-auto mt-2 sm:mt-0`}>
                    <option value="Li-Ion">Lithium-Ion (Standard)</option>
                    <option value="LiFePO4">LiFePO4 (High Stability)</option>
                    <option value="SLA">Sealed Lead Acid (Legacy)</option>
                  </select>
                </div>

                <div className={`${ui.bgCard} p-4 rounded-xl border ${ui.brd} col-span-1 md:col-span-2 lg:col-span-3`}>
                  <div className="flex flex-col space-y-1 mb-3">
                    <span className={`text-[9px] ${ui.t.text} font-black uppercase tracking-widest flex items-center gap-2`}><MapPin className="w-3.5 h-3.5"/> Manual GPS Fallback Zone</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={fallbackInput} onChange={(e) => setFallbackInput(e.target.value)} placeholder="e.g. London, UK or Stigler, OK" className={`flex-1 min-h-[44px] ${ui.bgInput} rounded-lg px-3 text-xs font-bold outline-none focus:${ui.t.border}`}/>
                    <button onClick={() => { triggerHaptic(); manuallySetFallback(); }} className={`min-h-[44px] px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${ui.t.bg} text-black ${ui.t.shadow} cursor-pointer`}>Lock Base</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}