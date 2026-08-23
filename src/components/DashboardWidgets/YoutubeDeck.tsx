import React, { useState } from "react";
import { Youtube, X, Sliders, EyeOff, Volume1, Disc, Shuffle, FastForward, Music, Search, Loader2, AlertOctagon, ListPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getYouTubeApiKey } from "../../services/CoPilotService";

const YT_GENRES = [
  { label: "🎹 Classical Piano", query: "Classical Piano Solo Performance" },
  { label: "🫁 Theatre Organ", query: "Traditional Theatre Organ Music Console" },
  { label: "🪗 Polka Mix", query: "Traditional Polka Accordion Mix" },
  { label: "🛳️ Maritime History", query: "Historic Ocean Liners Documentary" },
  { label: "🎣 Bass Fishing", query: "Catch and Release Lake Fishing Real Worms" },
  { label: "💻 Classical Music", query: "Classical Music" },
  { label: "😂 Movie Soundtracks", query: "Movie soundtracks" },
  { label: "🚀 Johann Strauss Walzers", query: "Johann Strauss" },
  { label: "🎬 Epic Soundtracks", query: "Epic Movie Soundtracks Cinematic Orchestra" },
  { label: "🤠 Classic Country", query: "Classic Country Music" },
  { label: "🔥 Heavy Metal", query: "Heavy Metal" },
  { label: "📻 90s Hip Hop", query: "90s Hip Hop Instrumentals Bass Boosted" },
  { label: "🌆 Synthwave", query: "Retro Synthwave Outrun Cyberpunk" },
  { label: "☕ Lo-Fi Beats", query: "Lo-Fi Beats Chill Study Ride" },
  { label: "🤖 Cyberpunk 2077", query: "Cyberpunk 2077 Radio Soundtrack Mix" },
  { label: "⚡ 80s Synthpop", query: "80s Synthpop Electronic Highway Hits" },
  { label: "🎧 Bass Boosted EDM", query: "EDM Festival Bass Boosted Car Riding Mix" },
  { label: "🧠 Deep Focus", query: "Ambient Electronic Brain Focus Flow" },
  { label: "🎸 Rock Classics", query: "70s 80s Classic Hard Rock Riding Anthems" },
];

export default function YoutubeDeck({ ui, tx }: { ui: any, tx: any }) {
  const [ytSearchQuery, setYtSearchQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [ytQueue, setYtQueue] = useState<{id: string, title: string, thumb: string}[]>([]);
  const [showYtSettings, setShowYtSettings] = useState(false);
  const [ytLoop, setYtLoop] = useState(false);
  const [ytVideoQuality, setYtVideoQuality] = useState("large");
  const [ytPlaybackRate, setYtPlaybackRate] = useState<number>(1);
  const [ytVolume, setYtVolume] = useState<number>(100);
  const [minimizeVideo, setMinimizeVideo] = useState(false);
  const [isFetchingYt, setIsFetchingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const handleYoutubeSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || ytSearchQuery;
    if (!q.trim()) return;
    setIsFetchingYt(true); setYtError(null);
    try {
      const ytKey = getYouTubeApiKey();
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(q)}&type=video&key=${ytKey}`);
      const data = await res.json();
      if (data.items) {
        setYtResults(data.items.map((i: any) => ({
          id: { videoId: i.id.videoId }, snippet: i.snippet
        })));
      } else {
        setYtError("No results found.");
      }
    } catch (err) { setYtError("Video Sat-Link Offline."); } 
    finally { setIsFetchingYt(false); }
  };

  const handleShuffleQueue = () => {
    if (ytQueue.length <= 1) return;
    const currentTrack = ytQueue[0];
    const rest = [...ytQueue.slice(1)];
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    setYtQueue([currentTrack, ...rest]);
  };

  const handleNextTrack = () => {
    if (ytQueue.length > 1) setYtQueue(prev => prev.slice(1));
    else if (ytQueue.length === 1 && ytLoop) setYtQueue([{...ytQueue[0]}]);
    else setYtQueue([]);
  };

  return (
    <div className={`${ui.bgPanel} p-4 sm:p-6 rounded-3xl shadow-xl border transition-colors space-y-5 ${ui.brd}`}>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${ui.brd} pb-4 gap-4 w-full`}>
        <div className="flex items-center gap-3">
          <div className="bg-rose-600 p-2.5 rounded-xl text-white shadow-md"><Youtube className="w-5 h-5" /></div>
          <div>
            <h3 className={`${ui.txtMain} font-black uppercase tracking-widest text-sm`}>{tx('audio')}</h3>
            <p className={`text-[9px] ${ui.txtMuted} font-mono uppercase mt-1`}>{ytQueue.length} Active Target Array Sequences</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => setYtQueue([])} className={`flex-1 sm:flex-none min-h-[44px] px-4 text-[10px] font-black border rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${ui.bgBase} ${ui.brd} ${ui.txtMuted} hover:text-rose-500 hover:border-rose-900`}>
            <X className="w-4 h-4"/> {tx('clear')}
          </button>
          <button onClick={() => setShowYtSettings(!showYtSettings)} className={`flex-1 sm:flex-none min-h-[44px] px-4 text-[10px] font-black border rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${showYtSettings ? 'bg-zinc-800 border-zinc-700 text-white' : `${ui.bgBase} ${ui.brd} ${ui.txtMuted} hover:border-zinc-500`}`}>
            <Sliders className="w-4 h-4"/> Config
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showYtSettings && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`${ui.bgCard} p-4 rounded-2xl border ${ui.brd} grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs overflow-hidden`}>
            <div className={`flex justify-between items-center ${ui.bgList} px-4 min-h-[56px] rounded-xl border ${ui.brd}`}>
              <span className={`text-[10px] font-black uppercase ${ui.txtMuted} tracking-wider`}>Continuous Loop</span>
              <button onClick={() => setYtLoop(!ytLoop)} className={`min-h-[36px] px-4 text-[9px] font-black border rounded-lg uppercase cursor-pointer ${ytLoop ? 'bg-rose-950/40 border-rose-900 text-rose-500' : `${ui.bgBase} ${ui.brd} ${ui.txtMuted}`}`}>{ytLoop ? 'LOOP ON' : 'OFF'}</button>
            </div>
            <div className={`flex justify-between items-center ${ui.bgList} px-4 min-h-[56px] rounded-xl border ${ui.brd}`}>
              <span className={`text-[10px] font-black uppercase ${ui.txtMuted} tracking-wider flex items-center gap-2`}><EyeOff className="w-4 h-4"/> Minimize Video</span>
              <button onClick={() => setMinimizeVideo(!minimizeVideo)} className={`min-h-[36px] px-4 text-[9px] font-black border rounded-lg uppercase cursor-pointer ${minimizeVideo ? 'bg-emerald-950/40 border-emerald-900 text-emerald-500' : `${ui.bgBase} ${ui.brd} ${ui.txtMuted}`}`}>{minimizeVideo ? 'MINIMIZED' : 'EXPANDED'}</button>
            </div>
            <div className={`flex flex-col justify-center ${ui.bgList} px-4 min-h-[56px] rounded-xl border ${ui.brd} gap-1.5 col-span-1 sm:col-span-2`}>
              <span className={`text-[10px] font-black uppercase ${ui.txtMuted} tracking-wider flex items-center gap-2 w-full justify-between`}><span className="flex items-center gap-2"><Volume1 className="w-4 h-4"/> Output Gain</span> <span className={`${ui.txtMain} font-mono`}>{ytVolume}%</span></span>
              <input type="range" min="0" max="100" value={ytVolume} onChange={e => setYtVolume(Number(e.target.value))} className="w-full accent-rose-500 cursor-pointer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className={`lg:col-span-5 flex flex-col justify-between space-y-4 ${ui.bgCard} border ${ui.brd} p-4 sm:p-5 rounded-3xl shadow-inner w-full`}>
          {ytQueue.length > 0 ? (
            <div className="space-y-4 w-full">
              {!minimizeVideo && (
                <div className={`rounded-2xl overflow-hidden border ${ui.brd} shadow-2xl bg-black relative aspect-video w-full`}>
                  <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytQueue[0].id}?autoplay=1&vq=${ytVideoQuality}&loop=${ytLoop ? 1 : 0}&playlist=${ytQueue[0].id}&playsinline=1`} frameBorder="0" allowFullScreen></iframe>
                </div>
              )}
              {minimizeVideo && (
                <div className="w-full h-0 overflow-hidden opacity-0 pointer-events-none">
                   <iframe width="10%" height="10%" src={`https://www.youtube.com/embed/${ytQueue[0].id}?autoplay=1`} frameBorder="0" allow="autoplay"></iframe>
                </div>
              )}
              <div className={`${ui.bgList} border ${ui.brd} rounded-2xl p-4 flex flex-col gap-3`}>
                 <div className={`text-[11px] font-bold ${ui.txtMain} truncate text-center px-1`}>{ytQueue[0].title}</div>
                 <div className={`flex justify-center items-center gap-4 pt-3 border-t ${ui.brd}`}>
                   <button onClick={handleShuffleQueue} className={`min-h-[56px] min-w-[56px] flex items-center justify-center ${ui.bgBase} border ${ui.brd} rounded-xl ${ui.txtMuted} hover:${ui.txtMain} hover:border-zinc-500 cursor-pointer`}><Shuffle className="w-5 h-5"/></button>
                   <button onClick={handleNextTrack} className={`flex-1 flex items-center justify-center gap-2 min-h-[56px] px-4 bg-rose-950/40 border border-rose-900/50 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white cursor-pointer`}><FastForward className="w-4 h-4"/> Next Array Track</button>
                 </div>
              </div>
            </div>
          ) : (
            <div className={`h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 border border-dashed ${ui.brd} rounded-2xl`}>
               <Music className={`w-10 h-10 ${ui.txtMuted} animate-pulse mb-3`} />
               <span className={`text-[11px] font-mono ${ui.txtMuted} uppercase tracking-widest font-bold`}>Deck Pipeline Idle</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4 w-full">
          <div className="space-y-2">
            <span className={`text-[9px] font-black ${ui.txtMuted} uppercase tracking-widest block font-mono pl-1`}>Cockpit Presets</span>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {YT_GENRES.map(genre => (
                <button key={genre.label} onClick={() => { setYtSearchQuery(genre.query); handleYoutubeSearch(genre.query); }} className={`min-w-[140px] min-h-[56px] px-4 ${ui.bgList} border ${ui.brd} hover:border-rose-500/50 ${ui.txtMuted} hover:${ui.txtMain} text-[10px] font-black uppercase rounded-xl text-left truncate shadow-inner shrink-0 cursor-pointer`}>
                  {genre.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input value={ytSearchQuery} onChange={(e) => setYtSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleYoutubeSearch()} placeholder={tx('search')} className={`flex-1 min-h-[56px] ${ui.bgList} border ${ui.brd} rounded-xl px-4 ${ui.txtMain} text-xs font-bold outline-none focus:border-rose-500 transition-colors`} />
            <button onClick={() => handleYoutubeSearch()} className="min-h-[56px] w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center justify-center gap-2 shrink-0 cursor-pointer"><Search className="w-4 h-4"/> Query</button>
          </div>

          {isFetchingYt && (
            <div className={`p-4 rounded-2xl ${ui.bgCard} border ${ui.brd} flex items-center justify-center gap-3 text-xs font-mono font-bold text-rose-500 animate-pulse mt-4`}>
              <Loader2 className="w-5 h-5 animate-spin" /> Querying Media...
            </div>
          )}

          {ytResults.length > 0 && (
            <div className={`${ui.bgCard} border ${ui.brd} rounded-3xl p-3 max-h-[360px] overflow-y-auto custom-scrollbar space-y-2 mt-4`}>
              {ytResults.map((vid, idx) => (
                <div key={idx} className={`${ui.bgList} border ${ui.brd} p-2.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-500/50 transition-colors`}>
                  <div className="flex gap-3 items-center truncate">
                    <img src={vid.snippet.thumbnails.default.url} alt="" className={`w-16 h-12 object-cover rounded-xl border ${ui.brd} shrink-0`} />
                    <div className="truncate">
                      <h4 className={`text-xs font-bold ${ui.txtMain} truncate`}>{vid.snippet.title}</h4>
                      <p className={`text-[9px] ${ui.txtMuted} font-mono uppercase truncate mt-1`}>{vid.snippet.channelTitle}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                    <button onClick={() => setYtQueue([{id: vid.id.videoId, title: vid.snippet.title, thumb: vid.snippet.thumbnails.default.url}])} className="flex-1 sm:flex-none min-h-[56px] px-6 bg-rose-950/40 border border-rose-900/40 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white cursor-pointer">{tx('play')}</button>
                    <button onClick={() => setYtQueue(prev => [...prev, {id: vid.id.videoId, title: vid.snippet.title, thumb: vid.snippet.thumbnails.default.url}])} className={`flex-1 sm:flex-none min-h-[56px] px-6 ${ui.bgBase} border ${ui.brd} ${ui.txtMuted} rounded-xl text-[10px] hover:border-zinc-500 hover:${ui.txtMain} flex items-center justify-center gap-2 cursor-pointer`}><ListPlus className="w-4 h-4"/> {tx('queue')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}