import { useEffect } from 'react';
import { useTimer } from '../contexts/TimerContext';
import { formatMillisecondsToDisplay } from '../utils/formatTime';

/**
 * Custom hook to display live timer countdown or elapsed time in the browser tab title
 */
export function useDocumentTitle(): void {
  const { timer, isRunning, isPaused, elapsedMs, remainingMs } = useTimer();

  useEffect(() => {
    if (isRunning || isPaused) {
      const displayMs = timer.mode === 'stopwatch' ? elapsedMs : remainingMs;
      const formatted = formatMillisecondsToDisplay(displayMs).formatted;
      const statusIcon = isRunning ? '▶' : '❚❚';
      document.title = `${statusIcon} (${formatted}) ${timer.subject} | Study Discipline`;
    } else {
      document.title = 'Study Discipline | Modern Focus & Academic Productivity';
    }
  }, [timer, isRunning, isPaused, elapsedMs, remainingMs]);
}
