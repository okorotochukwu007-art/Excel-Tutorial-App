import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  FileVideo,
  Clock,
  HelpCircle,
  Play,
  Apple,
} from 'lucide-react';

export interface VideoDownloadTarget {
  videoId: string;
  title: string;
  channelTitle?: string;
  durationFormatted?: string;
  thumbnailUrl?: string;
  lessonTitle?: string;
}

interface VideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoDownloadTarget | null;
}

export const VideoDownloadModal: React.FC<VideoDownloadModalProps> = ({
  isOpen,
  onClose,
  video,
}) => {
  const [deviceTab, setDeviceTab] = useState<'android' | 'iphone'>('android');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !video || !video.videoId) {
    return null;
  }

  const cleanVideoId = encodeURIComponent(video.videoId.trim());
  const youtubeUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

  // Download links optimized for mobile phones
  const savefromUrl = `https://www.ssyoutube.com/watch?v=${cleanVideoId}`;
  const tenDownloaderUrl = `https://10downloader.com/download?v=https://www.youtube.com/watch?v=${cleanVideoId}`;
  const y2mateUrl = `https://www.y2mate.com/youtube/${cleanVideoId}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(youtubeUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = youtubeUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  const handleOpenLink = (url: string) => {
    // Open in new tab/window for direct download
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-download-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="video-download-modal-title"
                className="text-base font-bold flex items-center gap-2"
              >
                <span>Download Video (.MP4)</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase">
                  Mobile Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Direct to your phone or computer for offline learning
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close download modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Video Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
            <div className="relative w-24 h-16 sm:w-28 sm:h-18 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
              <img
                src={
                  video.thumbnailUrl ||
                  `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
                }
                alt={video.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-semibold">
                MP4
              </span>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-800 font-semibold">
                <FileVideo className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">
                  {video.lessonTitle || 'Lesson Tutorial'}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                {video.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                {video.channelTitle && (
                  <span className="truncate">{video.channelTitle}</span>
                )}
                {video.durationFormatted && video.durationFormatted !== 'N/A' && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    {video.durationFormatted}
                  </span>
                )}
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                  720p HD
                </span>
              </div>
            </div>
          </div>

          {/* Direct Download Action Buttons */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>Tap a Button Below to Download MP4 to Phone:</span>
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Direct MP4
              </span>
            </div>

            {/* Primary Download Button: SaveFrom Direct Mobile */}
            <button
              type="button"
              onClick={() => handleOpenLink(savefromUrl)}
              className="w-full p-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-between gap-3 group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>⚡ Direct Fast MP4 Download (Recommended)</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/25 text-white text-[10px] font-mono uppercase">
                      Fastest
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-100 font-normal">
                    One-tap mobile download — saves 720p/360p MP4 directly into your phone
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-200 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Alternative HD Mirror 1: 10Downloader */}
            <button
              type="button"
              onClick={() => handleOpenLink(tenDownloaderUrl)}
              className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center shrink-0 text-emerald-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Option 2: 10Downloader HD MP4 Mirror</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-mono">
                      No Ads
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Clean high-speed MP4 download link with multiple resolution options
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Alternative Mirror 2: Y2Mate */}
            <button
              type="button"
              onClick={() => handleOpenLink(y2mateUrl)}
              className="w-full p-3 rounded-xl bg-[#FAF9F5] hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    Option 3: Y2Mate Mobile MP4 Mirror
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Alternative reliable mirror if other download links are busy
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          </div>

          {/* Copy Video Link for Downloader Apps (VidMate, SnapTube, Chrome, etc.) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                Copy Direct Video Link (For Download Apps):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                VidMate · SnapTube · TubeMate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={youtubeUrl}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 select-all focus:outline-emerald-600"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Link copied to clipboard! You can paste it into your preferred mobile downloader app or browser.
              </p>
            )}
          </div>

          {/* Step-by-Step Instructions for Mobile Phone Users */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 p-2 flex items-center justify-between border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 px-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>How to Save to Your Phone:</span>
              </span>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeviceTab('android')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    deviceTab === 'android'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Android</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('iphone')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    deviceTab === 'iphone'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Apple className="w-3 h-3" />
                  <span>iPhone / iPad</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-white text-xs space-y-2">
              {deviceTab === 'android' ? (
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                  <li>
                    Tap <strong>⚡ Direct Fast MP4 Download</strong> above.
                  </li>
                  <li>
                    Select <strong>MP4 (720p or 360p)</strong> from the quality choices.
                  </li>
                  <li>
                    Tap <strong>Download</strong>. Your Android phone will save the video directly to your <strong>Downloads</strong> folder.
                  </li>
                  <li>
                    You can open and play it anytime from your phone's <strong>Gallery</strong>, <strong>Google Files</strong>, or <strong>VLC Player</strong> without using data!
                  </li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                  <li>
                    Tap <strong>⚡ Direct Fast MP4 Download</strong> above in Safari.
                  </li>
                  <li>
                    Select <strong>MP4</strong>, then tap <strong>Download</strong> on the Safari pop-up message.
                  </li>
                  <li>
                    The video saves into your iPhone's <strong>Files app &rarr; Downloads</strong>.
                  </li>
                  <li>
                    To move it to your Photos/Camera Roll: open the video in <strong>Files</strong>, tap the <strong>Share</strong> button at bottom-left, and tap <strong>Save Video</strong>!
                  </li>
                </ol>
              )}
            </div>
          </div>

          {/* Benefits Callout */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Offline Learning Guarantee</div>
              <p className="text-emerald-900 text-[11px] leading-relaxed">
                Downloaded MP4 videos can be watched repeatedly without internet connection or phone data charges. Perfect for practicing formulas and reviewing lessons at your own pace!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>MP4 Format · Compatible with all mobile devices</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
