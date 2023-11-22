import { equalEventKey } from 'dom-event-key';

import { focusElement, registerGlobalEvent } from './DOM';
import type { VoiceInputOptions, VoiceInputPlugin } from './VoiceInput';
import { VoiceInput, kInsertInput, kLang, kPlugins } from './VoiceInput';
import { VoiceRecognition, voiceRecognizerConfirm } from './VoiceRecognizer';

let instance: VoiceInput | undefined;

export interface SetupOptions extends Partial<VoiceInputOptions> {
  modal?: boolean;
  modalProps?: {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
  };
  keyboardShortcut?: string;
  keyboardShortcutPressing?: boolean;
  confirmKeyboarShortcut?: string;
  buttonShortcutAttribute?: string;
  buttonShortcutFocusAttribute?: string;
}

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
  [kLang]: lang = navigator.language,
  [kInsertInput]: insertInput,
  [kPlugins]: plugins = [],
  modal = true,
  modalProps = defaultModalProps,
  keyboardShortcut = 'Alt+v',
  keyboardShortcutPressing,
  confirmKeyboarShortcut,
  buttonShortcutAttribute = 'data-voice-input',
  buttonShortcutFocusAttribute = 'data-voice-input-focus',
}: SetupOptions = {}): VoiceInput {
  instance?.dispose();
  instance = new VoiceInput({
    [kLang]: lang,
    [kInsertInput]: insertInput,
    [kPlugins]: [
      ...plugins,
      modal
        ? (): VoiceInputPlugin => {
            let div: HTMLDivElement | undefined;
            return {
              dispose: (): void => {
                div?.parentNode?.removeChild(div);
              },
              onUpdate: (transcript): void => {
                div ??= document.body.appendChild(document.createElement('div'));
                if (modalProps?.className) div.className = modalProps.className;
                Object.assign(div.style, { display: 'block', ...modalProps?.style });
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
              if (v.recording()) {
                if (!equalEventKey(keyboardShortcut, evt)) {
                  v.stop();
                }
                return true;
              }
              if (equalEventKey(keyboardShortcut, evt)) {
                v.start();
                return false;
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
              }
              return false;
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
