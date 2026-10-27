'use client';

import { useSyncExternalStore } from 'react';

interface CountdownTimerProps {
  endsAt: string | Date;
  className?: string;
  onEnded?: () => void;
}

function subscribe(callback: () => void) {
  const timer = setInterval(callback, 1000);
  return () => clearInterval(timer);
}

function getSnapshot(endsAtTime: number) {
  const now = Date.now();
  const diff = endsAtTime - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, isEnded: false };
}

// Fixed server snapshot prevents any hydration mismatch
const serverSnapshot = { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false };

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
  const endsAtTime = new Date(endsAt).getTime();

  const { days, hours, minutes, seconds, isEnded } = useSyncExternalStore(
    subscribe,
    () => getSnapshot(endsAtTime),
    () => serverSnapshot
  );

  if (isEnded) {
    return (
      <span className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider text-destructive ${className || ''}`}>
        Subasta Finalizada
      </span>
    );
  }

  const isEndingSoon = days === 0 && hours === 0 && minutes < 5;

  return (
    <div className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${isEndingSoon ? 'animate-pulse text-amber-500' : 'text-foreground'} ${className || ''}`}>
      {days > 0 && <span>{days}d </span>}
      <span>{String(hours).padStart(2, '0')}h </span>
      <span>{String(minutes).padStart(2, '0')}m </span>
      <span>{String(seconds).padStart(2, '0')}s</span>
    </div>
  );
}
