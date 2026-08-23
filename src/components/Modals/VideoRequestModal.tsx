"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video, X, Loader2, Send } from "lucide-react";

export default function VideoRequestModal(props: any) {
  const {
    showRequestModal, setShowRequestModal,
    requestTitle, setRequestTitle,
    requestPevClass, setRequestPevClass,
    isSubmittingRequest, handleSendVideoRequest
  } = props;

  if (!showRequestModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl relative">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" /> Request a Video Test
            </h3>
            <button type="button" onClick={() => setShowRequestModal(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block mb-1">What would you like to see tested?</label>
              <textarea 
                value={requestTitle} 
                onChange={(e) => setRequestTitle(e.target.value)} 
                placeholder="e.g., Test the Aostirmotor A20 range on steep gravel hills..." 
                rows={3}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 font-bold resize-none shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest block mb-1">Vehicle Class</label>
              <select 
                value={requestPevClass} 
                onChange={(e) => setRequestPevClass(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500 font-bold cursor-pointer shadow-inner"
              >
                <option value="Class 1 E-Bike" className="bg-black">Class 1 E-Bike</option>
                <option value="Class 2 E-Bike" className="bg-black">Class 2 E-Bike</option>
                <option value="Class 3 E-Bike" className="bg-black">Class 3 E-Bike</option>
                <option value="Electric Scooter" className="bg-black">Electric Scooter</option>
                <option value="Electric Moped" className="bg-black">Electric Moped</option>
                <option value="Electric Unicycle" className="bg-black">Electric Unicycle</option>
                <option value="Electric Trike" className="bg-black">Electric Trike</option>
                <option value="Onewheel" className="bg-black">Onewheel</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowRequestModal(false)} className="bg-zinc-900 text-zinc-300 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] cursor-pointer active:scale-95 transition-all">Cancel</button>
              <button type="button" onClick={handleSendVideoRequest} disabled={isSubmittingRequest || !requestTitle.trim()} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 transition-all shadow-md">
                {isSubmittingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit Request
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}