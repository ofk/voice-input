import type { VoiceRecognizerInstance } from './VoiceRecognizer';
import {
  STATE_STARTED,
  voiceRecognizerConfirm,
  voiceRecognizerNew,
  voiceRecognizerStart,
  voiceRecognizerState,
  voiceRecognizerStop,
} from './VoiceRecognizer';

export interface VoiceInputPlugin {
  dispose?: () => void;
  onResult?: (transcript: string, interim: boolean) => void;
  onUpdate?: (transcript: string) => void;
  onFinish?: (transcript: string) => void;
  onStateChange?: (state: { recording: boolean }) => void;
}

export interface VoiceInputOptions {
  lang?: string;
  plugins?: (VoiceInputPlugin | null | ((voiceInput: VoiceInput) => VoiceInputPlugin | null))[];
}

export class VoiceInput {
  R?: VoiceRecognizerInstance; // recognizer

  P: VoiceInputPlugin[]; // plugins

  constructor({ lang, plugins = [] }: VoiceInputOptions) {
    this.P = plugins
      .map((plugin) => (typeof plugin === 'function' ? plugin(this) : plugin))
      .filter((plugin): plugin is VoiceInputPlugin => !!plugin);

    try {
      this.R = voiceRecognizerNew(
        lang,
        (transcript, interim): void => {
          this.P.forEach((plugin) => {
            plugin.onResult?.(transcript, interim);
            if (interim) {
              plugin.onUpdate?.(transcript); // TODO: Rename onPendingResult
            } else {
              plugin.onFinish?.(transcript); // TODO: Rename onConfirm
            }
          });
        },
        (state): void => {
          this.P.forEach((plugin) => {
            plugin.onStateChange?.({ recording: state === STATE_STARTED });
          });
        },
        ({ error }): void => {
          console.error('[VoiceInput]', error);
        },
      );
    } catch (e) {
      console.error(e);
    }
  }

  dispose(): void {
    this.stop();
    delete this.R;
    this.P.splice(0).forEach((plugin) => {
      plugin.dispose?.();
    });
  }

  recording(): boolean | null {
    return this.R ? voiceRecognizerState(this.R) === STATE_STARTED : null;
  }

  start(): void {
    if (this.R) voiceRecognizerStart(this.R);
  }

  stop(): void {
    if (this.R) voiceRecognizerStop(this.R);
  }

  confirm(): void {
    if (this.R) voiceRecognizerConfirm(this.R);
  }

  toggle(): void {
    if (this.recording()) {
      this.stop();
    } else {
      this.start();
    }
  }
}
