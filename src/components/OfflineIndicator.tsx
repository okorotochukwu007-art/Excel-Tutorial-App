import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-bold shadow-2xl border border-amber-500 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
      <span>Offline Mode — Using Cached Data</span>
    </div>
  );
};
