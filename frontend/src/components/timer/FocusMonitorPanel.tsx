import React from 'react';
import {
  Camera,
  CameraOff,
  Smartphone,
  RefreshCw,
  XCircle,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { useFocusMonitor } from '../../contexts/FocusMonitorContext';
import { PerformancePreset } from '../../types/focusMonitor';

export const FocusMonitorPanel: React.FC = () => {
  const {
    isEnabled,
    status,
    detectionState,
    settings,
    errorMessage,
    videoRef,
    enableMonitoring,
    disableMonitoring,
    applyPreset,
  } = useFocusMonitor();

  const handleToggle = () => {
    if (isEnabled) {
      disableMonitoring();
    } else {
      enableMonitoring();
    }
  };

  const handlePresetSelect = (preset: PerformancePreset) => {
    applyPreset(preset);
  };

  return (
    <div className="w-full clay-inset rounded-[20px] p-2.5 space-y-2 transition-all text-slate-800">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              isEnabled
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/80 text-slate-600 shadow-xs'
            }`}
          >
            <Camera className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-black text-[11px] text-slate-900 leading-none">Focus Monitor</span>
            </div>
            <p className="text-[9px] text-slate-400 font-medium leading-tight truncate">
              Optional on-device presence & distraction detection
            </p>
          </div>
        </div>

        {/* Quick Stop Switch when enabled */}
        {isEnabled && (
          <button
            onClick={disableMonitoring}
            className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0 flex items-center gap-0.5"
            title="Turn Off Camera"
          >
            <CameraOff className="w-2.5 h-2.5" />
            <span>Off</span>
          </button>
        )}
      </div>

      {/* Mode Preset Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
          <span>Mode Preset:</span>
        </div>
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-white/70 rounded-lg border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => handlePresetSelect('standard')}
            className={`py-1 px-1 rounded-md text-[9px] font-bold transition-all text-center truncate ${
              settings.preset === 'standard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standard (2 FPS)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('low_resource')}
            className={`py-1 px-1 rounded-md text-[9px] font-bold transition-all text-center truncate ${
              settings.preset === 'low_resource'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low Resource (~1 FPS)
          </button>
        </div>
      </div>

      {/* When Inactive: Catch Warning & Enable Button */}
      {!isEnabled && (
        <div className="space-y-1.5 pt-0.5">
          {/* Mobile phone detection catch warning */}
          <div className="px-2 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 flex items-center gap-1.5 shadow-2xs">
            <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[10px] font-semibold leading-tight">
              Phone usage detected = Alarm rings!
            </span>
          </div>

          {/* Direct Camera Allow Action Button */}
          <button
            onClick={handleToggle}
            className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Enable Monitor</span>
          </button>
        </div>
      )}

      {/* When Requesting Permission or Loading */}
      {isEnabled && (status === 'requesting_permission' || status === 'loading_model') && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10px] flex items-center gap-1.5 animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
          <span className="font-semibold truncate">
            {status === 'requesting_permission'
              ? 'Click "Allow" on camera prompt...'
              : 'Loading AI model...'}
          </span>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[9px] flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <button
            onClick={enableMonitoring}
            className="font-bold underline hover:text-rose-950 ml-1 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* When Active: Live Video Viewfinder & Status */}
      {isEnabled && (
        <div className="space-y-1.5">
          {/* Video Viewfinder */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200/90 aspect-video max-h-[105px] shadow-inner flex items-center justify-center w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {/* Overlays on top of Video */}
            <div className="absolute top-1 left-1 right-1 flex items-center justify-between gap-1 z-10 pointer-events-none">
              {detectionState.phoneVisible ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-md animate-bounce ring-1 ring-white">
                  <Smartphone className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>PHONE DETECTED! ALARM!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Active</span>
                </span>
              )}

              <span className="px-1 py-0.2 rounded bg-black/60 text-white/80 text-[8px] font-mono backdrop-blur-xs">
                {detectionState.personPresent ? '👤 In View' : '👤 Away'}
              </span>
            </div>

            {/* Dynamic Phone Bounding Box Overlay */}
            {detectionState.phoneVisible && detectionState.phoneBox && (
              <div
                className="absolute border-2 border-rose-500 bg-rose-500/20 rounded pointer-events-none z-10 shadow-lg"
                style={{
                  right: `${(detectionState.phoneBox.originX / (videoRef.current?.videoWidth || 640)) * 100}%`,
                  top: `${(detectionState.phoneBox.originY / (videoRef.current?.videoHeight || 480)) * 100}%`,
                  width: `${(detectionState.phoneBox.width / (videoRef.current?.videoWidth || 640)) * 100}%`,
                  height: `${(detectionState.phoneBox.height / (videoRef.current?.videoHeight || 480)) * 100}%`,
                }}
              >
                <span className="absolute -top-4 right-0 bg-rose-600 text-white text-[8px] font-black px-1 rounded shadow-xs whitespace-nowrap">
                  📱 Phone
                </span>
              </div>
            )}
          </div>

          {/* Alarm Status Banner */}
          {detectionState.phoneVisible && (
            <div className="p-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
              <Volume2 className="w-3 h-3 text-rose-600 animate-bounce shrink-0" />
              <span>Alarm sounding! Put phone away.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
