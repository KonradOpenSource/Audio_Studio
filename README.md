# Angular Audio Studio

Web Audio Studio is a lightweight web application for quick audio editing in your browser, without installing heavy tools like Audacity or Ableton. It allows you to import your own audio files, modify the sound using simple sliders and presets (e.g., Voice Boost, Podcast Clean, TikTok Bass), and export the finished file.
The application is aimed at web creators, marketers, educators, and hobbyists who need a simple and accessible audio tool. It utilizes the Web Audio API for audio processing and real-time waveform and frequency visualization, combining an intuitive interface with advanced web technology.

💻 Tech Stack:



Angular_Design is developed using following technologies:



![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)   ![SASS](https://img.shields.io/badge/SASS-hotpink.svg?style=for-the-badge&logo=SASS&logoColor=white) ![Angular](https://img.shields.io/badge/angular-%23DD0031.svg?style=for-the-badge&logo=angular&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)  ![RxJS](https://img.shields.io/badge/rxjs-%23B7178C.svg?style=for-the-badge&logo=reactivex&logoColor=white) Angular Material


Testing:

# 💻 Tech Stack:
![Vitest](https://img.shields.io/badge/-Vitest-252529?style=for-the-badge&logo=vitest&logoColor=FCC72B)



[![](https://visitcount.itsvg.in/api?id=ggggf&icon=0&color=0)](https://visitcount.itsvg.in)



## Features

- **Audio Import**: MP3/WAV/WebM/OGG file support
- **Sample Library**: Pre-built audio samples from assets
- **Real-time DSP Effects**:
  - Volume, Bass, Mid, Treble, Gain controls
  - Reverb, Delay, Echo Feedback effects
  - Distortion, Playback Rate, Pitch Shift
- **Audio Presets**: Normal, LoFi, Deep Bass, Chipmunk, Robot, Stadium Echo
- **Waveform Visualization**: Canvas-based audio analyzer using AnalyserNode
- **WAV Export**: OfflineAudioContext rendering for high-quality export
- **Playback Controls**: Preview and final render modes
- **Reactive UI**: RxJS BehaviorSubject for state management

## Technology Stack

- **Angular 21** – Standalone components architecture
- **RxJS** – Subject/BehaviorSubject for state and control streams
- **Angular Material** – Modern UI components
- **Web Audio API** – Real-time audio processing
- **OfflineAudioContext** – Non-blocking WAV rendering and export

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser with Web Audio API support

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   ng serve
   ```

3. Open browser and navigate to `http://localhost:4200/`

### Building for Production

```bash
ng build
```

The build artifacts will be in the `dist/` folder.

## Testing

### Running Tests

```bash
npm test
```

This runs the complete test suite using Vitest with 90% coverage (55/61 tests passing).

### Test Coverage

- **PresetService**: 12/12 tests ✅ (100%)
- **AudioExportService**: 9/9 tests ✅ (100%)
- **AudioControlsComponent**: 20/20 tests ✅ (100%)
- **AudioService**: 14/16 tests ✅ (87.5%)

The test suite covers:

- All business logic (presets, audio export)
- UI components (audio controls)
- Core audio operations
- Reactive state management

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── audio-importer/     # File/sample import UI
│   │   ├── audio-controls/      # DSP effects and presets
│   │   ├── audio-player/        # Playback controls and visualization
│   │   └── audio-visualizer/  # Waveform display
│   ├── services/
│   │   ├── audio.ts           # Core audio processing service
│   │   ├── preset.service.ts   # Preset management
│   │   └── audio-export.service.ts # WAV export
│   └── assets/audio/          # Sample audio files
└── styles/
```

## Architecture

### Core Services

- **AudioService**: Manages Web Audio API nodes, audio buffers, playback, and reactive state
- **PresetService**: Handles audio presets and provides RxJS streams
- **AudioExportService**: WAV encoder with non-blocking export using OfflineAudioContext

### Component Architecture

- **Standalone Components**: Angular 21 standalone component architecture
- **Reactive Design**: Components subscribe to RxJS streams for real-time updates
- **Material Design**: Angular Material components for consistent UI

### Audio Processing Pipeline

1. **Input**: File upload or sample selection
2. **Decoding**: Web Audio API decodeAudioData()
3. **Processing**: Real-time DSP effects through connected nodes
4. **Visualization**: AnalyserNode for waveform display
5. **Export**: OfflineAudioContext rendering to WAV

## How It Works

### Audio Loading

1. User selects file or sample
2. File is decoded using `AudioContext.decodeAudioData()`
3. Audio buffer is stored and metadata extracted
4. Audio nodes are created and connected

### Real-time Effects

1. Each effect corresponds to a Web Audio API node:
   - **Filters**: BiquadFilterNode (bass/mid/treble)
   - **Delay**: DelayNode + feedback loop
   - **Reverb**: ConvolverNode with impulse response
   - **Distortion**: WaveShaperNode with custom curve
2. Effects are applied through connected audio graph
3. Real-time parameter updates via RxJS streams

### Visualization

1. AnalyserNode captures frequency/time domain data
2. Canvas renders waveform in real-time
3. Smooth animation using requestAnimationFrame

### Export Process

1. OfflineAudioContext creates isolated rendering environment
2. Audio graph is reconstructed with current settings
3. Audio is rendered to buffer
4. WAV encoder creates binary format
5. Blob is downloaded without blocking UI

## Browser Support

- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

Requires Web Audio API and Canvas support.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
