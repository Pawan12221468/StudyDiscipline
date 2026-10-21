import {
  FocusMonitorStatus,
  DetectionState,
  FocusMonitorSettings,
  FocusEvent,
  MonitoringAggregateSummary,
  PerformancePreset,
  PerformanceMetrics,
  BoundingBox,
} from '../types/focusMonitor';
import { soundAlerts } from '../utils/soundAlerts';

export const PRESET_CONFIGS: Record<PerformancePreset, Partial<FocusMonitorSettings>> = {
  standard: {
    preset: 'standard',
    resolution: '320x240',
    sampleIntervalMs: 500, // 2 FPS
    adaptivePerformance: true,
  },
  low_resource: {
    preset: 'low_resource',
    resolution: '320x240',
    sampleIntervalMs: 1000, // 1 FPS
    adaptivePerformance: true,
  },
  custom: {
    preset: 'custom',
  },
};

export const DEFAULT_MONITOR_SETTINGS: FocusMonitorSettings = {
  preset: 'standard',
  resolution: '640x360',
  sampleIntervalMs: 500, // 2 FPS baseline
  personConfidenceThreshold: 0.35,
  phoneConfidenceThreshold: 0.25, // Lowered for high sensitivity on handheld mobile phones
  checkPerson: true,
  checkPhone: true,
  alertCooldownSeconds: 8,
  adaptivePerformance: true,
};

type StatusListener = (status: FocusMonitorStatus, errorMessage?: string) => void;
type DetectionListener = (detection: DetectionState) => void;
type EventListener = (event: FocusEvent) => void;
type MetricsListener = (metrics: PerformanceMetrics) => void;

class FocusMonitorService {
  private status: FocusMonitorStatus = 'idle';
  private settings: FocusMonitorSettings = { ...DEFAULT_MONITOR_SETTINGS };
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private detector: any = null; // ObjectDetector from @mediapipe/tasks-vision
  private isModelLoading: boolean = false;
  private inferenceTimer: any = null;
  private isProcessingFrame: boolean = false;

  // Reusable Off-screen Canvas for low-resolution downscaled inference input
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  // Smoothing buffers (last 3 samples)
  private personHistory: boolean[] = [];
  private phoneHistory: boolean[] = [];

  // Cooldown timers
  private lastAbsenceAlertTime: number = 0;
  private lastPhoneAlertTime: number = 0;

  // Previous emitted detection state (for React state update throttling)
  private lastEmittedDetection: DetectionState | null = null;
  private lastDetectionEmitTime: number = 0;

  // Adaptive Performance & Metrics
  private lastInferenceDurationMs: number = 0;
  private avgInferenceDurationMs: number = 0;
  private peakInferenceDurationMs: number = 0;
  private slowFramesStreak: number = 0;
  private fastFramesStreak: number = 0;
  private isAdaptivelyThrottled: boolean = false;
  private currentEffectiveIntervalMs: number = 500;
  private droppedFramesCount: number = 0;

  // Aggregate tracking
  private totalSamples: number = 0;
  private personPresentSamples: number = 0;
  private absenceIncidents: number = 0;
  private phoneVisibleIncidents: number = 0;
  private monitoringStartTime: number | null = null;
  private accumulatedMonitoredMs: number = 0;

  // Listeners
  private statusListeners: Set<StatusListener> = new Set();
  private detectionListeners: Set<DetectionListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();
  private metricsListeners: Set<MetricsListener> = new Set();

  constructor() {
    this.currentEffectiveIntervalMs = this.settings.sampleIntervalMs;

    // Initialize reusable off-screen canvas once
    if (typeof document !== 'undefined') {
      this.initOffscreenCanvas();
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private initOffscreenCanvas() {
    if (this.offscreenCanvas) return;
    this.offscreenCanvas = document.createElement('canvas');
    const [w, h] = this.getResolutionDimensions();
    this.offscreenCanvas.width = w;
    this.offscreenCanvas.height = h;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      willReadFrequently: false,
      alpha: false,
    });
  }

  private getResolutionDimensions(): [number, number] {
    if (this.settings.resolution === '640x360') {
      return [640, 360];
    }
    return [320, 240];
  }

  private updateCanvasDimensions() {
    if (!this.offscreenCanvas) return;
    const [w, h] = this.getResolutionDimensions();
    if (this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
    }
  }

  public getStatus(): FocusMonitorStatus {
    return this.status;
  }

  public getSettings(): FocusMonitorSettings {
    return { ...this.settings };
  }

  public applyPreset(preset: PerformancePreset) {
    const config = PRESET_CONFIGS[preset];
    this.settings = { ...this.settings, ...config };
    this.currentEffectiveIntervalMs = this.settings.sampleIntervalMs;
    this.isAdaptivelyThrottled = false;
    this.updateCanvasDimensions();
    this.emitMetrics();
  }

  public updateSettings(newSettings: Partial<FocusMonitorSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.sampleIntervalMs) {
      this.currentEffectiveIntervalMs = newSettings.sampleIntervalMs;
      this.isAdaptivelyThrottled = false;
    }
    if (newSettings.resolution) {
      this.updateCanvasDimensions();
    }
    this.emitMetrics();
  }

  public getMetrics(): PerformanceMetrics {
    const [w, h] = this.getResolutionDimensions();
    const effectiveFps =
      this.status === 'active' && this.currentEffectiveIntervalMs > 0
        ? Math.round((1000 / this.currentEffectiveIntervalMs) * 10) / 10
        : 0;

    return {
      lastInferenceMs: this.lastInferenceDurationMs,
      avgInferenceMs: Math.round(this.avgInferenceDurationMs),
      effectiveFps,
      droppedFrames: this.droppedFramesCount,
      isAdaptivelyThrottled: this.isAdaptivelyThrottled,
      currentResolution: this.settings.resolution,
      pixelCount: w * h,
    };
  }

  public subscribeStatus(cb: StatusListener): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  public subscribeDetection(cb: DetectionListener): () => void {
    this.detectionListeners.add(cb);
    return () => this.detectionListeners.delete(cb);
  }

  public subscribeEvents(cb: EventListener): () => void {
    this.eventListeners.add(cb);
    return () => this.eventListeners.delete(cb);
  }

  public subscribeMetrics(cb: MetricsListener): () => void {
    this.metricsListeners.add(cb);
    cb(this.getMetrics());
    return () => this.metricsListeners.delete(cb);
  }

  private setStatus(status: FocusMonitorStatus, errorMessage?: string) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status, errorMessage));
    this.emitMetrics();
  }

  private emitMetrics() {
    const metrics = this.getMetrics();
    this.metricsListeners.forEach((listener) => listener(metrics));
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      if (this.status === 'active') {
        if (this.inferenceTimer) {
          clearTimeout(this.inferenceTimer);
          this.inferenceTimer = null;
        }
        this.setStatus('tab_hidden');
      }
    } else {
      if (this.status === 'tab_hidden') {
        this.setStatus('active');
        this.scheduleNextInference();
      }
    }
  };

  /**
   * Lazy load the MediaPipe ObjectDetector model asset only when explicitly needed
   */
  public async loadModel(): Promise<void> {
    if (this.detector) return;
    if (this.isModelLoading) return;

    this.isModelLoading = true;
    this.setStatus('loading_model');

    try {
      const { FilesetResolver, ObjectDetector } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        // Try GPU delegate first for maximum performance and offloaded CPU
        this.detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'GPU',
          },
          scoreThreshold: 0.20, // Lower threshold so candidate phone detections are never pruned early
          runningMode: 'VIDEO',
        });
      } catch (gpuErr) {
        console.warn('MediaPipe GPU delegate unavailable, falling back to CPU delegate:', gpuErr);
        this.detector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
            delegate: 'CPU',
          },
          scoreThreshold: 0.20,
          runningMode: 'VIDEO',
        });
      }

      this.isModelLoading = false;
    } catch (err: any) {
      this.isModelLoading = false;
      console.error('Failed to initialize MediaPipe ObjectDetector:', err);
      this.setStatus('error', `Failed to load on-device vision model: ${err.message || 'Network or WebAssembly error'}`);
      throw err;
    }
  }

  /**
   * Start local camera stream and attach to video element
   */
  public async startMonitoring(videoEl: HTMLVideoElement): Promise<void> {
    if (this.status === 'active') return;

    this.videoElement = videoEl;
    this.initOffscreenCanvas();
    this.setStatus('requesting_permission');

    // 1. Request camera stream (modest 640x480 resolution for crisp preview, 30fps max)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.setStatus('unsupported', 'Camera access is not supported by your browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { max: 30 },
        },
        audio: false, // Strictly NO audio recording
      });

      this.stream = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (videoEl.readyState >= 2) {
          resolve();
        } else {
          videoEl.onloadeddata = () => resolve();
          videoEl.onloadedmetadata = () => resolve();
          setTimeout(resolve, 800);
        }
      });

      try {
        await videoEl.play();
      } catch (err) {
        console.warn('Video play warning:', err);
      }
    } catch (err: any) {
      console.warn('Camera permission denied or unavailable:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.setStatus('permission_denied', 'Camera permission was denied. Please allow camera access in browser settings.');
      } else {
        this.setStatus('error', `Camera unavailable: ${err.message || 'No camera device found'}`);
      }
      return;
    }

    // 2. Load model lazily
    try {
      await this.loadModel();
    } catch {
      this.stopMonitoring();
      return;
    }

    // 3. Mark active and begin inference loop
    this.setStatus('active');
    this.monitoringStartTime = Date.now();
    this.scheduleNextInference();
  }

  /**
   * Stop camera tracks immediately and release resources
   */
  public stopMonitoring(): void {
    if (this.inferenceTimer) {
      clearTimeout(this.inferenceTimer);
      this.inferenceTimer = null;
    }

    if (this.monitoringStartTime) {
      this.accumulatedMonitoredMs += Date.now() - this.monitoringStartTime;
      this.monitoringStartTime = null;
    }

    // Immediately stop and release all MediaStream tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    // Clear canvas
    if (this.offscreenCtx && this.offscreenCanvas) {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

    this.personHistory = [];
    this.phoneHistory = [];
    this.lastEmittedDetection = null;
    this.isProcessingFrame = false;
    soundAlerts.stopDangerAlarmLoop();
    this.setStatus('idle');
  }

  /**
   * Dispose model resources when tearing down
   */
  public dispose(): void {
    this.stopMonitoring();
    if (this.detector) {
      try {
        this.detector.close();
      } catch (err) {
        console.warn('Error closing MediaPipe detector:', err);
      }
      this.detector = null;
    }
  }

  /**
   * Pause monitoring temporarily (e.g. when timer paused)
   */
  public pauseMonitoring(): void {
    if (this.inferenceTimer) {
      clearTimeout(this.inferenceTimer);
      this.inferenceTimer = null;
    }

    if (this.monitoringStartTime) {
      this.accumulatedMonitoredMs += Date.now() - this.monitoringStartTime;
      this.monitoringStartTime = null;
    }

    if (this.status === 'active') {
      soundAlerts.stopDangerAlarmLoop();
      this.setStatus('paused');
    }
  }

  /**
   * Resume monitoring when timer resumes
   */
  public resumeMonitoring(): void {
    if (this.status === 'paused' && this.stream && this.videoElement) {
      this.setStatus('active');
      this.monitoringStartTime = Date.now();
      this.scheduleNextInference();
    }
  }

  private scheduleNextInference() {
    if (this.status !== 'active') return;

    this.inferenceTimer = setTimeout(async () => {
      await this.processCurrentFrame();
      this.scheduleNextInference();
    }, this.currentEffectiveIntervalMs);
  }

  /**
   * Process a single video frame locally with downscaling and adaptive throttling
   */
  private async processCurrentFrame(): Promise<void> {
    // Drop frame if already processing (guarantees at most one inference operation at a time)
    if (this.isProcessingFrame) {
      this.droppedFramesCount++;
      return;
    }

    if (!this.detector || !this.videoElement) return;
    if (this.videoElement.readyState < 2) return; // HAVE_CURRENT_DATA
    if (document.hidden) return;

    this.isProcessingFrame = true;
    const startInference = performance.now();

    try {
      // Provide clean crisp video input directly so fine mobile phone edges and screens are preserved
      let inputSource: CanvasImageSource = this.videoElement;

      if (
        (this.settings.preset === 'low_resource' || this.isAdaptivelyThrottled) &&
        this.offscreenCanvas &&
        this.offscreenCtx
      ) {
        const [targetWidth, targetHeight] = this.getResolutionDimensions();
        this.offscreenCtx.drawImage(this.videoElement, 0, 0, targetWidth, targetHeight);
        inputSource = this.offscreenCanvas;
      }

      // Execute on-device MediaPipe inference
      const detectionResult = this.detector.detectForVideo(inputSource, startInference);

      const inferenceDuration = performance.now() - startInference;
      this.lastInferenceDurationMs = Math.round(inferenceDuration);
      this.peakInferenceDurationMs = Math.max(this.peakInferenceDurationMs, this.lastInferenceDurationMs);

      // Update Exponential Moving Average of inference time
      this.avgInferenceDurationMs =
        this.avgInferenceDurationMs === 0
          ? inferenceDuration
          : this.avgInferenceDurationMs * 0.7 + inferenceDuration * 0.3;

      // Adaptive Performance Throttling logic
      if (this.settings.adaptivePerformance) {
        if (this.avgInferenceDurationMs > 200) {
          this.slowFramesStreak++;
          this.fastFramesStreak = 0;
          if (this.slowFramesStreak >= 4 && this.currentEffectiveIntervalMs < 1500) {
            // Step down frequency (increase interval) to relieve CPU pressure
            this.currentEffectiveIntervalMs = Math.min(1500, this.currentEffectiveIntervalMs + 300);
            this.isAdaptivelyThrottled = true;
            this.slowFramesStreak = 0;
          }
        } else if (this.avgInferenceDurationMs < 60 && this.isAdaptivelyThrottled) {
          this.fastFramesStreak++;
          this.slowFramesStreak = 0;
          if (this.fastFramesStreak >= 10) {
            this.currentEffectiveIntervalMs = Math.max(
              this.settings.sampleIntervalMs,
              this.currentEffectiveIntervalMs - 200
            );
            if (this.currentEffectiveIntervalMs <= this.settings.sampleIntervalMs) {
              this.isAdaptivelyThrottled = false;
            }
            this.fastFramesStreak = 0;
          }
        }
      }

      let rawPersonDetected = false;
      let rawPhoneDetected = false;
      let personConf = 0;
      let phoneConf = 0;
      let bestPhoneBox: BoundingBox | null = null;
      let bestPersonBox: BoundingBox | null = null;

      if (detectionResult && detectionResult.detections) {
        for (const detection of detectionResult.detections) {
          for (const category of detection.categories) {
            const name = category.categoryName.toLowerCase();
            const score = category.score;

            if (name === 'person' && score >= this.settings.personConfidenceThreshold) {
              rawPersonDetected = true;
              if (score > personConf) {
                personConf = score;
                bestPersonBox = detection.boundingBox || null;
              }
            }

            // Catch phone by any COCO label variation (cell phone, phone, mobile, remote, etc.)
            const isPhoneMatch =
              name === 'cell phone' ||
              name === 'phone' ||
              name === 'mobile phone' ||
              name === 'telephone' ||
              name === 'remote';

            if (isPhoneMatch && score >= this.settings.phoneConfidenceThreshold) {
              rawPhoneDetected = true;
              if (score > phoneConf) {
                phoneConf = score;
                bestPhoneBox = detection.boundingBox || null;
              }
            }
          }
        }
      }

      // Temporal Smoothing across 3 frames
      this.personHistory.push(rawPersonDetected);
      if (this.personHistory.length > 3) this.personHistory.shift();

      this.phoneHistory.push(rawPhoneDetected);
      if (this.phoneHistory.length > 3) this.phoneHistory.shift();

      // Person present if seen in at least 1 of last 3 samples
      const smoothedPersonPresent = this.personHistory.some(Boolean);
      // Phone visible if seen in at least 1 of last 3 samples for responsive catching
      const smoothedPhoneVisible = this.phoneHistory.some(Boolean);

      // Update aggregate counters
      this.totalSamples++;
      if (smoothedPersonPresent) {
        this.personPresentSamples++;
      }

      const timestamp = new Date().toISOString();
      const currentTimeMs = Date.now();
      const cooldownMs = this.settings.alertCooldownSeconds * 1000;

      // Emit person absence event if applicable
      if (this.settings.checkPerson && !smoothedPersonPresent) {
        if (currentTimeMs - this.lastAbsenceAlertTime > cooldownMs) {
          this.lastAbsenceAlertTime = currentTimeMs;
          this.absenceIncidents++;
          this.emitEvent({
            id: `absent_${currentTimeMs}`,
            type: 'person_absent',
            timestamp,
            confidence: 0,
            message: 'Notice: Person not clearly detected in camera frame.',
          });
        }
      }

      // Emit phone detected event and control continuous danger alarm loop
      if (this.settings.checkPhone && smoothedPhoneVisible) {
        // Continuous danger alarm siren while phone is in use / in frame
        soundAlerts.startDangerAlarmLoop();

        if (currentTimeMs - this.lastPhoneAlertTime > cooldownMs) {
          this.lastPhoneAlertTime = currentTimeMs;
          this.phoneVisibleIncidents++;
          this.emitEvent({
            id: `phone_${currentTimeMs}`,
            type: 'phone_detected',
            timestamp,
            confidence: Math.round(phoneConf * 100),
            message: `Estimated smartphone in frame (${Math.round(phoneConf * 100)}% confidence).`,
          });
        }
      } else {
        // Stop alarm immediately once phone is put away
        soundAlerts.stopDangerAlarmLoop();
      }

      const newDetectionState: DetectionState = {
        personPresent: smoothedPersonPresent,
        phoneVisible: smoothedPhoneVisible,
        personConfidence: Math.round(personConf * 100),
        phoneConfidence: Math.round(phoneConf * 100),
        lastUpdated: currentTimeMs,
        phoneBox: smoothedPhoneVisible ? bestPhoneBox : null,
        personBox: smoothedPersonPresent ? bestPersonBox : null,
      };

      // State Update Throttling:
      // Only emit to React listeners when state meaningfully changes or every 4 seconds (heartbeat)
      const prev = this.lastEmittedDetection;
      const shouldEmit =
        !prev ||
        prev.personPresent !== newDetectionState.personPresent ||
        prev.phoneVisible !== newDetectionState.phoneVisible ||
        Math.abs(prev.personConfidence - newDetectionState.personConfidence) >= 15 ||
        Math.abs(prev.phoneConfidence - newDetectionState.phoneConfidence) >= 15 ||
        currentTimeMs - this.lastDetectionEmitTime >= 4000;

      if (shouldEmit) {
        this.lastEmittedDetection = newDetectionState;
        this.lastDetectionEmitTime = currentTimeMs;
        this.detectionListeners.forEach((listener) => listener(newDetectionState));
      }

      // Emit performance metrics
      this.emitMetrics();
    } catch (err) {
      console.warn('MediaPipe frame inference warning:', err);
    } finally {
      this.isProcessingFrame = false;
    }
  }

  private emitEvent(event: FocusEvent) {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * Reset session aggregate metrics (called on new session)
   */
  public resetSessionData(): void {
    this.totalSamples = 0;
    this.personPresentSamples = 0;
    this.absenceIncidents = 0;
    this.phoneVisibleIncidents = 0;
    this.droppedFramesCount = 0;
    this.peakInferenceDurationMs = 0;
    this.monitoringStartTime = this.status === 'active' ? Date.now() : null;
    this.accumulatedMonitoredMs = 0;
    this.emitMetrics();
  }

  /**
   * Clear recorded focus events
   */
  public clearEvents(): void {
    // Reset alert timestamps so next issues can trigger clean alerts
    this.lastAbsenceAlertTime = 0;
    this.lastPhoneAlertTime = 0;
  }

  /**
   * Return end-of-session aggregate summary metrics
   */
  public getAggregateSummary(): MonitoringAggregateSummary {
    const activeSpan = this.monitoringStartTime ? Date.now() - this.monitoringStartTime : 0;
    const totalMs = this.accumulatedMonitoredMs + activeSpan;
    const totalMonitoredSeconds = Math.floor(totalMs / 1000);

    const personPresentPercent =
      this.totalSamples > 0
        ? Math.round((this.personPresentSamples / this.totalSamples) * 100)
        : 100;

    return {
      totalMonitoredSeconds,
      personPresentPercent,
      absenceIncidentCount: this.absenceIncidents,
      phoneVisibleCount: this.phoneVisibleIncidents,
      totalSamples: this.totalSamples,
      personPresentSamples: this.personPresentSamples,
      averageInferenceMs: Math.round(this.avgInferenceDurationMs),
      peakInferenceMs: this.peakInferenceDurationMs,
      presetUsed: this.settings.preset,
    };
  }
}

export const focusMonitorService = new FocusMonitorService();
