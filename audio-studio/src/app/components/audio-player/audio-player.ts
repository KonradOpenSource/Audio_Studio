import {
  Component,
  OnInit,
  OnDestroy,
  Pipe,
  PipeTransform,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  runInInjectionContext,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AudioService } from '../../services/audio';
import { AudioVisualizerComponent } from '../audio-visualizer/audio-visualizer';
import { Observable, Subject, takeUntil, BehaviorSubject } from 'rxjs';

@Pipe({ name: 'formatTime' })
export class FormatTimePipe implements PipeTransform {
  transform(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

@Component({
  selector: 'app-audio-player',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    AudioVisualizerComponent,
    FormatTimePipe,
  ],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.scss',
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
  isPlaying$!: Observable<boolean>;
  currentTime$!: Observable<number>;
  duration$!: Observable<number>;
  audioLoaded$!: Observable<boolean>;

  isExporting = false;
  isPlaying = false;
  exportUrl: string | null = null;
  @ViewChild('exportAudio') exportAudioElement?: ElementRef<HTMLAudioElement>;
  @ViewChild('finalRenderCanvas') finalRenderCanvasRef?: ElementRef<HTMLCanvasElement>;
  isFinalRenderPlaying$ = new BehaviorSubject<boolean>(false);
  private finalRenderAudioContext?: AudioContext;
  private finalRenderAnalyser?: AnalyserNode;
  private finalRenderAnimationId?: number;
  private finalRenderSource?: MediaElementAudioSourceNode | AudioBufferSourceNode;
  private clonedAudioElement?: HTMLAudioElement;

  private destroy$ = new Subject<void>();

  constructor(
    private audioService: AudioService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.isPlaying$ = this.audioService.isPlaying$;
    this.currentTime$ = this.audioService.currentTime$;
    this.duration$ = this.audioService.duration$;
    this.audioLoaded$ = this.audioService.audioLoaded$;

    this.isPlaying$.pipe(takeUntil(this.destroy$)).subscribe((playing) => {
      this.isPlaying = playing;
    });

    this.isFinalRenderPlaying$.pipe(takeUntil(this.destroy$)).subscribe((playing) => {
      if (!playing) {
        this.stopFinalRenderVisualization();
      }
    });


    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        if (this.exportAudioElement?.nativeElement) {
          const audioEl = this.exportAudioElement.nativeElement;

          audioEl.addEventListener('play', () => {
            this.ngZone.run(() => {
              this.isFinalRenderPlaying$.next(true);
              this.cdr.detectChanges();
            });
          });

          audioEl.addEventListener('pause', () => {
            this.ngZone.run(() => {
              this.isFinalRenderPlaying$.next(false);
              this.cdr.detectChanges();
            });
          });

          audioEl.addEventListener('ended', () => {
            this.ngZone.run(() => {
              this.isFinalRenderPlaying$.next(false);
              this.cdr.detectChanges();
            });
          });
        }
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopFinalRenderVisualization();
    this.revokeExportUrl();
  }

  play(): void {
    this.audioService.play();
  }

  playPreview(): void {
    this.audioService.play();
  }

  playFinalRender(): void {
    if (!this.exportAudioElement?.nativeElement) return;

    const audioElement = this.exportAudioElement.nativeElement;

    if (audioElement.paused || audioElement.currentTime === 0 || audioElement.ended) {
      audioElement.currentTime = 0;
    }

    if (!this.finalRenderAnimationId) {
      this.startFinalRenderVisualization();
    }

    this.isFinalRenderPlaying$.next(true);
    this.cdr.detectChanges();

    audioElement.play();

    const handleEnded = () => {
      this.isFinalRenderPlaying$.next(false);
      this.cdr.detectChanges();
      audioElement.removeEventListener('ended', handleEnded);
    };
    audioElement.addEventListener('ended', handleEnded);
  }

  pause(): void {
    this.audioService.pause();
    this.isPlaying = false;
    this.cdr.detectChanges();
    this.stopFinalRenderImmediately();
  }

  stop(): void {
    this.audioService.stop();
    this.isPlaying = false;
    this.cdr.detectChanges();
    this.stopFinalRenderImmediately();
  }

  pauseFinalRender(): void {
    this.stopFinalRenderImmediately();
  }

  stopFinalRender(): void {
    this.stopFinalRenderImmediately();
  }

  private stopFinalRenderImmediately(): void {
    if (this.exportAudioElement?.nativeElement) {
      const audioElement = this.exportAudioElement.nativeElement;
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    this.isFinalRenderPlaying$.next(false);
    this.cdr.detectChanges();

    if (this.finalRenderAnimationId) {
      cancelAnimationFrame(this.finalRenderAnimationId);
      this.finalRenderAnimationId = undefined;
    }

    this.stopFinalRenderVisualization();
  }

  private startFinalRenderVisualization(): void {
    if (!this.finalRenderCanvasRef?.nativeElement || !this.exportAudioElement?.nativeElement)
      return;

    if (this.finalRenderAudioContext) {
      this.finalRenderAudioContext.close();
    }

    const canvas = this.finalRenderCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.finalRenderAudioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();

    this.finalRenderAnalyser = this.finalRenderAudioContext.createAnalyser();

    try {
      const audioElement = this.exportAudioElement.nativeElement;
      const clonedAudio = audioElement.cloneNode(true) as HTMLAudioElement;
      clonedAudio.src = audioElement.src;
      clonedAudio.currentTime = audioElement.currentTime;

      const source = this.finalRenderAudioContext.createMediaElementSource(clonedAudio);

      source.connect(this.finalRenderAnalyser);

      source.connect(this.finalRenderAudioContext.destination);

      clonedAudio.play();

      this.finalRenderSource = source;
      this.clonedAudioElement = clonedAudio;

      this.visualizeAudioBuffer();
    } catch (error) {
      console.error('Error connecting audio element:', error);

      this.createVisualizationFromAudioUrl();
    }
  }

  private async createVisualizationFromAudioUrl(): Promise<void> {
    if (!this.exportUrl || !this.finalRenderAudioContext || !this.finalRenderAnalyser) return;

    try {
      const response = await fetch(this.exportUrl);
      const arrayBuffer = await response.arrayBuffer();

      const audioBuffer = await this.finalRenderAudioContext.decodeAudioData(arrayBuffer);

      const source = this.finalRenderAudioContext.createBufferSource();
      source.buffer = audioBuffer;

      source.connect(this.finalRenderAnalyser);
      source.connect(this.finalRenderAudioContext.destination);

      source.start(0);

      this.finalRenderSource = source;

      this.visualizeAudioBuffer();
    } catch (error) {
      console.error('Error creating visualization:', error);
    }
  }

  private visualizeAudioBuffer(): void {
    if (
      !this.finalRenderCanvasRef?.nativeElement ||
      !this.finalRenderAnalyser ||
      !this.exportAudioElement?.nativeElement
    )
      return;

    const canvas = this.finalRenderCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.ngZone.runOutsideAngular(() => {
      const width = canvas.offsetWidth || canvas.clientWidth || 800;
      const height = canvas.offsetHeight || canvas.clientHeight || 200;
      canvas.width = width;
      canvas.height = height;

      const drawFrame = () => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();

        const bufferLength = this.finalRenderAnalyser!.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.finalRenderAnalyser!.getByteTimeDomainData(dataArray);

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };

      drawFrame();

      const render = () => {
        if (this.exportAudioElement!.nativeElement.paused && !this.isFinalRenderPlaying$.value) {
          return;
        }

        const currentWidth = canvas.offsetWidth || canvas.clientWidth || 800;
        const currentHeight = canvas.offsetHeight || canvas.clientHeight || 200;
        if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
          canvas.width = currentWidth;
          canvas.height = currentHeight;
        }

        drawFrame();
        this.finalRenderAnimationId = requestAnimationFrame(render);
      };

      if (!this.finalRenderAnimationId) {
        this.finalRenderAnimationId = requestAnimationFrame(render);
      }
    });
  }

  private stopFinalRenderVisualization(): void {
    if (this.finalRenderAnimationId) {
      cancelAnimationFrame(this.finalRenderAnimationId);
      this.finalRenderAnimationId = undefined;
    }

    if (this.finalRenderCanvasRef?.nativeElement) {
      const canvas = this.finalRenderCanvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (this.clonedAudioElement) {
      this.clonedAudioElement.pause();
      this.clonedAudioElement = undefined;
    }

    if (this.finalRenderSource) {
      if ('stop' in this.finalRenderSource) {
        try {
          this.finalRenderSource.stop();
        } catch (e) {
       
        }
      }
      this.finalRenderSource.disconnect();
      this.finalRenderSource = undefined;
    }

    if (this.finalRenderAudioContext) {
      this.finalRenderAudioContext.close();
      this.finalRenderAudioContext = undefined;
    }

    this.finalRenderAnalyser = undefined;
  }

  onTimeChange(value: number): void {
    this.audioService.setCurrentTime(value);
  }

  async exportAudio(): Promise<void> {
    this.isExporting = true;
    try {
      const audioBlob = await this.audioService.exportAudio();
      this.setExportUrl(audioBlob);
      this.downloadAudio(audioBlob, 'processed-audio.wav');
      this.snackBar.open('Audio exported successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      console.error('Error exporting audio:', error);
      this.snackBar.open('Failed to export audio', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.isExporting = false;
    }
  }

  private downloadAudio(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private setExportUrl(blob: Blob): void {
    this.revokeExportUrl();
    this.exportUrl = URL.createObjectURL(blob);
  }

  private revokeExportUrl(): void {
    if (this.exportUrl) {
      URL.revokeObjectURL(this.exportUrl);
      this.exportUrl = null;
    }
  }

  getProgressPercentage(currentTime: number, duration: number): number {
    if (!duration || isNaN(duration)) return 0;
    return (currentTime / duration) * 100;
  }
}
