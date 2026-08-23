import React, { useState, useEffect } from "react";
import { 
  Award, Flame, MessageCircle, Share2, Trash2, Edit3, Save, 
  Volume2, VolumeX, CheckCircle, Mail, MapPin, Map, Wrench, 
  Tag, ShoppingBag, AlertTriangle, ShieldAlert, BarChart2, Users, 
  Sparkles, Send, Image as ImageIcon, X, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Capacitor } from '@capacitor/core';
import { Haptics } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// Disallowed keyword safety filter
const DISALLOWED_KEYWORDS = ["abuse", "idiot", "jerk", "asshole", "bitch", "crap", "damn", "fuck", "shit", "bastard", "trash", "hate", "kill", "stupid", "moron", "spam", "scam"];
function checkContentSafety(text: string): { safe: boolean; blockedWord?: string } {
  const normalized = text.toLowerCase();
  for (const word of DISALLOWED_KEYWORDS) {
    if (normalized.includes(word)) return { safe: false, blockedWord: word };
  }
  return { safe: true };
}

const getTimeMs = (ts: any) => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

export default function FeedPost({ 
  post, currentUser, userProfiles, dataSaverMode, onVolt, onDelete, 
  onAiTrigger, aiRunning, themeColors, isSaved, onToggleSave, onFlag, 
  onOpenProfile, onOpenDM, useMetric, PEV_TEMPLATES 
}: any) {
  const isDiagnostics = post.category === "Hardware Diagnostics";
  const isMarketplace = post.category === "Marketplace" || post.template === "market" || post.marketplace;
  
  const currentClean = String(currentUser || "").trim().toLowerCase();
  const postClean = String(post.username || "").trim().toLowerCase();
  const isFounderUser = currentClean.includes("bradley") || currentClean === "ruraleride" || currentClean === "lord bradley callison";
  const isOwnPost = currentClean === postClean || isFounderUser || postClean === "pilot" || currentClean === "";

  const themeConfig = PEV_TEMPLATES.find((t: any) => t.id === post.template) || PEV_TEMPLATES[0];
  const t = themeColors;
  
  const isFounder = String(post.username || "").toUpperCase() === "RURALERIDE" || String(post.username || "").toUpperCase() === "BRADLEY CALLISON" || String(post.username || "").toUpperCase() === "LORD BRADLEY CALLISON";
  let badgeText = "Verified Rider";
  let badgeStyle = themeConfig.badgeBg;
  
  if (isFounder) {
    badgeText = "Network Founder"; badgeStyle = `text-black ${t.border} ${t.bg} ${t.glow}`;
  } else if (post.category === "🚨 STOLEN PEV ALERT") {
    badgeText = "STOLEN VEHICLE ALERT"; badgeStyle = "text-white border-red-500 bg-red-900 animate-ping font-black";
  } else if (post.category === "Trail Rescue Bounty") {
    badgeText = "ACTIVE RESCUE BOUNTY"; badgeStyle = "text-black border-amber-400 bg-amber-400 font-black animate-pulse";
  } else if (post.isHelpNeeded) {
    badgeText = "SOS Technical Help Request"; badgeStyle = "text-white border-red-500 bg-red-600 animate-pulse";
  } else if (isMarketplace) {
    badgeText = "Marketplace Listing"; badgeStyle = "text-emerald-400 border-emerald-500/30 bg-emerald-950/40";
  } else if (post.volts >= 20) {
    badgeText = "Master Builder"; badgeStyle = "text-black border-amber-400 bg-amber-400";
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [isReading, setIsReading] = useState(false);
  const [showDataSaverMedia, setShowDataSaverMedia] = useState(false);
  const [distanceToPost, setDistanceToPost] = useState<number | null>(null);

  const isOnline = userProfiles[post.username]?.lastActive && (Date.now() - getTimeMs(userProfiles[post.username].lastActive)) < 900000;
  const wordCount = post.content ? String(post.content).split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const triggerHaptic = async (style: any = "LIGHT") => {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) await Haptics.impact({ style });
      else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(style === "HEAVY" ? 50 : 15);
    } catch (e) {}
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleQuickReaction = async (reactionType: string) => {
    triggerHaptic("LIGHT");
    const reactionKey = `reactions.${reactionType}`;
    try {
      await updateDoc(doc(db, "board_posts", post.id), { [reactionKey]: increment(1) });
    } catch (e) {}
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const commentSafety = checkContentSafety(commentText);
    if (!commentSafety.safe) return alert("Reply violates safety guidelines.");

    triggerHaptic("MEDIUM");
    await updateDoc(doc(db, "board_posts", post.id), {
      comments: arrayUnion({ 
        id: Date.now().toString(), 
        author: currentUser || "Guest", 
        text: commentText.trim(), 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isAI: false
      })
    });
    setCommentText("");
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await updateDoc(doc(db, "board_posts", post.id), { content: editContent.trim(), isEdited: true });
    setIsEditing(false);
  };

  const handleReadAloud = async () => {
    try {
      triggerHaptic("LIGHT");
      if (isReading) {
        if (Capacitor.isPluginAvailable('TextToSpeech')) await TextToSpeech.stop();
        else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setIsReading(false);
      } else {
        setIsReading(true);
        const textToSpeak = `Transmission from ${post.username}: ${post.content}`;
        if (Capacitor.isPluginAvailable('TextToSpeech')) {
          await TextToSpeech.speak({ text: textToSpeak, lang: 'en-US', rate: 1.0 });
          setIsReading(false);
        } else if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(textToSpeak);
          u.onend = () => setIsReading(false);
          window.speechSynthesis.speak(u);
        }
      }
    } catch (e) {
      setIsReading(false);
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return String(text).split("\n").map((line, idx) => {
      const parts = line.split(/(@\w+)/g);
      return (
        <p key={idx} className="text-[13px] text-zinc-300 leading-relaxed font-sans mb-1.5 font-medium break-words">
          {parts.map((part, i) => 
            part.startsWith('@') ? <span key={i} className={`${t.text} font-bold ${t.bgSubtle} px-1.5 py-0.5 rounded cursor-pointer hover:underline`} onClick={() => onOpenProfile(part.substring(1))}>{part}</span> : part
          )}
        </p>
      );
    });
  };

  return (
    <motion.div 
      id={`post-${post.id}`} 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.95 }} 
      className={`border rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden transition-all duration-500 ${themeConfig.id !== "none" ? "border-white/10" : themeConfig.css} ${isMarketplace ? 'border-emerald-500/40' : ''} ${post.isHelpNeeded ? 'border-red-500/40' : ''}`}
      style={themeConfig.bgUrl ? { backgroundImage: `url('${themeConfig.bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {themeConfig.bgUrl && <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-0 pointer-events-none"></div>}
      
      <div className="p-5 sm:p-6 relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-3 sm:gap-4 w-full">
            <div onClick={() => onOpenProfile(post.username)} className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full flex items-center justify-center font-black text-xl shadow-inner overflow-hidden cursor-pointer ${isFounder ? `${t.bg} text-black ${t.glow} border-2 ${t.border}` : "bg-zinc-800 text-white border-2 border-zinc-700"} relative`}>
              {post.pfpUrl ? <img src={post.pfpUrl} alt="" className="w-full h-full object-cover" /> : String(post.username || "R").charAt(0).toUpperCase()}
              {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full shadow-lg"></div>}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h4 onClick={() => onOpenProfile(post.username)} className="text-sm font-black text-white truncate cursor-pointer hover:underline flex items-center gap-1.5">
                  {post.username || "Rider"}
                  {(post.volts > 50 || isFounder) && <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />}
                </h4>
                <span className={`px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${badgeStyle} shrink-0`}>
                  <Award className="w-3 h-3" /> {badgeText}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-500 font-black uppercase tracking-widest font-mono mt-1">
                <span>{post.timestamp || "Just now"}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-md shrink-0 ${isDiagnostics || post.isHelpNeeded ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-white/5 text-zinc-300 border border-white/10"}`}>{post.category}</span>
                <span>•</span>
                <span className={`${t.text} shrink-0`}>{post.pevType}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button type="button" onClick={handleReadAloud} className={`p-2 rounded-xl border border-white/10 bg-black/40 cursor-pointer ${isReading ? 'text-amber-400 animate-pulse' : 'text-zinc-400 hover:text-white'}`}>
              {isReading ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
            </button>
            {!isOwnPost && <button type="button" onClick={() => onOpenDM(post.username)} className="text-zinc-500 hover:text-cyan-400 p-2 bg-black/50 rounded-xl border border-white/10 cursor-pointer"><Mail className="w-4 h-4" /></button>}
            {isOwnPost && <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-zinc-500 hover:text-white p-2 bg-black/50 rounded-xl border border-white/10 cursor-pointer"><Edit3 className="w-4 h-4" /></button>}
            {isOwnPost && <button type="button" onClick={onDelete} className="text-zinc-500 hover:text-red-500 p-2 bg-black/50 rounded-xl border border-white/10 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>

        {isEditing ? (
          <div className="mb-5 bg-black/80 border border-white/10 rounded-2xl p-2">
             <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-transparent p-4 text-xs font-bold text-white focus:outline-none resize-none" rows={4} />
             <div className="flex justify-end gap-3 p-3 border-t border-white/10">
               <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-[10px] font-black uppercase text-zinc-500 hover:text-white cursor-pointer">Cancel</button>
               <button type="button" onClick={handleSaveEdit} className={`px-5 py-2.5 ${t.bg} text-black text-[10px] font-black uppercase rounded-xl cursor-pointer flex items-center gap-2`}><Save className="w-4 h-4"/> Update</button>
             </div>
          </div>
        ) : (
          <div className="mb-6">{renderFormattedText(post.content)}</div>
        )}

        {post.imageUrl && <div className="w-full rounded-3xl overflow-hidden border border-white/10 mb-6 shadow-xl"><img src={post.imageUrl} className="w-full h-auto object-cover max-h-[400px]" /></div>}

        <div className="flex items-center justify-between pt-5 border-t border-white/10 gap-4">
          <div className="flex gap-3">
            <button type="button" onClick={onVolt} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 ${post.volts > 0 ? "bg-amber-500 text-black" : "bg-black/50 border border-white/10 text-zinc-400 hover:text-amber-400"}`}>
              <Flame className="w-4 h-4" /> {post.volts || 0} Volts
            </button>
            <button type="button" onClick={() => setIsExpanded(!isExpanded)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 ${isExpanded ? `${t.bgSubtle} ${t.text} border ${t.borderSubtle}` : "bg-black/50 border border-white/10 text-zinc-400 hover:text-white"}`}>
              <MessageCircle className="w-4 h-4" /> {post.comments?.length || 0} Threads
            </button>
          </div>
          <button type="button" onClick={() => { if(navigator.share) navigator.share({title: post.username, text: post.content}); else { navigator.clipboard.writeText(post.content); triggerToast("Copied"); }}} className="p-2.5 bg-black/50 border border-white/10 text-zinc-400 hover:text-white rounded-xl cursor-pointer"><Share2 className="w-4 h-4" /></button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 overflow-hidden">
              {(isDiagnostics || post.isHelpNeeded) && (
                <button type="button" onClick={onAiTrigger} disabled={aiRunning} className="w-full mb-5 bg-amber-950/30 border border-amber-500/30 py-4 rounded-xl text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">
                  {aiRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Trigger AI Diagnostics
                </button>
              )}
              <div className="space-y-3.5 mb-5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {(!Array.isArray(post.comments) || post.comments.length === 0) ? <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center py-8 bg-black/40 border border-dashed border-white/10 rounded-3xl">No replies yet.</p> : (
                  post.comments.map((reply: any) => (
                    <div key={reply.id} className={`p-4 rounded-2xl border ${reply.isAI ? "bg-amber-950/20 border-amber-900/40" : "bg-black/50 border-white/10"}`}>
                      <div className="flex justify-between items-center mb-2 font-mono">
                        <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${reply.isAI ? "text-amber-400" : t.text}`}>
                          {reply.isAI && <Sparkles className="w-3 h-3" />} {reply.author}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-bold">{reply.time}</span>
                      </div>
                      <p className="text-zinc-300 text-xs font-medium">{reply.text}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePostComment()} placeholder="Transmit reply..." className="flex-1 w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none" />
                <button type="button" onClick={handlePostComment} disabled={!commentText.trim()} className={`${t.bg} shrink-0 disabled:opacity-50 text-black px-6 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center justify-center`}><Send className="w-4 h-4"/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}