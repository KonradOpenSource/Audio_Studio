import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AudioControls {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  gain: number;
  reverb: number;
  delay: number;
  echoFeedback: number;
  distortion: number;
  playbackRate: number;
  pitch: number;
}

export interface AudioPreset {
  name: string;
  controls: AudioControls;
}

@Injectable({
  providedIn: 'root',
})
export class PresetService {
  private presets: AudioPreset[] = [
    {
      name: 'Normal',
      controls: {
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
      },
    },
    {
      name: 'LoFi',
      controls: {
        volume: 0.6,
        bass: 2,
        mid: -2,
        treble: -4,
        gain: 1,
        reverb: 0.25,
        delay: 0.08,
        echoFeedback: 0.15,
        distortion: 0.25,
        playbackRate: 0.9,
        pitch: -2,
      },
    },
    {
      name: 'Deep Bass',
      controls: {
        volume: 0.8,
        bass: 9,
        mid: 1,
        treble: -1,
        gain: 1.1,
        reverb: 0.1,
        delay: 0.05,
        echoFeedback: 0.2,
        distortion: 0.1,
        playbackRate: 1,
        pitch: -1,
      },
    },
    {
      name: 'Chipmunk',
      controls: {
        volume: 0.7,
        bass: -3,
        mid: 1,
        treble: 5,
        gain: 1,
        reverb: 0.05,
        delay: 0,
        echoFeedback: 0.05,
        distortion: 0,
        playbackRate: 1.3,
        pitch: 6,
      },
    },
    {
      name: 'Robot',
      controls: {
        volume: 0.75,
        bass: -1,
        mid: 2,
        treble: -2,
        gain: 1.2,
        reverb: 0.2,
        delay: 0.12,
        echoFeedback: 0.35,
        distortion: 0.5,
        playbackRate: 0.85,
        pitch: -4,
      },
    },
    {
      name: 'Stadium Echo',
      controls: {
        volume: 0.7,
        bass: 2,
        mid: 0,
        treble: 2,
        gain: 1,
        reverb: 0.6,
        delay: 0.25,
        echoFeedback: 0.55,
        distortion: 0.05,
        playbackRate: 1,
        pitch: 0,
      },
    },
  ];

  private selectedPresetSubject = new BehaviorSubject<AudioPreset>(this.presets[0]);

  public presets$ = new BehaviorSubject<AudioPreset[]>(this.presets);
  public selectedPreset$ = this.selectedPresetSubject.asObservable();
  public selectedPresetName$ = this.selectedPreset$.pipe(map((p) => p.name));

  getPresets(): AudioPreset[] {
    return this.presets;
  }

  selectPreset(presetName: string): void {
    const preset = this.presets.find((p) => p.name === presetName);
    if (preset) {
      this.selectedPresetSubject.next(preset);
    }
  }

  getSelectedPreset(): AudioPreset {
    return this.selectedPresetSubject.value;
  }

  resetToDefault(): void {
    this.selectedPresetSubject.next(this.presets[0]); // Normal
  }
}
