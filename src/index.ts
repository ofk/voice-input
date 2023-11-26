import { equalEventKey } from 'dom-event-key';

import { focusElement, isTextField, registerGlobalEvent } from './DOM';
import type { VoiceInputOptions, VoiceInputPlugin } from './VoiceInput';
import { VoiceInput } from './VoiceInput';
import { VoiceRecognition, voiceRecognizerConfirm } from './VoiceRecognizer';

let instance: VoiceInput | undefined;

export interface SetupOptions extends Partial<VoiceInputOptions> {
  insertInput?: ((text: string) => boolean) | null; // TODO: Rename insertText
  modal?: { className?: string; style?: Partial<CSSStyleDeclaration> } | boolean; // TODO: Rename composeModal
  modalProps?: {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
  };
  keyboardShortcut?: string | null;
  keyboardShortcutPressing?: boolean; // TODO: Rename keyboardShortcutLongPressMode
  confirmKeyboarShortcut?: string | null;
  buttonShortcutAttribute?: string | null; // TODO: Rename toggleButtonAttribute
  buttonShortcutFocusAttribute?: string | null; // TODO: Rename toggleButtonFocusAttribute
}

const defaultInsertInput: NonNullable<SetupOptions['insertInput']> = (text) => {
  const elem = document.activeElement as HTMLElement | null;
  // It works with React controlled element.
  if (elem && (isTextField(elem) || elem.contentEditable)) {
    focusElement(elem);
    return elem.ownerDocument.execCommand('insertText', false, text);
  }
  return false;
};

const defaultModalProps: SetupOptions['modalProps'] = {
  className: 'voice-input-modal',
  style: {
    position: 'fixed',
    top: '80px',
    left: '50%',
    zIndex: '2147483647', // 0x7fffffff
    display: 'inline-block', // OR 'none'
    maxWidth: '50%',
    padding: '8px 16px',
    fontFamily: 'sans-serif',
    fontSize: '20px',
    lineHeight: '26px',
    color: '#333',
    textAlign: 'center',
    pointerEvents: 'none',
    backgroundColor: '#fffc',
    backdropFilter: 'blur(12px)',
    borderRadius: '8px',
    boxShadow: '0 0 0 1px #2222,0 4px 12px 0 #0002',
    transform: 'translateX(-50%)',
  },
};

export function setup({
  lang = navigator.language,
  plugins = [],
  insertInput = defaultInsertInput,
  modal = true,
  modalProps = defaultModalProps,
  keyboardShortcut = 'Alt+v',
  keyboardShortcutPressing = false,
  confirmKeyboarShortcut = null,
  buttonShortcutAttribute = 'data-voice-input',
  buttonShortcutFocusAttribute = 'data-voice-input-focus',
}: SetupOptions = {}): VoiceInput {
  instance?.dispose();
  instance = new VoiceInput({
    lang,
    plugins: [
      ...plugins,
      insertInput ? { onFinish: insertInput } : null,
      modal
        ? (): VoiceInputPlugin => {
            const props = typeof modal === 'object' ? modal : modalProps ?? defaultModalProps;
            let div: HTMLDivElement | undefined;
            return {
              dispose: (): void => {
                div?.parentNode?.removeChild(div);
              },
              onUpdate: (transcript): void => {
                div ??= document.body.appendChild(document.createElement('div'));
                if (props?.className) div.className = props.className;
                Object.assign(div.style, { display: 'block', ...props?.style });
                div.textContent = transcript;
              },
              onFinish: (): void => {
                if (div) Object.assign(div.style, { display: 'none' });
              },
            };
          }
        : null,
      keyboardShortcut && !keyboardShortcutPressing
        ? (v): VoiceInputPlugin => {
            const dispose = registerGlobalEvent('keydown', (evt) => {
              if (equalEventKey(keyboardShortcut, evt)) {
                v.toggle();
                return false;
              }
              return true;
            });
            return { dispose };
          }
        : null,
      keyboardShortcut && keyboardShortcutPressing
        ? (v): VoiceInputPlugin => {
            const disposeKeydown = registerGlobalEvent('keydown', (evt) => {
              if (equalEventKey(keyboardShortcut, evt)) {
                if (!v.recording()) {
                  v.start();
                }
                return false;
              }
              if (v.recording()) {
                v.stop();
              }
              return true;
            });
            const disposeKeyup = registerGlobalEvent('keyup', () => {
              if (v.recording()) {
                v.stop();
              }
            });
            return {
              dispose: (): void => {
                disposeKeydown();
                disposeKeyup();
              },
            };
          }
        : null,
      confirmKeyboarShortcut
        ? (v): VoiceInputPlugin => {
            const dispose = registerGlobalEvent('keydown', (evt) => {
              if (equalEventKey(confirmKeyboarShortcut, evt) && v.R) {
                voiceRecognizerConfirm(v.R);
                return false;
              }
              return true;
            });
            return { dispose };
          }
        : null,
      buttonShortcutAttribute
        ? (v): VoiceInputPlugin => {
            const dispose = registerGlobalEvent('click', (event) => {
              // In the case of `<button><span/><button>`, event.target would be the HTMLSpanElement.
              if ((event.target as Element).closest(`[${buttonShortcutAttribute}]`)) {
                v.toggle();
                if (buttonShortcutFocusAttribute && v.recording()) {
                  const selector = (event.target as Element).getAttribute(
                    buttonShortcutFocusAttribute,
                  );
                  const focusElem = selector && document.querySelector<HTMLElement>(selector);
                  if (focusElem) {
                    focusElement(focusElem);
                  }
                }
                return false;
              }
              return true;
            });
            return {
              dispose,
              onStateChange: (state): void => {
                document.querySelectorAll(`[${buttonShortcutAttribute}]`).forEach((elem) => {
                  elem.setAttribute(
                    buttonShortcutAttribute,
                    state.recording ? 'recording' : 'stopped',
                  );
                });
              },
            };
          }
        : null,
    ],
  });
  return instance;
}

export const isSupported = !!VoiceRecognition;

export { VoiceInput };
