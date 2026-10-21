import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  FocusMonitorStatus,
  DetectionState,
  FocusMonitorSettings,
  FocusEvent,
  MonitoringAggregateSummary,
  PerformanceMetrics,
  PerformancePreset,
} from '../types/focusMonitor';
import { focusMonitorService, DEFAULT_MONITOR_SETTINGS } from '../services/focusMonitorService';
import { useTimer } from './TimerContext';

interface FocusMonitorContextType {
  isEnabled: boolean;
  status: FocusMonitorStatus;
  detectionState: DetectionState;
  settings: FocusMonitorSettings;
  metrics: PerformanceMetrics;
  events: FocusEvent[];
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  enableMonitoring: () => Promise<void>;
  disableMonitoring: () => void;
  applyPreset: (preset: PerformancePreset) => void;
  updateSettings: (newSettings: Partial<FocusMonitorSettings>) => void;
  clearEvents: () => void;
  resetSessionData: () => void;
  getAggregateSummary: () => MonitoringAggregateSummary;
}

const DEFAULT_DETECTION_STATE: DetectionState = {
  personPresent: true,
  phoneVisible: false,
  personConfidence: 0,
  phoneConfidence: 0,
  lastUpdated: Date.now(),
};

const FocusMonitorContext = createContext<FocusMonitorContextType | undefined>(undefined);

export const FocusMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isRunning, isPaused } = useTimer();

  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [status, setStatus] = useState<FocusMonitorStatus>('idle');
  const [detectionState, setDetectionState] = useState<DetectionState>(DEFAULT_DETECTION_STATE);
  const [settings, setSettings] = useState<FocusMonitorSettings>(DEFAULT_MONITOR_SETTINGS);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => focusMonitorService.getMetrics());
  const [events, setEvents] = useState<FocusEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Subscribe to service status, detection, events, and performance metrics
  useEffect(() => {
    const unsubStatus = focusMonitorService.subscribeStatus((newStatus, error) => {
      setStatus(newStatus);
      if (error) setErrorMessage(error);
      else if (newStatus === 'active') setErrorMessage(null);
    });

    const unsubDetection = focusMonitorService.subscribeDetection((newDetection) => {
      setDetectionState(newDetection);
    });

    const unsubEvents = focusMonitorService.subscribeEvents((newEvent) => {
      setEvents((prev) => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
    });

    const unsubMetrics = focusMonitorService.subscribeMetrics((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubStatus();
      unsubDetection();
      unsubEvents();
      unsubMetrics();
    };
  }, []);

  // Sync with timer state: pause when timer paused, resume when timer running
  useEffect(() => {
    if (!isEnabled) return;

    if (isPaused) {
      focusMonitorService.pauseMonitoring();
    } else if (isRunning && status === 'paused') {
      focusMonitorService.resumeMonitoring();
    }
  }, [isPaused, isRunning, isEnabled, status]);

  // Reactively start monitoring whenever isEnabled becomes true and videoRef mounts
  useEffect(() => {
    if (!isEnabled) {
      focusMonitorService.stopMonitoring();
      return;
    }

    let isCancelled = false;

    const initCamera = async () => {
      // Poll briefly for videoRef.current to attach in DOM after render
      let attempts = 0;
      while (!videoRef.current && attempts < 30) {
        await new Promise((r) => setTimeout(r, 50));
        if (isCancelled) return;
        attempts++;
      }

      if (!videoRef.current || isCancelled) return;

      try {
        await focusMonitorService.startMonitoring(videoRef.current);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('FocusMonitor start failed:', err);
          setIsEnabled(false);
          setErrorMessage(err.message || 'Failed to start camera monitoring');
        }
      }
    };

    initCamera();

    return () => {
      isCancelled = true;
    };
  }, [isEnabled]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      focusMonitorService.stopMonitoring();
    };
  }, []);

  const enableMonitoring = async () => {
    setIsEnabled(true);
    setErrorMessage(null);
  };

  const disableMonitoring = () => {
    setIsEnabled(false);
    focusMonitorService.stopMonitoring();
  };

  const applyPreset = (preset: PerformancePreset) => {
    focusMonitorService.applyPreset(preset);
    setSettings(focusMonitorService.getSettings());
  };

  const updateSettings = (newSettings: Partial<FocusMonitorSettings>) => {
    focusMonitorService.updateSettings(newSettings);
    setSettings(focusMonitorService.getSettings());
  };

  const clearEvents = () => {
    focusMonitorService.clearEvents ? focusMonitorService.clearEvents() : undefined;
    setEvents([]);
  };

  const resetSessionData = () => {
    focusMonitorService.resetSessionData();
    setEvents([]);
  };

  const getAggregateSummary = () => {
    return focusMonitorService.getAggregateSummary();
  };

  return (
    <FocusMonitorContext.Provider
      value={{
        isEnabled,
        status,
        detectionState,
        settings,
        metrics,
        events,
        errorMessage,
        videoRef,
        enableMonitoring,
        disableMonitoring,
        applyPreset,
        updateSettings,
        clearEvents,
        resetSessionData,
        getAggregateSummary,
      }}
    >
      {children}
    </FocusMonitorContext.Provider>
  );
};

export const useFocusMonitor = (): FocusMonitorContextType => {
  const context = useContext(FocusMonitorContext);
  if (!context) {
    throw new Error('useFocusMonitor must be used within a FocusMonitorProvider');
  }
  return context;
};
