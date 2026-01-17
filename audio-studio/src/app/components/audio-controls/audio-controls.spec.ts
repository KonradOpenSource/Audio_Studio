import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AudioControlsComponent } from './audio-controls';
import { AudioService } from '../../services/audio';
import type {
  AudioControls as AudioControlsType,
  AudioPreset,
} from '../../services/preset.service';

describe('AudioControlsComponent', () => {
  let component: AudioControlsComponent;
  let fixture: ComponentFixture<AudioControlsComponent>;
  let audioServiceSpy: any;

  const mockPresets: AudioPreset[] = [
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
  ];

  const mockControls: AudioControlsType = {
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
  };

  beforeEach(async () => {
    audioServiceSpy = {
      controls$: of(mockControls),
      getPresets: vi.fn().mockReturnValue(mockPresets),
      updateControl: vi.fn(),
      applyPreset: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AudioControlsComponent],
      providers: [{ provide: AudioService, useValue: audioServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioControlsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with presets from audio service', () => {
    expect(component.presets).toEqual(mockPresets);
    expect(audioServiceSpy.getPresets).toHaveBeenCalled();
  });

  it('should initialize controls observable', () => {
    expect(component.controls$).toBeDefined();
  });

  it('should call audio service updateControl on volume change', () => {
    const value = 0.5;
    component.onVolumeChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('volume', value);
  });

  it('should call audio service updateControl on bass change', () => {
    const value = 2;
    component.onBassChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('bass', value);
  });

  it('should call audio service updateControl on mid change', () => {
    const value = -1;
    component.onMidChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('mid', value);
  });

  it('should call audio service updateControl on treble change', () => {
    const value = 3;
    component.onTrebleChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('treble', value);
  });

  it('should call audio service updateControl on gain change', () => {
    const value = 1.2;
    component.onGainChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('gain', value);
  });

  it('should call audio service updateControl on reverb change', () => {
    const value = 0.3;
    component.onReverbChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('reverb', value);
  });

  it('should call audio service updateControl on delay change', () => {
    const value = 0.1;
    component.onDelayChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('delay', value);
  });

  it('should call audio service updateControl on echo feedback change', () => {
    const value = 0.4;
    component.onEchoFeedbackChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('echoFeedback', value);
  });

  it('should call audio service updateControl on distortion change', () => {
    const value = 0.2;
    component.onDistortionChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('distortion', value);
  });

  it('should call audio service updateControl on playback rate change', () => {
    const value = 1.1;
    component.onPlaybackRateChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('playbackRate', value);
  });

  it('should call audio service updateControl on pitch change', () => {
    const value = -2;
    component.onPitchChange(value);
    expect(audioServiceSpy.updateControl).toHaveBeenCalledWith('pitch', value);
  });

  it('should apply preset when preset is changed', () => {
    const presetName = 'LoFi';
    component.onPresetChange(presetName);

    expect(audioServiceSpy.applyPreset).toHaveBeenCalledWith(mockPresets[1]);
    expect(component.selectedPreset).toBe(presetName);
  });

  it('should not apply preset when preset name not found', () => {
    const presetName = 'NonExistent';
    component.onPresetChange(presetName);

    expect(audioServiceSpy.applyPreset).not.toHaveBeenCalled();
    expect(component.selectedPreset).toBe('');
  });

  it('should reset controls to normal preset', () => {
    component.selectedPreset = 'LoFi';
    component.resetControls();

    expect(audioServiceSpy.applyPreset).toHaveBeenCalledWith(mockPresets[0]);
    expect(component.selectedPreset).toBe('Normal');
  });

  it('should format label correctly', () => {
    expect(component.formatLabel(0.5)).toBe('0.5');
    expect(component.formatLabel(1.234)).toBe('1.2');
    expect(component.formatLabel(0)).toBe('0.0');
  });

  it('should return correct control descriptions', () => {
    expect(component.getControlDescription('volume')).toBe('Master output volume');
    expect(component.getControlDescription('bass')).toBe('Low frequency boost/cut');
    expect(component.getControlDescription('mid')).toBe('Mid frequency boost/cut');
    expect(component.getControlDescription('treble')).toBe('High frequency boost/cut');
    expect(component.getControlDescription('gain')).toBe('Input gain/drive');
    expect(component.getControlDescription('reverb')).toBe('Room ambiance');
    expect(component.getControlDescription('delay')).toBe('Echo effect time');
    expect(component.getControlDescription('echoFeedback')).toBe('Echo feedback amount');
    expect(component.getControlDescription('distortion')).toBe('Harmonic distortion intensity');
    expect(component.getControlDescription('playbackRate')).toBe('Playback speed');
    expect(component.getControlDescription('pitch')).toBe('Pitch shift (detune)');
  });

  it('should clean up destroy subject on destroy', () => {
    const nextSpy = vi.spyOn(component['destroy$'], 'next');
    const completeSpy = vi.spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalledWith();
    expect(completeSpy).toHaveBeenCalled();
  });
});
