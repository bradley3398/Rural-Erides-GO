import React from "react";
import { Thermometer, MapPin, Search, Sun, Eye, Activity, CloudFog, Waves, Droplets, CloudRain, Sunrise, Sunset, CalendarDays, Snowflake, Zap } from "lucide-react";

export default function WeatherMatrix(props: any) {
  const {
    weatherData, weatherInput, setWeatherInput, handleLocationSearch,
    isFetchingWeather, savedLocationName, rideSafetyRating, useMetric,
    formatTimeFromIso, getWeatherIcon, getCardinalDirection, ui, tx, localeCode
  } = props;

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col border transition-colors ${ui.brd}`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b ${ui.brd} pb-4 relative z-10 shrink-0`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${ui.t.dim}`}><Thermometer className={`w-5 h-5 ${ui.t.text}`} /></div>
          <h3 className={`${ui.txtMain} font-black uppercase tracking-widest text-sm flex flex-col`}>
            {tx('weather')}
            <span className={`text-[10px] ${ui.txtMuted} flex items-center gap-1 mt-1 font-bold`}><MapPin className="w-3 h-3"/> {savedLocationName}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className={`flex flex-1 sm:flex-none ${ui.bgBase} rounded-xl border overflow-hidden transition-colors ${ui.brd} focus-within:border-zinc-500`}>
            <input 
              value={weatherInput} onChange={(e) => setWeatherInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
              placeholder="City override..."
              className={`min-h-[44px] bg-transparent text-xs font-bold ${ui.txtMain} px-4 outline-none w-full sm:w-36`}
            />
            <button onClick={handleLocationSearch} className={`min-h-[44px] min-w-[44px] ${ui.bgList} transition-colors flex items-center justify-center cursor-pointer ${ui.t.text}`}><Search className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {isFetchingWeather ? (
        <div className={`flex-1 flex items-center justify-center py-10 text-xs font-bold uppercase tracking-widest animate-pulse ${ui.t.text}`}>Syncing Satellites...</div>
      ) : weatherData && weatherData.current ? (
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          
          <div className={`mb-5 ${ui.bgCard} border ${ui.brd} rounded-xl p-3 flex justify-between items-center shadow-inner`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Run Safety Vector</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border border-transparent ${rideSafetyRating.color === 'text-rose-500' ? 'bg-rose-950/40 border-rose-900/50' : ''} ${rideSafetyRating.color}`}>{rideSafetyRating.text}</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 mb-6">
            <div className={`${ui.txtMain} text-6xl font-black font-mono tracking-tighter drop-shadow-md`}>{Math.round(weatherData?.current?.temperature_2m ?? 0)}°</div>
            
            <div className={`border-l ${ui.brd} pl-5 space-y-1.5`}>
              <div className={`text-[11px] ${ui.txtMuted} font-bold uppercase tracking-widest`}>Peak: {Math.round(weatherData?.daily?.temperature_2m_max?.[0] ?? 0)}° • Low: {Math.round(weatherData?.daily?.temperature_2m_min?.[0] ?? 0)}°</div>
              <div className={`text-[11px] font-mono font-bold uppercase tracking-widest ${ui.t.text}`}>Wind: {Math.round(weatherData?.current?.wind_speed_10m ?? 0)} {useMetric ? 'kmh' : 'mph'} <span className={ui.txtMuted}>({getCardinalDirection(weatherData?.current?.wind_direction_10m)})</span></div>
              <div className={`text-[11px] font-mono uppercase tracking-widest text-rose-500`}>Gusts: {Math.round(weatherData?.current?.wind_gusts_10m ?? weatherData?.current?.wind_speed_10m ?? 0)} {useMetric ? 'kmh' : 'mph'}</div>
            </div>

            <div className={`w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 pt-4 border-t ${ui.brd}`}>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Solar UV Index</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.current?.uv_index ?? 0} / 11</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Eye className={`w-5 h-5 ${ui.t.text}`} />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Visibility</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{useMetric ? (((weatherData?.current?.visibility ?? 10000)/1000).toFixed(1) + ' km') : (((weatherData?.current?.visibility ?? 10000)/1609).toFixed(1) + ' mi')}</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Activity className={`w-5 h-5 text-purple-500`} />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Pressure</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.current?.surface_pressure ?? 1013} hPa</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <CloudFog className={`w-5 h-5 text-zinc-500`} />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Cloud Cover</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.current?.cloud_cover ?? 0}%</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Thermometer className="w-5 h-5 text-rose-400" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Feels Like</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{Math.round(weatherData?.current?.apparent_temperature ?? weatherData?.current?.temperature_2m ?? 0)}°</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Waves className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Dew Point</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{Math.round(weatherData?.current?.dew_point_2m ?? 0)}°</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Humidity</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.current?.relative_humidity_2m ?? 0}%</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <CloudRain className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Moisture</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.current?.precipitation ?? 0} {useMetric ? 'mm' : 'in'}</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Sunrise className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Solar Dawn</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.daily?.sunrise?.[0] ? formatTimeFromIso(weatherData.daily.sunrise[0]) : "N/A"}</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Sunset className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Solar Dusk</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{weatherData?.daily?.sunset?.[0] ? formatTimeFromIso(weatherData.daily.sunset[0]) : "N/A"}</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Thermometer className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Trail Surf Temp</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{Math.round(weatherData?.current?.soil_temperature_0cm ?? 0)}°</div>
                  </div>
               </div>
               <div className={`${ui.bgList} border ${ui.brd} rounded-xl p-3 flex items-center gap-3`}>
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className={`text-[8px] font-black uppercase tracking-widest ${ui.txtMuted}`}>Solar Radiation</div>
                    <div className={`text-xs font-bold ${ui.txtMain}`}>{Math.round(weatherData?.current?.direct_radiation ?? 0)} W/m²</div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className={`mt-2 border-t ${ui.brd} pt-5`}>
             <h4 className={`text-[10px] font-black ${ui.txtMuted} uppercase tracking-widest mb-3 flex items-center gap-2`}>
               <CalendarDays className="w-4 h-4"/> 10-Day Atmospheric Outlook
             </h4>
             <div className="flex gap-2.5 overflow-x-auto custom-scrollbar pb-2">
               {weatherData?.daily?.time?.map((day: string, idx: number) => (
                  <div key={day} className={`${ui.bgBase} border ${ui.brd} p-3 rounded-xl text-center flex flex-col items-center justify-between h-28 min-w-[76px] shrink-0 shadow-inner`}>
                      <span className={`text-[9px] font-black ${ui.txtMuted} uppercase`}>{new Date(day).toLocaleDateString(localeCode, { weekday: 'short' })}</span>
                      {getWeatherIcon(weatherData?.daily?.weather_code?.[idx])}
                      <div className="space-y-0.5">
                        <span className={`text-[11px] font-black ${ui.txtMain}`}>{Math.round(weatherData?.daily?.temperature_2m_max?.[idx] ?? 0)}°</span>
                        <span className={`text-[9px] font-bold ${ui.txtMuted} ml-1`}>{Math.round(weatherData?.daily?.temperature_2m_min?.[idx] ?? 0)}°</span>
                      </div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex items-center justify-center py-6 ${ui.txtMuted} font-mono text-[10px] uppercase`}>Base Station Unconfigured</div>
      )}
    </div>
  );
}