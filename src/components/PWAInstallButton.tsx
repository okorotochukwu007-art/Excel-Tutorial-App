import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'hero' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA standalone app, suppress button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop standard install
  if (isInstallable) {
    if (variant === 'hero') {
      return (
        <button
          type="button"
          onClick={install}
          className={`px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2.5 cursor-pointer text-sm ${className}`}
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>Install Excel Academy App</span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <div className={`p-4 bg-emerald-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 border border-emerald-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="font-bold text-sm">Install Excel Academy App</div>
              <div className="text-xs text-emerald-200">
                Access your lessons, formula practice, and progress directly from your phone home screen!
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={install}
            className="px-4 py-2 bg-emerald-400 text-emerald-950 font-bold rounded-lg hover:bg-emerald-300 transition-colors text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install Now</span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-emerald-300" />
        <span>Install Mobile App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by WebKit)
  if (isIOS) {
    return (
      <>
        {variant === 'banner' ? (
          <div className={`p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${className}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-sm">Install on iPhone / iPad</div>
                <div className="text-xs text-slate-300">
                  Add TK the Analyst Academy to your home screen for quick mobile access.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get iOS App</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700 ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Install on iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    TK
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-emerald-700" /> in your Safari bottom navigation bar.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner to place Excel Academy on your phone home screen!
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
