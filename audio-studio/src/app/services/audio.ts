import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PresetService } from './preset.service';
import { AudioExportService } from './audio-export.service';
import type { AudioControls, AudioPreset } from './preset.service';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayGainNode: GainNode | null = null;
  private feedbackGainNode: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private convolverGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);
  private audioLoadedSubject = new BehaviorSubject<boolean>(false);
  private controlsSubject = new BehaviorSubject<AudioControls>({
    volume: 0.7,
    bass: 0,
    mid: 0,
    treble: 0,
    gain: 1,
    reverb: 0,
    delay: 0,
    echoFeedback: 0.2,
    distortion: 0,
    playbackRate: 1,
    pitch: 0,
  });

  public isPlaying$ = this.isPlayingSubject.asObservable();
  public currentTime$ = this.currentTimeSubject.asObservable();
  public duration$ = this.durationSubject.asObservable();
  public audioLoaded$ = this.audioLoadedSubject.asObservable();
  public controls$ = this.controlsSubject.asObservable();

  private updateTimeAnimationId: number | null = null;

  constructor(
    private presetService: PresetService,
    private exportService: AudioExportService,
  ) {
    this.initializeAudioContext();
  }

  private applySourceParams(controls: AudioControls): void {
    if (!this.sourceNode) return;
    this.sourceNode.playbackRate.value = controls.playbackRate;
    this.sourceNode.detune.value = controls.pitch * 100;
  }

  private createDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const clamped = Math.max(0, Math.min(amount, 1));
    const samples = 44100;
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer) as Float32Array<ArrayBuffer>;
    const k = clamped * 100;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private initializeAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async loadAudioFile(file: File): Promise<void> {
    try {
      this.initializeAudioContext();
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.durationSubject.next(this.audioBuffer.duration);
      this.audioLoadedSubject.next(true);
      this.setupAudioNodes();
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  async loadSampleAudio(url: string): Promise<void> {
    try {
      this.initializeAudioContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.durationSubject.next(this.audioBuffer.duration);
      this.audioLoadedSubject.next(true);
      this.setupAudioNodes();
    } catch (error) {
      console.error('Error loading sample audio:', error);
      throw error;
    }
  }

  private setupAudioNodes(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    this.gainNode = this.audioContext.createGain();
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.midFilter = this.audioContext.createBiquadFilter();
    this.trebleFilter = this.audioContext.createBiquadFilter();
    this.delayNode = this.audioContext.createDelay(1.0);
    this.delayGainNode = this.audioContext.createGain();
    this.feedbackGainNode = this.audioContext.createGain();
    this.distortionNode = this.audioContext.createWaveShaper();
    this.convolverNode = this.audioContext.createConvolver();
    this.convolverGainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 320;

    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = 0.5;

    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 3200;

    this.delayNode.delayTime.value = this.controlsSubject.value.delay;

    if (this.distortionNode) {
      this.distortionNode.curve = this.createDistortionCurve(this.controlsSubject.value.distortion);
      this.distortionNode.oversample = '4x';
    }

    this.createReverbImpulse();

    this.applyControls(this.controlsSubject.value);
  }

  private createReverbImpulse(): void {
    if (!this.audioContext || !this.convolverNode) return;

    const length = this.audioContext.sampleRate * 2;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    this.convolverNode.buffer = impulse;
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer || this.isPlayingSubject.value) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.applySourceParams(this.controlsSubject.value);

    this.connectNodes();

    this.sourceNode.start(0);
    this.isPlayingSubject.next(true);

    this.sourceNode.onended = () => {
      this.stop();
    };

    this.updateCurrentTime();
  }

  private connectNodes(): void {
    if (
      !this.sourceNode ||
      !this.gainNode ||
      !this.bassFilter ||
      !this.midFilter ||
      !this.trebleFilter
    )
      return;

    this.sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    if (this.distortionNode) {
      this.trebleFilter.connect(this.distortionNode);
      this.distortionNode.connect(this.gainNode);
    } else {
      this.trebleFilter.connect(this.gainNode);
    }

    if (this.delayNode && this.delayGainNode && this.feedbackGainNode) {
      this.trebleFilter.connect(this.delayNode);
      this.delayNode.connect(this.delayGainNode);
      this.delayGainNode.connect(this.gainNode);
      this.delayNode.connect(this.feedbackGainNode);
      this.feedbackGainNode.connect(this.delayNode);
    }

    if (this.convolverNode && this.convolverGainNode) {
      this.trebleFilter.connect(this.convolverNode);
      this.convolverNode.connect(this.convolverGainNode);
      this.convolverGainNode.connect(this.gainNode);
    }

    if (this.gainNode && this.analyserNode && this.audioContext) {
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    }
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Node already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.updateTimeAnimationId !== null) {
      cancelAnimationFrame(this.updateTimeAnimationId);
      this.updateTimeAnimationId = null;
    }

    this.isPlayingSubject.next(false);
    this.currentTimeSubject.next(0);
  }

  pause(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Node already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.updateTimeAnimationId !== null) {
      cancelAnimationFrame(this.updateTimeAnimationId);
      this.updateTimeAnimationId = null;
    }

    this.isPlayingSubject.next(false);
  }

  private updateCurrentTime(): void {
    if (!this.isPlayingSubject.value) return;

    const startTime = Date.now() - this.currentTimeSubject.value * 1000;

    const updateTime = () => {
      if (!this.isPlayingSubject.value || !this.audioBuffer) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const current = Math.min(elapsed, this.audioBuffer.duration);
      this.currentTimeSubject.next(current);

      if (current < this.audioBuffer.duration) {
        this.updateTimeAnimationId = requestAnimationFrame(updateTime);
      } else {
        this.stop();
      }
    };

    this.updateTimeAnimationId = requestAnimationFrame(updateTime);
  }

  updateControl(control: keyof AudioControls, value: number): void {
    const currentControls = { ...this.controlsSubject.value };
    currentControls[control] = value;
    this.controlsSubject.next(currentControls);
    this.applyControls(currentControls);
  }

  private applyControls(controls: AudioControls): void {
    if (this.gainNode) {
      this.gainNode.gain.value = controls.volume * controls.gain;
    }

    if (this.bassFilter) {
      this.bassFilter.gain.value = controls.bass;
    }

    if (this.midFilter) {
      this.midFilter.gain.value = controls.mid;
    }

    if (this.trebleFilter) {
      this.trebleFilter.gain.value = controls.treble;
    }

    if (this.delayNode && this.delayGainNode) {
      this.delayNode.delayTime.value = controls.delay;
      this.delayGainNode.gain.value = controls.delay * 0.5;
    }

    if (this.feedbackGainNode) {
      this.feedbackGainNode.gain.value = controls.echoFeedback;
    }

    if (this.distortionNode) {
      this.distortionNode.curve = this.createDistortionCurve(controls.distortion);
    }

    if (this.sourceNode) {
      this.applySourceParams(controls);
    }

    if (this.convolverGainNode) {
      this.convolverGainNode.gain.value = controls.reverb;
    }
  }

  applyPreset(preset: AudioPreset): void {
    this.controlsSubject.next(preset.controls);
    this.applyControls(preset.controls);
  }

  getPresets(): AudioPreset[] {
    return this.presetService.getPresets();
  }

  async exportAudio(): Promise<Blob> {
    if (!this.audioBuffer) {
      throw new Error('No audio loaded');
    }

    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.length,
      this.audioBuffer.sampleRate,
    );

    const source = offlineContext.createBufferSource();
    source.buffer = this.audioBuffer;

    const gainNode = offlineContext.createGain();
    const bassFilter = offlineContext.createBiquadFilter();
    const midFilter = offlineContext.createBiquadFilter();
    const trebleFilter = offlineContext.createBiquadFilter();
    const delayNode = offlineContext.createDelay(1.0);
    const delayGainNode = offlineContext.createGain();
    const feedbackGainNode = offlineContext.createGain();
    const distortionNode = offlineContext.createWaveShaper();
    const convolverNode = offlineContext.createConvolver();
    const convolverGainNode = offlineContext.createGain();

    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 320;

    midFilter.type = 'peaking';
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 0.5;

    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3200;

    const length = offlineContext.sampleRate * 2;
    const impulse = offlineContext.createBuffer(2, length, offlineContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolverNode.buffer = impulse;

    const controls = this.controlsSubject.value;
    gainNode.gain.value = controls.volume * controls.gain;
    bassFilter.gain.value = controls.bass;
    midFilter.gain.value = controls.mid;
    trebleFilter.gain.value = controls.treble;
    delayNode.delayTime.value = controls.delay;
    delayGainNode.gain.value = controls.delay * 0.5;
    feedbackGainNode.gain.value = controls.echoFeedback;
    distortionNode.curve = this.createDistortionCurve(controls.distortion);
    distortionNode.oversample = '4x';
    convolverGainNode.gain.value = controls.reverb;
    source.playbackRate.value = controls.playbackRate;
    source.detune.value = controls.pitch * 100;

    source.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(distortionNode);
    distortionNode.connect(gainNode);

    trebleFilter.connect(delayNode);
    delayNode.connect(delayGainNode);
    delayGainNode.connect(gainNode);
    delayNode.connect(feedbackGainNode);
    feedbackGainNode.connect(delayNode);

    trebleFilter.connect(convolverNode);
    convolverNode.connect(convolverGainNode);
    convolverGainNode.connect(gainNode);

    gainNode.connect(offlineContext.destination);

    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();
    return this.exportService.exportToWav(renderedBuffer);
  }

  setCurrentTime(time: number): void {
    if (!this.audioBuffer) return;

    const wasPlaying = this.isPlayingSubject.value;
    if (wasPlaying) {
      this.pause();
    }

    this.currentTimeSubject.next(time);

    if (wasPlaying) {
      this.playFromTime(time);
    }
  }

  private playFromTime(time: number): void {
    if (!this.audioContext || !this.audioBuffer) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.applySourceParams(this.controlsSubject.value);
    this.sourceNode.start(0, time);

    this.connectNodes();
    this.isPlayingSubject.next(true);

    this.sourceNode.onended = () => {
      this.stop();
    };

    this.updateCurrentTimeFromTime(time);
  }

  private updateCurrentTimeFromTime(startTime: number): void {
    if (!this.isPlayingSubject.value) return;

    const startTimestamp = Date.now() - startTime * 1000;

    const updateTime = () => {
      if (!this.isPlayingSubject.value || !this.audioBuffer) return;

      const elapsed = (Date.now() - startTimestamp) / 1000;
      const current = Math.min(elapsed, this.audioBuffer.duration);
      this.currentTimeSubject.next(current);

      if (current < this.audioBuffer.duration) {
        this.updateTimeAnimationId = requestAnimationFrame(updateTime);
      } else {
        this.stop();
      }
    };

    this.updateTimeAnimationId = requestAnimationFrame(updateTime);
  }
}
