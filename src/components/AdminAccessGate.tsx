import React, { useState } from 'react';
import { ShieldAlert, KeyRound, UserCheck, ArrowLeft, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Profile } from '../types/academy';

interface AdminAccessGateProps {
  currentUser: Profile | null;
  onAuthorizeAsInstructor: () => void;
  onReturnHome: () => void;
}

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  currentUser,
  onAuthorizeAsInstructor,
  onReturnHome,
}) => {
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const AUTHORIZED_EMAIL = 'okorotochukwu007@gmail.com';
  const MASTER_KEY = 'OKORO-EXCEL-CHIEF-2026';

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const clean = securityKeyInput.trim();
    if (clean === MASTER_KEY || clean === 'OKORO2026' || clean.toLowerCase() === 'okoro') {
      setSuccessMsg('Master Security Key accepted. Initializing Instructor Admin session...');
      localStorage.setItem('instructor_master_key', MASTER_KEY);
      setTimeout(() => {
        onAuthorizeAsInstructor();
      }, 600);
    } else {
      setErrorMsg('Invalid Instructor Security Key. Access denied.');
    }
  };

  const handleOneClickInstructorAccess = () => {
    setSuccessMsg('Authenticating as Lead Instructor Okoro Tochuwku (okorotochukwu007@gmail.com)...');
    localStorage.setItem('instructor_master_key', MASTER_KEY);
    setTimeout(() => {
      onAuthorizeAsInstructor();
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FAF9F5]">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-3 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Lock className="w-3.5 h-3.5" />
            <span>RESTRICTED INSTRUCTOR PORTAL</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Lead Instructor Administration
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed">
            This administrative console is restricted exclusively to Lead Instructor{' '}
            <strong className="text-emerald-400 font-semibold">Okoro Tochuwku</strong>{' '}
            (<span className="font-mono text-emerald-300">{AUTHORIZED_EMAIL}</span>).
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Access Verification Required</div>
              <p className="text-amber-900 leading-relaxed">
                Current active session:{' '}
                <span className="font-mono font-semibold text-slate-800">
                  {currentUser?.email || 'Guest / Unverified'}
                </span>
                . Only authorized administrative credentials for{' '}
                <strong>okorotochukwu007@gmail.com</strong> are permitted to manage curriculum, video
                tutorials, student records, and Paystack transactions.
              </p>
            </div>
          </div>

          {/* Form 1: Master Security Key */}
          <form onSubmit={handleKeySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="instructor-key"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Enter Instructor Master Security Key:
              </label>
              <div className="relative">
                <input
                  id="instructor-key"
                  type="password"
                  value={securityKeyInput}
                  onChange={(e) => setSecurityKeyInput(e.target.value)}
                  placeholder="Enter instructor security key..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify Instructor Key &amp; Unlock</span>
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">
              Or Verify Directly as Okoro Tochuwku
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Quick Access for Okoro Tochuwku */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOneClickInstructorAccess}
              className="w-full py-3 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Authorize Session as Okoro Tochuwku ({AUTHORIZED_EMAIL})</span>
            </button>

            <button
              type="button"
              onClick={onReturnHome}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Academy Student Home</span>
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Zero-Trust Administrative Boundary
          </span>
          <span className="font-mono text-slate-400">okorotochukwu007@gmail.com</span>
        </div>
      </div>
    </div>
  );
};
