import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  Input,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-audio-visualizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-visualizer.html',
  styleUrl: './audio-visualizer.scss',
})
export class AudioVisualizerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() isFinalRenderPlaying: boolean = false;

  private destroy$ = new Subject<void>();
  private animationId: number | null = null;

  constructor(
    private audioService: AudioService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.audioService.isPlaying$.pipe(takeUntil(this.destroy$)).subscribe((isPlaying) => {
      if (isPlaying || this.isFinalRenderPlaying) {
        // Zawsze zatrzymaj stary animation frame przed uruchomieniem nowego
        this.stopRendering();
        this.startRendering();
      } else {
        this.stopRendering();
        this.clearCanvas();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isFinalRenderPlaying']) {
      if (this.isFinalRenderPlaying) {
        this.stopRendering();
        this.startRendering();
      } else {
        this.stopRendering();
        this.clearCanvas();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopRendering();
  }

  private startRendering(): void {
    const analyser = this.audioService.getAnalyserNode();
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!analyser || !ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      this.resizeCanvas();
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();

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

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }

  private stopRendering(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private clearCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
      canvas.width = Math.floor(width);
      canvas.height = Math.floor(height);
    }
  }
}
