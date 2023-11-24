import { focusElement, isTextField } from './DOM';
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
  onUpdate?: (transcript: string) => void;
  onFinish?: () => void;
  onStateChange?: (state: { recording: boolean }) => void;
}

export interface VoiceInputOptions {
  lang?: string;
  insertInput?: (text: string) => boolean;
  plugins?: (VoiceInputPlugin | null | ((voiceInput: VoiceInput) => VoiceInputPlugin | null))[];
}

export const kLang = 'lang';
export const kInsertInput = 'insertInput';
export const kPlugins = 'plugins';

const defaultInsertInput: NonNullable<VoiceInputOptions['insertInput']> = (text) => {
  const elem = document.activeElement as HTMLElement | null;
  // It works with React controlled element.
  if (elem && (isTextField(elem) || elem.contentEditable)) {
    focusElement(elem);
    return elem.ownerDocument.execCommand('insertText', false, text);
  }
  return false;
};

export class VoiceInput {
  R?: VoiceRecognizerInstance; // recognizer

  P: VoiceInputPlugin[]; // plugins

  constructor({
    [kLang]: lang,
    [kInsertInput]: insertInput = defaultInsertInput,
    [kPlugins]: plugins = [],
  }: VoiceInputOptions) {
    this.P = plugins
      .map((plugin) => (typeof plugin === 'function' ? plugin(this) : plugin))
      .filter((plugin): plugin is VoiceInputPlugin => !!plugin);

    try {
      this.R = voiceRecognizerNew(
        lang,
        (transcript, interim): void => {
          if (interim) {
            this.P.forEach((plugin) => {
              plugin.onUpdate?.(transcript);
            });
          } else {
            this.P.forEach((plugin) => {
              plugin.onFinish?.();
            });
            insertInput(transcript);
          }
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
