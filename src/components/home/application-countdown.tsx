'use client';

import { useState, useEffect } from 'react';
import { APPLICATION_CLOSE, APPLICATION_DEADLINE_LABEL } from '@/lib/application';

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    diff,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function ApplicationCountdown() {
  const target = APPLICATION_CLOSE.getTime();
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(() => getRemaining(target));

  useEffect(() => {
    setMounted(true);
    setRemaining(getRemaining(target));
    const id = setInterval(() => setRemaining(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Only render on the client (the value depends on the current time) and only
  // while applications are still open — cleanly disappears once time runs out.
  if (!mounted || remaining.diff <= 0) return null;

  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hrs', value: remaining.hours },
    { label: 'Min', value: remaining.minutes },
    { label: 'Sec', value: remaining.seconds },
  ];

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
        Applications close in
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        {units.map((u) => (
          <div
            key={u.label}
            className="flex min-w-[58px] flex-col items-center rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 sm:min-w-[68px]"
          >
            <span className="font-headline text-2xl font-black tabular-nums text-primary sm:text-3xl">
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {u.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-medium text-muted-foreground/70">
        Deadline: {APPLICATION_DEADLINE_LABEL}
      </p>
    </div>
  );
}
