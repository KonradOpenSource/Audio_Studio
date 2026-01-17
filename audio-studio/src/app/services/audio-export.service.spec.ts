import { TestBed } from '@angular/core/testing';

import { AudioExportService } from './audio-export.service';

describe('AudioExportService', () => {
  let service: AudioExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export mono audio buffer to WAV', async () => {
    
    const mockAudioBuffer = {
      numberOfChannels: 1,
      length: 44100, 
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(
        new Float32Array(44100).fill(0.5), 
      ),
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');

  
    const expectedSize = mockAudioBuffer.length * mockAudioBuffer.numberOfChannels * 2 + 44;
    expect(blob.size).toBe(expectedSize);
  });

  it('should export stereo audio buffer to WAV', async () => {
   
    const mockAudioBuffer = {
      numberOfChannels: 2,
      length: 44100, 
      sampleRate: 44100,
      getChannelData: vi
        .fn()
        .mockReturnValueOnce(new Float32Array(44100).fill(0.5)) 
        .mockReturnValueOnce(new Float32Array(44100).fill(-0.5)), 
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');

  
    const expectedSize = mockAudioBuffer.length * mockAudioBuffer.numberOfChannels * 2 + 44;
    expect(blob.size).toBe(expectedSize);
  });

  it('should create correct WAV header for mono audio', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      length: 1000,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(1000).fill(0)),
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);
    
    const mockArrayBuffer = new ArrayBuffer(blob.size);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(arrayBuffer);

    
    expect(view.getUint32(0, true)).toBe(0x46464952); 
    expect(view.getUint32(4, true)).toBe(arrayBuffer.byteLength - 8);
    expect(view.getUint32(8, true)).toBe(0x45564157); 

   
    expect(view.getUint32(12, true)).toBe(0x20746d66); 
    expect(view.getUint32(16, true)).toBe(16); 
    expect(view.getUint16(20, true)).toBe(1); 
    expect(view.getUint16(22, true)).toBe(1); 
    expect(view.getUint32(24, true)).toBe(44100); 
    expect(view.getUint32(28, true)).toBe(88200); 
    expect(view.getUint16(32, true)).toBe(2); 
    expect(view.getUint16(34, true)).toBe(16); 

    
    expect(view.getUint32(36, true)).toBe(0x61746164); 
    expect(view.getUint32(40, true)).toBe(arrayBuffer.byteLength - 44); 
  });

  it('should create correct WAV header for stereo audio', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 2,
      length: 1000,
      sampleRate: 48000,
      getChannelData: vi
        .fn()
        .mockReturnValueOnce(new Float32Array(1000).fill(0))
        .mockReturnValueOnce(new Float32Array(1000).fill(0)),
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(arrayBuffer);

  
    expect(view.getUint16(22, true)).toBe(2); 
    expect(view.getUint32(24, true)).toBe(48000); 
    expect(view.getUint32(28, true)).toBe(192000);
    expect(view.getUint16(32, true)).toBe(4);
  });

  it('should handle audio clipping correctly', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      length: 4,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(
        new Float32Array([2, -2, 0.5, -0.5]), 
      ),
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(arrayBuffer);

  
    expect(view.getInt16(44, true)).toBe(32767);
    
    expect(view.getInt16(46, true)).toBe(-32768);
   
    expect(view.getInt16(48, true)).toBe(16383);
   
    expect(view.getInt16(50, true)).toBe(-16384);
  });

  it('should handle zero-length audio buffer', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 1,
      length: 0,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(0)),
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');

    
    const expectedSize = 44; 
    expect(blob.size).toBe(expectedSize);
  });

  it('should handle different sample rates', async () => {
    const sampleRates = [22050, 44100, 48000, 96000];

    for (const sampleRate of sampleRates) {
      const mockAudioBuffer = {
        numberOfChannels: 1,
        length: 1000,
        sampleRate,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(1000).fill(0)),
      } as any;

      const blob = await service.exportToWav(mockAudioBuffer);
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(blob);
      });
      const view = new DataView(arrayBuffer);

      
      expect(view.getUint32(24, true)).toBe(sampleRate);
      expect(view.getUint32(28, true)).toBe(sampleRate * 2); 
    }
  });

  it('should interleave stereo channels correctly', async () => {
    const mockAudioBuffer = {
      numberOfChannels: 2,
      length: 2,
      sampleRate: 44100,
      getChannelData: vi
        .fn()
        .mockReturnValueOnce(new Float32Array([0.5, 0.25])) 
        .mockReturnValueOnce(new Float32Array([-0.5, -0.25])), 
    } as any;

    const blob = await service.exportToWav(mockAudioBuffer);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(arrayBuffer);

    
    expect(view.getInt16(44, true)).toBeCloseTo(16383); 
    expect(view.getInt16(46, true)).toBeCloseTo(-16384); 
    expect(view.getInt16(48, true)).toBeCloseTo(8191); 
    expect(view.getInt16(50, true)).toBeCloseTo(-8192); 
  });
});
