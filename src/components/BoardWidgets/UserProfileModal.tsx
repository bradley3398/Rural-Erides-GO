import React from "react";
import { motion } from "framer-motion";
import { Share2, X, CheckCircle, ShieldCheck, Wrench, Layers, UserPlus, UserMinus, Mail, Edit3 } from "lucide-react";

const getTimeMs = (ts: any) => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

export default function UserProfileModal({ 
  activeProfileUser, setActiveProfileUser, userProfiles, posts, 
  username, friends, toggleFriend, setActiveDMUser, setShowInbox, 
  setIsSettingsOpen, shareProfile, calculateUserLevel, getTopSpeed, 
  themeColors 
}: any) {
  if (!activeProfileUser) return null;
  const t = themeColors;
  const stats = calculateUserLevel(activeProfileUser);

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={`bg-black/90 border ${t.borderSubtle} rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative`}>
        <div className={`h-24 ${t.bg} opacity-20 w-full`}></div>
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-black bg-zinc-800 flex items-center justify-center text-3xl font-black text-white overflow-hidden shadow-xl">
               {userProfiles[activeProfileUser]?.pfpUrl ? <img src={userProfiles[activeProfileUser].pfpUrl} className="w-full h-full object-cover"/> : activeProfileUser.charAt(0).toUpperCase()}
            </div>
            <div className="flex gap-2">
              <button onClick={() => shareProfile(activeProfileUser)} className="p-2 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"><Share2 className="w-4 h-4"/></button>
              <button onClick={() => setActiveProfileUser(null)} className="p-2 bg-black/50 hover:bg-white/10 rounded-full border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-white truncate">{activeProfileUser}</h2>
            {(stats.level >= 5 || ["RURALERIDE", "BRADLEY CALLISON", "LORD BRADLEY CALLISON"].includes(activeProfileUser.toUpperCase())) && (
              <CheckCircle className="w-4 h-4 text-blue-400 fill-blue-400" title="Verified Rider" />
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-xl flex items-center justify-center gap-2 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-500">Trust Score</span>
                <span className="block text-xs font-mono font-bold text-emerald-400">98.5% (Verified)</span>
              </div>
            </div>
            <div className="flex-1 bg-amber-950/30 border border-amber-500/30 p-2 rounded-xl flex items-center justify-center gap-2 shadow-inner">
              <Wrench className="w-4 h-4 text-amber-400" />
              <div>
                <span className="block text-[8px] font-black uppercase tracking-widest text-amber-500">Rescues</span>
                <span className="block text-xs font-mono font-bold text-amber-400">12 Logged</span>
              </div>
            </div>
          </div>

          <div className="mb-5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> Digital Garage Payload</span>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
              {String(userProfiles[activeProfileUser]?.userFleet || "Universal PEV").split(',').map((vehicle: string, i: number) => (
                <div key={i} className={`bg-black/60 border ${t.borderSubtle} px-3 py-2 rounded-xl shrink-0 flex items-center gap-2 shadow-md`}>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{vehicle.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-zinc-800 rounded-r-md"></div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium pl-2 italic">
              "{userProfiles[activeProfileUser]?.userBio || "This pilot hasn't filed a bio yet."}"
            </p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-widest">Pilot Level {stats.level}</span>
               <span className={`text-[9px] font-bold ${t.text} uppercase tracking-wider`}>{stats.progress}% to Next Level</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
               <div className={`h-full ${t.bg}`} style={{ width: `${stats.progress}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center shadow-inner">
              <span className="block text-sm font-black text-white">{posts.filter((p: any) => p.username === activeProfileUser).length}</span>
              <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">Posts</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center shadow-inner">
              <span className="block text-sm font-black text-amber-400">{posts.filter((p: any) => p.username === activeProfileUser).reduce((acc: number, p: any) => acc + (p.volts || 0), 0)}</span>
              <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">Volts</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center shadow-inner">
              <span className="block text-sm font-black text-emerald-400">{getTopSpeed(activeProfileUser)}</span>
              <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">Top Spd</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-center shadow-inner">
              <span className="block text-[11px] mt-1 font-black text-cyan-400 truncate">{userProfiles[activeProfileUser]?.lastActive && (Date.now() - getTimeMs(userProfiles[activeProfileUser].lastActive)) < 900000 ? "Online" : "Away"}</span>
              <span className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold mt-1 block">Status</span>
            </div>
          </div>

          {activeProfileUser !== username ? (
            <div className="flex gap-2">
               <button onClick={() => toggleFriend(activeProfileUser)} className={`flex-1 min-h-[44px] rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${friends.includes(activeProfileUser) ? 'bg-white/10 text-white border border-white/20' : `${t.bg} text-black shadow-lg`}`}>
                 {friends.includes(activeProfileUser) ? <><UserMinus className="w-4 h-4"/> Remove Crew</> : <><UserPlus className="w-4 h-4"/> Add to Crew</>}
               </button>
               <button onClick={() => { setActiveProfileUser(null); setActiveDMUser(activeProfileUser); setShowInbox(true); }} className="flex-1 min-h-[44px] rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-white/5 border border-white/10 text-white hover:bg-white/10">
                 <Mail className="w-4 h-4"/> Message
               </button>
            </div>
          ) : (
            <button onClick={() => { setActiveProfileUser(null); setIsSettingsOpen(true); }} className="w-full min-h-[44px] rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-white/10 border border-white/20 text-white hover:bg-white/20">
              <Edit3 className="w-4 h-4"/> Edit Profile
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}