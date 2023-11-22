import { focusElement, testKeyboardShortcut } from './DOM';
import type { VoiceRecognizerInstance } from './VoiceRecognizer';
import {
  voiceRecognizerConfirm,
  voiceRecognizerNew,
  voiceRecognizerStart,
  voiceRecognizerStop,
  voiceRecognizerStopped,
} from './VoiceRecognizer';

interface StateProps {
  recording: boolean;
}

interface ModalProps {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  children?: string;
}

type SetupFunction<E extends Event> = (
  fn: ((event: E) => void) | ((event: E) => boolean | undefined),
) => () => void;

export interface VoiceInputOptions {
  lang?: string;
  onStateChange?: (state: StateProps) => void;
  modalProps?: ModalProps;
  updateModal: (props: ModalProps) => void;
  getInsertionTarget: () => HTMLElement | null;
  insertText: (text: string, elem: HTMLElement | null) => boolean;
  buttonShortcutAttribute?: string | null;
  buttonShortcutFocusAttribute?: string | null;
  setupButtonShortcut?: SetupFunction<MouseEvent>;
  updateButtonShortcutAttribute?: (attribute: string, state: StateProps) => void;
  keyboardShortcut?: string | null;
  setupKeyboardShortcut?: SetupFunction<KeyboardEvent>;
  confirmKeyboarShortcut?: string | null;
  setupConfirmKeyboardShortcut?: SetupFunction<KeyboardEvent>;
}

export const kLang = 'lang';
export const kOnStateChange = 'onStateChange';
export const kModalProps = 'modalProps';
export const kUpdateModal = 'updateModal';
export const kGetInsertionTarget = 'getInsertionTarget';
export const kInsertText = 'insertText';
export const kButtonShortcutAttribute = 'buttonShortcutAttribute';
export const kButtonShortcutFocusAttribute = 'buttonShortcutFocusAttribute';
export const kSetupButtonShortcut = 'setupButtonShortcut';
export const kUpdateButtonShortcutAttribute = 'updateButtonShortcutAttribute';
export const kKeyboardShortcut = 'keyboardShortcut';
export const kSetupKeyboardShortcut = 'setupKeyboardShortcut';
export const kConfirmKeyboarShortcut = 'confirmKeyboarShortcut';
export const kSetupConfirmKeyboardShortcut = 'setupConfirmKeyboardShortcut';

export class VoiceInput {
  R?: VoiceRecognizerInstance; // recognizer

  X: (() => void)[]; // cleanupCallbacks

  constructor({
    [kLang]: lang,
    [kOnStateChange]: onStateChange,
    [kModalProps]: modalProps,
    [kUpdateModal]: updateModal,
    [kGetInsertionTarget]: getInsertionTarget,
    [kInsertText]: insertText,
    [kButtonShortcutAttribute]: buttonShortcutAttribute,
    [kButtonShortcutFocusAttribute]: buttonShortcutFocusAttribute,
    [kSetupButtonShortcut]: setupButtonShortcut,
    [kUpdateButtonShortcutAttribute]: updateButtonShortcutAttribute,
    [kKeyboardShortcut]: keyboardShortcut,
    [kSetupKeyboardShortcut]: setupKeyboardShortcut,
    [kConfirmKeyboarShortcut]: confirmKeyboarShortcut,
    [kSetupConfirmKeyboardShortcut]: setupConfirmKeyboardShortcut,
  }: VoiceInputOptions) {
    this.X = [];

    try {
      this.R = voiceRecognizerNew(
        lang,
        (transcript, interim): void => {
          if (interim) {
            updateModal({ ...modalProps, children: transcript });
          } else {
            updateModal({ ...modalProps, style: { display: 'none' }, children: '' });
            insertText(transcript, getInsertionTarget());
          }
        },
        (isStopped): void => {
          const state = { recording: !isStopped };
          if (buttonShortcutAttribute) {
            updateButtonShortcutAttribute?.(buttonShortcutAttribute, state);
          }
          onStateChange?.(state);
        },
      );

      this.X.push(() => {
        this.stop();
        delete this.R;
      });

      if (buttonShortcutAttribute && setupButtonShortcut) {
        this.X.push(
          setupButtonShortcut((event) => {
            // In the case of `<button><span/><button>`, event.target would be the HTMLSpanElement.
            if (!(event.target as Element).closest(`[${buttonShortcutAttribute}]`)) return true;
            this.toggle();
            if (buttonShortcutFocusAttribute && this.recording()) {
              const selector = (event.target as Element).getAttribute(buttonShortcutFocusAttribute);
              const focusElem = selector && document.querySelector<HTMLElement>(selector);
              if (focusElem) {
                focusElement(focusElem);
              }
            }
            return false;
          }),
        );
      }

      if (keyboardShortcut && setupKeyboardShortcut) {
        this.X.push(
          setupKeyboardShortcut((event) => {
            if (!testKeyboardShortcut(event, keyboardShortcut)) return true;
            this.toggle();
            return false;
          }),
        );
      }

      if (confirmKeyboarShortcut && setupConfirmKeyboardShortcut) {
        this.X.push(
          setupConfirmKeyboardShortcut((event) => {
            if (!testKeyboardShortcut(event, confirmKeyboarShortcut) || !this.R) return true;
            voiceRecognizerConfirm(this.R);
            return false;
          }),
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  dispose(): void {
    this.X.splice(0).forEach((cleanup) => {
      cleanup();
    });
  }

  recording(): boolean | null {
    return this.R ? !voiceRecognizerStopped(this.R) : null;
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
