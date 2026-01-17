import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AudioImporterComponent } from './components/audio-importer/audio-importer';
import { AudioControlsComponent } from './components/audio-controls/audio-controls';
import { AudioPlayerComponent } from './components/audio-player/audio-player';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatTabsModule,
    AudioImporterComponent,
    AudioControlsComponent,
    AudioPlayerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Angular Audio Studio');
}
