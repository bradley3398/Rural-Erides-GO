"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertOctagon, CheckCircle2, User, Key, Mail, Lock, 
  Loader2, Fingerprint, LogOut, UserPlus 
} from "lucide-react";

export default function AuthScreen(props: any) {
  const {
    authMode, setAuthMode, email, setEmail, password, setPassword,
    confirmPassword, setConfirmPassword, recoveryCode, setRecoveryCode,
    callsign, setCallsign, authError, setAuthError, authSuccess, setAuthSuccess,
    isProcessingAuth, handleAuthSubmit, handleGoogleSignIn,
    activeTheme, cornerStyle, performanceMode, reducedMotion, typographyClass, icon, triggerHaptic
  } = props;

  return (
    <div className={`min-h-screen bg-[#030305] flex items-center justify-center p-4 sm:p-6 text-zinc-100 ${typographyClass} relative overflow-hidden`}>
      {!performanceMode && <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${activeTheme.bg} opacity-10 rounded-full blur-[150px] pointer-events-none`}></div>}
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className={`bg-black/40 backdrop-blur-2xl border border-white/10 ${cornerStyle} p-6 sm:p-8 max-w-lg w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative z-10 flex flex-col my-8`}>
        <div className="flex flex-col items-center justify-center mb-6 shrink-0">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="relative mb-5 group">
            {!performanceMode && <div className={`absolute inset-0 ${activeTheme.bg} opacity-30 blur-xl rounded-full group-hover:opacity-40 transition-all`}></div>}
            <img src={icon} alt="Logo" className={`w-24 h-24 ${cornerStyle} border border-white/20 ${performanceMode ? '' : activeTheme.shadow} object-cover relative z-10`} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className={`text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradient} text-center leading-tight drop-shadow-sm`}>RURAL ERIDES GO</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="text-xs text-zinc-400 font-bold uppercase tracking-wider text-center mt-1 font-mono">Creator & Developer: Lord Bradley Callison</motion.p>
        </div>

        <AnimatePresence>
          {authError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 bg-red-950/40 border border-red-900/50 p-3 rounded-xl flex items-start gap-2 shadow-inner">
              <AlertOctagon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-400 font-bold leading-relaxed">{authError}</p>
            </motion.div>
          )}
          {authSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 bg-emerald-950/40 border border-emerald-900/50 p-3 rounded-xl flex items-start gap-2 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-400 font-bold leading-relaxed">{authSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <AnimatePresence>
            {authMode === "SIGNUP" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pb-4"><label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Rider Callsign (Username)</label><div className="relative"><User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" /><input type="text" required={authMode === "SIGNUP"} value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="e.g. CyberRider" className={`w-full bg-black/50 border border-white/10 ${cornerStyle} py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:${activeTheme.border} transition-all shadow-inner placeholder:text-zinc-600`}/></div></div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {authMode === "VERIFY_RECOVERY" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pb-4"><label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">6-Digit Recovery Code</label><div className="relative"><Key className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" /><input type="text" required={authMode === "VERIFY_RECOVERY"} value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="123456" className={`w-full bg-black/50 border border-white/10 ${cornerStyle} py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:${activeTheme.border} transition-all shadow-inner placeholder:text-zinc-600`}/></div></div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {authMode !== "VERIFY_RECOVERY" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-1"><label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Secure Email</label><div className="relative"><Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" /><input type="email" required={authMode !== "VERIFY_RECOVERY"} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pilot@network.com" className={`w-full bg-black/50 border border-white/10 ${cornerStyle} py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:${activeTheme.border} transition-all shadow-inner placeholder:text-zinc-600`}/></div></div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {authMode !== "FORGOT_PASSWORD" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-1"><label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">{authMode === "VERIFY_RECOVERY" ? "New Password" : "Access Code"}</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" /><input type="password" required={authMode !== "FORGOT_PASSWORD"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`w-full bg-black/50 border border-white/10 ${cornerStyle} py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:${activeTheme.border} transition-all shadow-inner placeholder:text-zinc-600`}/></div></div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(authMode === "SIGNUP" || authMode === "VERIFY_RECOVERY") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-4"><label className="text-[10px] font-black uppercase text-zinc-300 tracking-widest block mb-1.5">Confirm {authMode === "VERIFY_RECOVERY" ? "New Password" : "Access Code"}</label><div className="relative"><Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" /><input type="password" required={(authMode === "SIGNUP" || authMode === "VERIFY_RECOVERY")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full bg-black/50 border border-white/10 ${cornerStyle} py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:${activeTheme.border} transition-all shadow-inner placeholder:text-zinc-600`}/></div></div>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={isProcessingAuth} className={`w-full ${activeTheme.bg} text-black font-black uppercase tracking-widest py-4 ${cornerStyle} flex items-center justify-center gap-2 ${reducedMotion ? '' : 'active:scale-95 transition-all'} mt-4 disabled:opacity-50 font-mono cursor-pointer`}>{isProcessingAuth ? <Loader2 className={`w-5 h-5 ${reducedMotion ? '' : 'animate-spin'}`} /> : <Fingerprint className="w-5 h-5" />}{authMode === "LOGIN" ? "Establish Connection" : authMode === "FORGOT_PASSWORD" ? "Send Recovery Ping" : authMode === "VERIFY_RECOVERY" ? "Verify & Reset" : "Register Pilot & Boot"}</button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col items-center gap-4 w-full">
          <button type="button" onClick={handleGoogleSignIn} disabled={isProcessingAuth} className={`w-full bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-widest py-3.5 ${cornerStyle} flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg cursor-pointer disabled:opacity-50 text-xs font-mono`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.95H1.14v3.15C3.15 21.32 7.22 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.25c-.25-.72-.38-1.49-.38-2.25s.13-1.53.38-2.25V6.6H1.14C.41 8.08 0 9.75 0 12s.41 3.92 1.14 5.4l4.14-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.68 1.14 6.6l4.14 3.15c.95-2.84 3.6-4.95 6.72-4.95z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">or email authentication</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {authMode === "LOGIN" && (
            <>
              <button type="button" onClick={() => { triggerHaptic(); setAuthError(""); setAuthSuccess(""); setAuthMode("SIGNUP"); }} className={`w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest py-3.5 ${cornerStyle} flex items-center justify-center gap-2 transition-all active:scale-95 shadow-inner cursor-pointer text-xs`}>
                <UserPlus className="w-4 h-4"/> Create New Account
              </button>
              <button type="button" onClick={() => { triggerHaptic(); setAuthError(""); setAuthSuccess(""); setAuthMode("FORGOT_PASSWORD"); }} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mt-1 active:scale-95">
                Lost connection? Recover Password
              </button>
            </>
          )}
          
          {authMode === "SIGNUP" && (
            <button type="button" onClick={() => { triggerHaptic(); setAuthError(""); setAuthSuccess(""); setAuthMode("LOGIN"); }} className={`w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest py-3.5 ${cornerStyle} flex items-center justify-center gap-2 transition-all active:scale-95 shadow-inner cursor-pointer text-xs`}>
              <LogOut className="w-4 h-4"/> Return to Login
            </button>
          )}

          {(authMode === "FORGOT_PASSWORD" || authMode === "VERIFY_RECOVERY") && (
            <button type="button" onClick={() => { triggerHaptic(); setAuthError(""); setAuthSuccess(""); setAuthMode("LOGIN"); }} className={`w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest py-3.5 ${cornerStyle} flex items-center justify-center gap-2 transition-all active:scale-95 shadow-inner cursor-pointer text-xs`}>
              <LogOut className="w-4 h-4"/> Return to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}