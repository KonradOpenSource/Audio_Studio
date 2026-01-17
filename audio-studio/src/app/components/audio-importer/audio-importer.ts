import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AudioService } from '../../services/audio';

@Component({
  selector: 'app-audio-importer',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './audio-importer.html',
  styleUrl: './audio-importer.scss',
})
export class AudioImporterComponent {
  @Output() audioLoaded = new EventEmitter<void>();

  isLoading = false;
  isDragging = false;
  showSampleList = false;
  sampleFiles = [
    { name: 'Test Tone 440Hz', path: 'audio/test-tone-440.wav' },
    { name: 'Test Tone 880Hz', path: 'audio/test-tone-880.wav' },
    { name: 'White Noise', path: 'audio/white-noise.wav' },
    { name: 'Demo Loop', path: 'audio/demo-loop.wav' },
    { name: 'Sample', path: 'sample.wav' },
  ];

  constructor(private audioService: AudioService) {}

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.isValidAudioFile(file)) {
      this.loadAudioFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidAudioFile(file)) {
        this.loadAudioFile(file);
      }
    }
  }

  toggleSampleList(): void {
    this.showSampleList = !this.showSampleList;
  }

  async loadSampleAudio(sample: { name: string; path: string }): Promise<void> {
    console.log('Loading sample:', sample.name);
    this.isLoading = true;
    this.showSampleList = false;
    try {
      await this.audioService.loadSampleAudio(sample.path);
      console.log('Sample loaded successfully');
      this.audioLoaded.emit();
    } catch (error) {
      console.error('Error loading sample audio:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAudioFile(file: File): Promise<void> {
    this.isLoading = true;
    try {
      await this.audioService.loadAudioFile(file);
      this.audioLoaded.emit();
    } catch (error) {
      console.error('Error loading audio file:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private isValidAudioFile(file: File): boolean {
    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/webm',
      'audio/ogg',
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.webm') ||
      file.name.toLowerCase().endsWith('.ogg')
    );
  }
}
