export type FocusMonitorStatus =
  | 'idle'
  | 'requesting_permission'
  | 'loading_model'
  | 'active'
  | 'paused'
  | 'tab_hidden'
  | 'permission_denied'
  | 'unsupported'
  | 'error';

export type PerformancePreset = 'standard' | 'low_resource' | 'custom';
export type InferenceResolution = '320x240' | '640x360';

export interface BoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface DetectionState {
  personPresent: boolean;
  phoneVisible: boolean;
  personConfidence: number;
  phoneConfidence: number;
  lastUpdated: number;
  phoneBox?: BoundingBox | null;
  personBox?: BoundingBox | null;
}

export interface FocusMonitorSettings {
  preset: PerformancePreset;
  resolution: InferenceResolution;
  sampleIntervalMs: number; // standard: 500ms (2 FPS), low_resource: 1000ms (1 FPS)
  personConfidenceThreshold: number; // default: 0.45
  phoneConfidenceThreshold: number; // default: 0.45
  checkPerson: boolean; // default: true
  checkPhone: boolean; // default: true
  alertCooldownSeconds: number; // default: 8s
  adaptivePerformance: boolean; // default: true
}

export interface PerformanceMetrics {
  lastInferenceMs: number;
  avgInferenceMs: number;
  effectiveFps: number;
  droppedFrames: number;
  isAdaptivelyThrottled: boolean;
  currentResolution: InferenceResolution;
  pixelCount: number;
}

export interface FocusEvent {
  id: string;
  type: 'person_absent' | 'phone_detected';
  timestamp: string; // ISO string
  confidence: number;
  message: string;
}

export interface MonitoringAggregateSummary {
  totalMonitoredSeconds: number;
  personPresentPercent: number;
  absenceIncidentCount: number;
  phoneVisibleCount: number;
  totalSamples: number;
  personPresentSamples: number;
  averageInferenceMs?: number;
  peakInferenceMs?: number;
  presetUsed?: PerformancePreset;
}
