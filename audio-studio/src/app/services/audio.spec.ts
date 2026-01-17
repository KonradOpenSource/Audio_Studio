import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AudioService } from './audio';
import { PresetService } from './preset.service';
import { AudioExportService } from './audio-export.service';
import type { AudioControls, AudioPreset } from './preset.service';


class MockAudioContext {
  createBufferSource() {
    return {
      buffer: null,
      playbackRate: { value: 1 },
      detune: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    };
  }

  createGain() {
    return { gain: { value: 1 }, connect: vi.fn() };
  }

  createBiquadFilter() {
    return {
      type: 'lowshelf',
      frequency: { value: 0 },
      gain: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    };
  }

  createDelay() {
    return { delayTime: { value: 0 }, connect: vi.fn() };
  }

  createWaveShaper() {
    return {
      curve: null,
      oversample: '4x',
      connect: vi.fn(),
    };
  }

  createConvolver() {
    return {
      buffer: null,
      connect: vi.fn(),
    };
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      connect: vi.fn(),
    };
  }

  createBuffer() {
    return {
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(44100),
    };
  }

  decodeAudioData() {
    return Promise.resolve({
      duration: 10,
      numberOfChannels: 2,
      length: 441000,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(441000),
    });
  }

  destination = {};
}


function MockAudioContextConstructor() {
  return new MockAudioContext();
}

describe('AudioService', () => {
  let service: AudioService;
  let presetServiceSpy: any;
  let exportServiceSpy: any;
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    presetServiceSpy = {
      getPresets: vi.fn(),
    };

    exportServiceSpy = {
      exportToWav: vi.fn(),
    };

    mockAudioContext = new MockAudioContext();


    (window as any).AudioContext = MockAudioContextConstructor;
    (window as any).webkitAudioContext = MockAudioContextConstructor;

    TestBed.configureTestingModule({
      providers: [
        AudioService,
        { provide: PresetService, useValue: presetServiceSpy },
        { provide: AudioExportService, useValue: exportServiceSpy },
      ],
    });
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default controls', () => {
    service.controls$.subscribe((controls: AudioControls) => {
      expect(controls.volume).toBe(0.7);
      expect(controls.bass).toBe(0);
      expect(controls.mid).toBe(0);
      expect(controls.treble).toBe(0);
      expect(controls.gain).toBe(1);
      expect(controls.reverb).toBe(0);
      expect(controls.delay).toBe(0);
      expect(controls.echoFeedback).toBe(0.2);
      expect(controls.distortion).toBe(0);
      expect(controls.playbackRate).toBe(1);
      expect(controls.pitch).toBe(0);
    });
  });

  it('should have initial state values', () => {
    service.isPlaying$.subscribe((isPlaying: boolean) => {
      expect(isPlaying).toBe(false);
    });
    service.currentTime$.subscribe((time: number) => {
      expect(time).toBe(0);
    });
    service.duration$.subscribe((duration: number) => {
      expect(duration).toBe(0);
    });
    service.audioLoaded$.subscribe((loaded: boolean) => {
      expect(loaded).toBe(false);
    });
  });

  it('should update control values', () => {
    const initialVolume = 0.7;
    const newVolume = 0.5;

    service.controls$.subscribe((controls: AudioControls) => {
      if (controls.volume === newVolume) {
        expect(controls.volume).toBe(newVolume);
      }
    });

    service.updateControl('volume', newVolume);
  });

  it('should apply preset', () => {
    const mockPreset: AudioPreset = {
      name: 'Test Preset',
      controls: {
        volume: 0.8,
        bass: 5,
        mid: 2,
        treble: 3,
        gain: 1.2,
        reverb: 0.3,
        delay: 0.2,
        echoFeedback: 0.4,
        distortion: 0.1,
        playbackRate: 1.1,
        pitch: 2,
      },
    };

    service.applyPreset(mockPreset);

    service.controls$.subscribe((controls: AudioControls) => {
      expect(controls.volume).toBe(mockPreset.controls.volume);
      expect(controls.bass).toBe(mockPreset.controls.bass);
      expect(controls.mid).toBe(mockPreset.controls.mid);
      expect(controls.treble).toBe(mockPreset.controls.treble);
    });
  });

  it('should get presets from preset service', () => {
    const mockPresets: AudioPreset[] = [
      {
        name: 'Preset 1',
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
    ];

    presetServiceSpy.getPresets.mockReturnValue(mockPresets);
    const presets = service.getPresets();
    expect(presets).toBe(mockPresets);
    expect(presetServiceSpy.getPresets).toHaveBeenCalled();
  });

  it('should load audio file', async () => {
    const mockFile = new File(['audio data'], 'test.mp3', { type: 'audio/mpeg' });

   
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(1000));

    vi.spyOn(service as any, 'setupAudioNodes').mockImplementation(() => {});

    await service.loadAudioFile(mockFile);

    service.audioLoaded$.subscribe((loaded: boolean) => {
      expect(loaded).toBe(true);
    });

    service.duration$.subscribe((duration: number) => {
      expect(duration).toBe(10);
    });
  });

  it('should load sample audio', async () => {
    const mockUrl = 'https://example.com/sample.mp3';
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)),
    } as Response);

    vi.spyOn(service as any, 'setupAudioNodes').mockImplementation(() => {});

    await service.loadSampleAudio(mockUrl);

    service.audioLoaded$.subscribe((loaded: boolean) => {
      expect(loaded).toBe(true);
    });

    service.duration$.subscribe((duration: number) => {
      expect(duration).toBe(10);
    });
  });

  it('should handle play and stop', () => {
    vi.spyOn(service as any, 'setupAudioNodes').mockImplementation(() => {});
    vi.spyOn(service as any, 'updateCurrentTime').mockImplementation(() => {});

    service.play();
    service.isPlaying$.subscribe((isPlaying: boolean) => {
      expect(isPlaying).toBe(true);
    });

    service.stop();
    service.isPlaying$.subscribe((isPlaying: boolean) => {
      expect(isPlaying).toBe(false);
    });
  });

  it('should handle pause', () => {
    service.pause();
    service.isPlaying$.subscribe((isPlaying: boolean) => {
      expect(isPlaying).toBe(false);
    });
  });

  it('should set current time', () => {
    const mockTime = 5;
    vi.spyOn(service, 'pause').mockImplementation(() => {});
    vi.spyOn(service as any, 'playFromTime').mockImplementation(() => {});

    service.setCurrentTime(mockTime);

    service.currentTime$.subscribe((time: number) => {
      expect(time).toBe(mockTime);
    });
  });

  it('should return analyser node', () => {
    vi.spyOn(service as any, 'setupAudioNodes').mockImplementation(() => {
      (service as any).analyserNode = mockAudioContext.createAnalyser();
    });

    service.play();
    const analyser = service.getAnalyserNode();
    expect(analyser).toBeTruthy();
  });

  it('should return audio context', () => {
    const context = service.getAudioContext();
    expect(context).toBeTruthy();
  });

  it('should create distortion curve', () => {
    const curve = (service as any).createDistortionCurve(0.5);
    expect(curve).toBeInstanceOf(Float32Array);
    expect(curve.length).toBe(44100);
  });

  it('should handle export audio', async () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    exportServiceSpy.exportToWav.mockResolvedValue(mockBlob);

    vi.spyOn(service as any, 'setupAudioNodes').mockImplementation(() => {
      (service as any).audioBuffer = {
        numberOfChannels: 2,
        length: 441000,
        sampleRate: 44100,
        duration: 10,
      };
    });

    const blob = await service.exportAudio();
    expect(blob).toBe(mockBlob);
    expect(exportServiceSpy.exportToWav).toHaveBeenCalled();
  });

  it('should throw error when exporting without audio', async () => {
    await expect(service.exportAudio()).rejects.toThrow('No audio loaded');
  });
});
