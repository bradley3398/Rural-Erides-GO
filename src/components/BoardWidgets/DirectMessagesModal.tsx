import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Search, Mail, ArrowLeft, Lock, CheckCheck, MapPin, ImagePlus, Mic, Send, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const getTimeMs = (ts: any) => {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
};

export default function DirectMessagesModal({
  showInbox, setShowInbox, activeDMUser, setActiveDMUser, username,
  newChatTarget, setNewChatTarget, inboxSearch, setInboxSearch, chatList,
  dms, themeColors
}: any) {
  if (!showInbox) return null;
  const t = themeColors;
  const dmEndRef = useRef<HTMLDivElement>(null);

  const [dmInput, setDmInput] = useState("");
  const [dmMediaFile, setDmMediaFile] = useState<any>(null);
  const [dmMediaPreview, setDmMediaPreview] = useState<string | null>(null);
  const [isRecordingDm, setIsRecordingDm] = useState(false);
  const [isUploadingDm, setIsUploadingDm] = useState(false);
  const dmFileInputRef = useRef<HTMLInputElement>(null);
  const dmAudioChunks = useRef<Blob[]>([]);
  const dmMediaRecorder = useRef<MediaRecorder | null>(null);

  const triggerHaptic = async (style: any = "LIGHT") => {
    try {
      if (Capacitor.isPluginAvailable('Haptics')) await Haptics.impact({ style });
      else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(15);
    } catch (e) {}
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDMUser || (!dmInput.trim() && !dmMediaFile)) return;
    const targetUser = String(activeDMUser || "").trim();
    if (!targetUser) return;
    
    const chatId = [username, targetUser].sort().join('_');
    setIsUploadingDm(true);
    triggerHaptic("LIGHT");
    
    try {
      let uploadedImgUrl = null;
      if (dmMediaFile) {
        const formData = new FormData();
        formData.append("image", dmMediaFile);
        const imgbbKey = import.meta.env.VITE_IMGBB_API_KEY as string; 
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) uploadedImgUrl = data.data.url; 
      }

      await addDoc(collection(db, "direct_messages"), {
        chatId, participants: [username, targetUser], sender: username,
        text: dmInput.trim(), imageUrl: uploadedImgUrl, audioData: null, location: null,
        timestamp: serverTimestamp(), readBy: [username]
      });

      await addDoc(collection(db, "user_notifications"), {
        recipient: targetUser, sender: username, type: 'DM',
        content: `sent you a secure private transmission`, read: false, timestamp: serverTimestamp()
      });

      setDmInput(""); setDmMediaFile(null); setDmMediaPreview(null);
    } catch (err) {
      alert("Failed to route DM.");
    } finally {
      setIsUploadingDm(false);
    }
  };

  const startDmRecording = async () => {
    try {
      triggerHaptic("LIGHT");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      dmMediaRecorder.current = mediaRecorder;
      dmAudioChunks.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) dmAudioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(dmAudioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const chatId = [username, activeDMUser].sort().join('_');
          await addDoc(collection(db, "direct_messages"), {
            chatId, participants: [username, activeDMUser], sender: username,
            text: "🎙️ Voice Transmission", imageUrl: null, audioData: base64Audio, location: null,
            timestamp: serverTimestamp(), readBy: [username]
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingDm(true);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopDmRecording = () => {
    if (dmMediaRecorder.current && isRecordingDm) {
      triggerHaptic("HEAVY");
      dmMediaRecorder.current.stop();
      setIsRecordingDm(false);
    }
  };

  const handleShareLocationInDm = async () => {
    triggerHaptic("MEDIUM");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const chatId = [username, activeDMUser].sort().join('_');
        await addDoc(collection(db, "direct_messages"), {
          chatId, participants: [username, activeDMUser], sender: username,
          text: "📍 Shared Tactical Location", location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          imageUrl: null, audioData: null, timestamp: serverTimestamp(), readBy: [username]
        });
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-black/90 border border-white/10 rounded-3xl w-full max-w-lg h-[85vh] flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] relative">
        
        {!activeDMUser ? (
          <>
            <div className="flex justify-between items-center p-5 border-b border-white/10 shrink-0 bg-white/5">
              <h3 className={`text-sm font-black uppercase tracking-widest text-white flex items-center gap-2`}><Mail className={`w-4 h-4 ${t.text}`}/> Secure Comms Array</h3>
              <button type="button" onClick={() => setShowInbox(false)} className="text-zinc-500 hover:text-white p-2 bg-black/50 rounded-full border border-white/10 cursor-pointer"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-4 border-b border-white/10 shrink-0 space-y-2.5">
              <form onSubmit={(e) => { e.preventDefault(); if(newChatTarget.trim()) { setActiveDMUser(newChatTarget.trim()); setNewChatTarget(""); } }} className="flex gap-2">
                <input type="text" value={newChatTarget} onChange={(e) => setNewChatTarget(e.target.value)} placeholder="Enter Pilot Callsign..." className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-white/30 shadow-inner" />
                <button type="submit" disabled={!newChatTarget.trim()} className={`${t.bg} text-black font-black uppercase tracking-widest px-4 rounded-xl text-[10px] cursor-pointer shadow-md disabled:opacity-50`}>Connect</button>
              </form>
              
              {chatList.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  <input type="text" value={inboxSearch} onChange={(e) => setInboxSearch(e.target.value)} placeholder="Search active conversations..." className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] font-bold text-white outline-none focus:border-white/30" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {chatList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest">
                  <Mail className="w-8 h-8 mb-2 opacity-50"/> Inbox Empty.
                </div>
              ) : (
                chatList.map((chat: any) => {
                  const isUnread = chat.lastMessage.sender !== username && (!chat.lastMessage.readBy || !chat.lastMessage.readBy.includes(username));
                  return (
                    <div key={chat.user} onClick={() => setActiveDMUser(String(chat.user || ""))} className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-inner flex items-center justify-between ${isUnread ? `${t.bgSubtle} ${t.borderSubtle}` : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                      <div className="min-w-0 pr-4">
                        <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${isUnread ? "text-white" : "text-zinc-300"}`}>{chat.user}</h4>
                        <p className={`text-[11px] truncate font-medium ${isUnread ? t.text : "text-zinc-500"}`}>{chat.lastMessage.sender === username ? "You: " : ""}{chat.lastMessage.text}</p>
                      </div>
                      {isUnread && <span className={`w-2.5 h-2.5 rounded-full ${t.bg} shrink-0 animate-pulse`}></span>}
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0 bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setActiveDMUser(null)} className="text-zinc-400 hover:text-white p-2 bg-black/40 border border-white/10 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4"/></button>
                <h3 className={`text-xs font-black uppercase tracking-widest text-white flex items-center gap-2`}>
                  <Lock className={`w-3.5 h-3.5 ${t.text}`}/> {activeDMUser}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
              {dms.filter((m: any) => m.chatId === [username, activeDMUser].sort().join('_')).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 font-mono text-[10px] uppercase font-bold tracking-widest text-center px-4">
                  Secure connection established. Initiate tactical comms.
                </div>
              ) : (
                dms.filter((m: any) => m.chatId === [username, activeDMUser].sort().join('_')).map((msg: any) => {
                    const isMe = msg.sender === username;
                    return (
                      <div key={msg.id} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-bold leading-relaxed shadow-lg ${isMe ? `${t.bg} text-black rounded-tr-sm` : 'bg-white/10 border border-white/10 text-white rounded-tl-sm'}`}>
                          {msg.imageUrl && <img src={msg.imageUrl} className="w-full h-auto max-h-48 object-cover rounded-xl mb-2 border border-black/20" alt="Attachment" />}
                          {msg.audioData && <audio src={msg.audioData} controls className="w-full h-8 mb-2 outline-none rounded-lg" />}
                          {msg.location && (
                             <a href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 p-2 rounded-xl mb-2 ${isMe ? 'bg-black/20 text-black hover:bg-black/30' : 'bg-black/40 text-cyan-400 hover:bg-black/50'} transition-colors cursor-pointer w-fit`}>
                               <MapPin className="w-4 h-4"/> View GPS Pin
                             </a>
                          )}
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                           <span className={`text-[8px] font-mono font-bold ${isMe ? 'text-zinc-500' : 'text-zinc-600'}`}>
                             {getTimeMs(msg.timestamp) > 0 ? new Date(getTimeMs(msg.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                           </span>
                           {isMe && msg.readBy && msg.readBy.length > 1 && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    )
                })
              )}
              <div ref={dmEndRef} />
            </div>

            <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
              {["On my way! 🚀", "Copy that 👍", "See you at the trail! 🌲"].map((chip, cIdx) => (
                <button key={cIdx} type="button" onClick={() => setDmInput(chip)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 cursor-pointer">
                  {chip}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-white/10 shrink-0 bg-black/60 space-y-2">
              {dmMediaPreview && (
                 <div className="relative w-16 h-16 rounded-xl border border-white/20 overflow-hidden shadow-lg">
                   <img src={dmMediaPreview} className="w-full h-full object-cover" />
                   <button type="button" onClick={() => { setDmMediaFile(null); setDmMediaPreview(null); }} className="absolute top-1 right-1 bg-black/80 rounded-full p-0.5 text-white cursor-pointer"><X className="w-3 h-3"/></button>
                 </div>
              )}
              <form onSubmit={handleSendDM} className="flex gap-2 items-center">
                <div className="flex gap-1 shrink-0">
                  <input type="file" accept="image/*" ref={dmFileInputRef} onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                         setDmMediaFile(e.target.files[0]);
                         setDmMediaPreview(URL.createObjectURL(e.target.files[0]));
                      }
                  }} className="hidden" />
                  <button type="button" onClick={() => dmFileInputRef.current?.click()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 cursor-pointer"><ImagePlus className="w-4 h-4"/></button>
                  <button type="button" onClick={handleShareLocationInDm} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 cursor-pointer"><MapPin className="w-4 h-4"/></button>
                </div>
                
                <input type="text" value={dmInput} onChange={(e) => setDmInput(e.target.value)} placeholder="Transmit secure message..." className="flex-1 min-w-0 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none" />
                
                {dmInput.trim() || dmMediaFile ? (
                  <button type="submit" disabled={isUploadingDm} className={`${t.bg} text-black px-4 h-[44px] rounded-xl font-black uppercase text-[10px] flex items-center justify-center cursor-pointer`}>
                    {isUploadingDm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4"/>}
                  </button>
                ) : (
                  <button type="button" onMouseDown={startDmRecording} onMouseUp={stopDmRecording} onMouseLeave={stopDmRecording} onTouchStart={startDmRecording} onTouchEnd={stopDmRecording} className={`px-4 h-[44px] rounded-xl font-black uppercase flex items-center justify-center cursor-pointer ${isRecordingDm ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-zinc-300'}`}>
                    <Mic className="w-4 h-4"/>
                  </button>
                )}
              </form>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}