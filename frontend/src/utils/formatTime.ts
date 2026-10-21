/**
 * Time and date formatting utilities for Study Discipline
 */

export function formatSecondsToHMS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatMillisecondsToDisplay(ms: number, showMs: boolean = false): {
  hoursStr: string;
  minutesStr: string;
  secondsStr: string;
  millisecondsStr: string;
  formatted: string;
} {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  const hoursStr = pad(hours);
  const minutesStr = pad(minutes);
  const secondsStr = pad(seconds);
  const millisecondsStr = pad(centiseconds);

  let formatted = '';
  if (hours > 0) {
    formatted = `${hoursStr}:${minutesStr}:${secondsStr}`;
  } else {
    formatted = `${minutesStr}:${secondsStr}`;
  }

  if (showMs) {
    formatted += `.${millisecondsStr}`;
  }

  return {
    hoursStr,
    minutesStr,
    secondsStr,
    millisecondsStr,
    formatted,
  };
}

export function formatDurationHuman(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

export function formatDateLabel(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatTimeOfDay(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
