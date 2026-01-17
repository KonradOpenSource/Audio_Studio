import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioExportService {
  async exportToWav(buffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2 + 44;
    const outputBuffer = new ArrayBuffer(length);
    const view = new DataView(outputBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

   
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    
    setUint32(0x46464952);
   
    setUint32(length - 8);
    
    setUint32(0x45564157);
  
    setUint32(0x20746d66);
   
    setUint32(16);
    
    setUint16(1);
    
    setUint16(numberOfChannels);
 
    setUint32(buffer.sampleRate);
 
    setUint32(buffer.sampleRate * numberOfChannels * 2);
  
    setUint16(numberOfChannels * 2);
   
    setUint16(16);
    
    setUint32(0x61746164);
    
    setUint32(length - pos - 4);

    
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([outputBuffer], { type: 'audio/wav' });
  }
}
