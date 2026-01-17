import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AudioService } from '../../services/audio';
import type {
  AudioControls as AudioControlsType,
  AudioPreset,
} from '../../services/preset.service';
import { PresetService } from '../../services/preset.service';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-audio-controls',
  imports: [
    CommonModule,
    MatCardModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './audio-controls.html',
  styleUrl: './audio-controls.scss',
})
export class AudioControlsComponent implements OnInit, OnDestroy {
  controls$!: Observable<AudioControlsType>;
  presets: AudioPreset[] = [];
  selectedPreset: string = '';

  private destroy$ = new Subject<void>();

  constructor(private audioService: AudioService) {}

  ngOnInit(): void {
    this.controls$ = this.audioService.controls$;
    this.presets = this.audioService.getPresets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVolumeChange(value: number): void {
    this.audioService.updateControl('volume', value);
  }

  onBassChange(value: number): void {
    this.audioService.updateControl('bass', value);
  }

  onMidChange(value: number): void {
    this.audioService.updateControl('mid', value);
  }

  onTrebleChange(value: number): void {
    this.audioService.updateControl('treble', value);
  }

  onGainChange(value: number): void {
    this.audioService.updateControl('gain', value);
  }

  onReverbChange(value: number): void {
    this.audioService.updateControl('reverb', value);
  }

  onDelayChange(value: number): void {
    this.audioService.updateControl('delay', value);
  }

  onEchoFeedbackChange(value: number): void {
    this.audioService.updateControl('echoFeedback', value);
  }

  onDistortionChange(value: number): void {
    this.audioService.updateControl('distortion', value);
  }

  onPlaybackRateChange(value: number): void {
    this.audioService.updateControl('playbackRate', value);
  }

  onPitchChange(value: number): void {
    this.audioService.updateControl('pitch', value);
  }

  onPresetChange(presetName: string): void {
    const preset = this.presets.find((p) => p.name === presetName);
    if (preset) {
      this.audioService.applyPreset(preset);
      this.selectedPreset = presetName;
    }
  }

  resetControls(): void {
    this.audioService.applyPreset(this.presets[0]); 
    this.selectedPreset = 'Normal';
  }

  formatLabel(value: number): string {
    return `${value.toFixed(1)}`;
  }

  getControlDescription(control: keyof AudioControlsType): string {
    const descriptions: Record<keyof AudioControlsType, string> = {
      volume: 'Master output volume',
      bass: 'Low frequency boost/cut',
      mid: 'Mid frequency boost/cut',
      treble: 'High frequency boost/cut',
      gain: 'Input gain/drive',
      reverb: 'Room ambiance',
      delay: 'Echo effect time',
      echoFeedback: 'Echo feedback amount',
      distortion: 'Harmonic distortion intensity',
      playbackRate: 'Playback speed',
      pitch: 'Pitch shift (detune)',
    };
    return descriptions[control];
  }
}
