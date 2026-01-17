import { TestBed } from '@angular/core/testing';

import { PresetService } from './preset.service';
import type { AudioControls, AudioPreset } from './preset.service';

describe('PresetService', () => {
  let service: PresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default presets', () => {
    const presets = service.getPresets();
    expect(presets).toHaveLength(6);
    expect(presets.map((p) => p.name)).toEqual([
      'Normal',
      'LoFi',
      'Deep Bass',
      'Chipmunk',
      'Robot',
      'Stadium Echo',
    ]);
  });

  it('should have Normal preset as default selection', () => {
    const selectedPreset = service.getSelectedPreset();
    expect(selectedPreset.name).toBe('Normal');
  });

  it('should emit presets through presets$', async () => {
    const presets = await new Promise<AudioPreset[]>((resolve) => {
      service.presets$.subscribe((presets: AudioPreset[]) => {
        resolve(presets);
      });
    });

    expect(presets).toHaveLength(6);
    expect(presets[0].name).toBe('Normal');
  });

  it('should emit selected preset through selectedPreset$', async () => {
    const preset = await new Promise<AudioPreset>((resolve) => {
      service.selectedPreset$.subscribe((preset: AudioPreset) => {
        resolve(preset);
      });
    });

    expect(preset.name).toBe('Normal');
  });

  it('should emit selected preset name through selectedPresetName$', async () => {
    const name = await new Promise<string>((resolve) => {
      service.selectedPresetName$.subscribe((name: string) => {
        resolve(name);
      });
    });

    expect(name).toBe('Normal');
  });

  it('should select preset by name', () => {
    service.selectPreset('LoFi');
    const selectedPreset = service.getSelectedPreset();
    expect(selectedPreset.name).toBe('LoFi');
    expect(selectedPreset.controls.volume).toBe(0.6);
    expect(selectedPreset.controls.distortion).toBe(0.25);
  });

  it('should not change selection when preset name not found', () => {
    const originalPreset = service.getSelectedPreset();
    service.selectPreset('NonExistentPreset');
    const currentPreset = service.getSelectedPreset();
    expect(currentPreset).toBe(originalPreset);
  });

  it('should reset to default preset', () => {
    service.selectPreset('Robot');
    expect(service.getSelectedPreset().name).toBe('Robot');

    service.resetToDefault();
    expect(service.getSelectedPreset().name).toBe('Normal');
  });

  it('should have correct control values for each preset', () => {
    const presets = service.getPresets();

   
    const normal = presets.find((p) => p.name === 'Normal')!;
    expect(normal.controls.volume).toBe(0.7);
    expect(normal.controls.bass).toBe(0);
    expect(normal.controls.mid).toBe(0);
    expect(normal.controls.treble).toBe(0);
    expect(normal.controls.gain).toBe(1);
    expect(normal.controls.reverb).toBe(0);
    expect(normal.controls.delay).toBe(0);
    expect(normal.controls.echoFeedback).toBe(0.2);
    expect(normal.controls.distortion).toBe(0);
    expect(normal.controls.playbackRate).toBe(1);
    expect(normal.controls.pitch).toBe(0);

    
    const lofi = presets.find((p) => p.name === 'LoFi')!;
    expect(lofi.controls.volume).toBe(0.6);
    expect(lofi.controls.distortion).toBe(0.25);
    expect(lofi.controls.playbackRate).toBe(0.9);
    expect(lofi.controls.pitch).toBe(-2);

    
    const deepBass = presets.find((p) => p.name === 'Deep Bass')!;
    expect(deepBass.controls.bass).toBe(9);
    expect(deepBass.controls.gain).toBe(1.1);

   
    const chipmunk = presets.find((p) => p.name === 'Chipmunk')!;
    expect(chipmunk.controls.playbackRate).toBe(1.3);
    expect(chipmunk.controls.pitch).toBe(6);

   
    const robot = presets.find((p) => p.name === 'Robot')!;
    expect(robot.controls.distortion).toBe(0.5);
    expect(robot.controls.playbackRate).toBe(0.85);
    expect(robot.controls.pitch).toBe(-4);

    
    const stadiumEcho = presets.find((p) => p.name === 'Stadium Echo')!;
    expect(stadiumEcho.controls.reverb).toBe(0.6);
    expect(stadiumEcho.controls.delay).toBe(0.25);
    expect(stadiumEcho.controls.echoFeedback).toBe(0.55);
  });

  it('should emit new selection when preset is selected', async () => {
    const emissions: AudioPreset[] = [];

    service.selectedPreset$.subscribe((preset: AudioPreset) => {
      emissions.push(preset);
    });

    service.selectPreset('LoFi');

   
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emissions).toHaveLength(2);
    expect(emissions[0].name).toBe('Normal'); 
    expect(emissions[1].name).toBe('LoFi'); 
  });

  it('should emit new preset name when preset is selected', async () => {
    const emissions: string[] = [];

    service.selectedPresetName$.subscribe((name: string) => {
      emissions.push(name);
    });

    service.selectPreset('Robot');

    
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(emissions).toHaveLength(2);
    expect(emissions[0]).toBe('Normal'); 
    expect(emissions[1]).toBe('Robot'); 
  });
});
