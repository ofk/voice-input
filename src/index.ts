import { equalEventKey } from 'dom-event-key';

import { focusElement, isTextField, registerGlobalEvent } from './DOM';
import type { VoiceInputOptions, VoiceInputPlugin } from './VoiceInput';
import { VoiceInput } from './VoiceInput';
import { VoiceRecognition, voiceRecognizerConfirm } from './VoiceRecognizer';

let instance: VoiceInput | undefined;

interface InsertInterimTextProps {
  insertText?: (text: string) => void;
  undo?: () => void;
  forceStackHistory?: () => void;
}

interface ComposeModalProps {
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
}

export interface SetupOptions extends Partial<VoiceInputOptions> {
  insertText?: ((text: string) => boolean) | null;
  insertInterimTextMode?: InsertInterimTextProps | boolean;
  stateAttribute?: string | null;
  composeModal?: ComposeModalProps | boolean;
  keyboardShortcut?: string | null;
  keyboardShortcutLongPressMode?: boolean;
  confirmKeyboarShortcut?: string | null;
  toggleButtonAttribute?: string | null;
  toggleButtonFocusAttribute?: string | null;
}

// It works with React controlled element.
const defaultInsertText = (text: string): boolean => {
  const elem = document.activeElement as HTMLElement | null;
  if (elem && (isTextField(elem) || elem.contentEditable)) {
    return elem.ownerDocument.execCommand('insertText', false, text);
  }
  return false;
};

const defaultUndo = (): boolean => {
  const elem = document.activeElement as HTMLElement | null;
  if (elem && (isTextField(elem) || elem.contentEditable)) {
    return elem.ownerDocument.execCommand('undo');
  }
  return false;
};

const defaultForceStackHistory = (): boolean => {
  const elem = document.activeElement as HTMLElement | null;
  if (elem) {
    if (isTextField(elem)) {
      elem.setSelectionRange(elem.selectionStart, elem.selectionEnd);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selection = window.getSelection()!;
      const range = selection.getRangeAt(0).cloneRange();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return true;
  }
  return false;
};

const defaultModalProps: ComposeModalProps = {
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
  insertText = defaultInsertText,
  insertInterimTextMode = false,
  stateAttribute = 'data-voice-input',
  composeModal = true,
  keyboardShortcut = 'Alt+v',
  keyboardShortcutLongPressMode = false,
  confirmKeyboarShortcut = null,
  toggleButtonAttribute = 'data-voice-input',
  toggleButtonFocusAttribute = 'data-voice-input-focus',
}: SetupOptions = {}): VoiceInput {
  instance?.dispose();
  instance = new VoiceInput({
    lang,
    plugins: [
      ...plugins,
      insertInterimTextMode
        ? (): VoiceInputPlugin => {
            const {
              insertText: insertInterimText = insertText ?? defaultInsertText,
              undo: undoInterimText = defaultUndo,
              forceStackHistory: forceStackHistoryInterimText = defaultForceStackHistory,
            } = typeof insertInterimTextMode === 'object' ? insertInterimTextMode : {};
            let updated = false;
            return {
              onUpdate: (transcript): void => {
                if (!updated) {
                  updated = true;
                  forceStackHistoryInterimText();
                } else {
                  undoInterimText();
                }
                insertInterimText(transcript);
              },
              onFinish: (): void => {
                if (updated) {
                  updated = false;
                  undoInterimText();
                }
              },
            };
          }
        : null,
      insertText ? { onFinish: insertText } : null,
      stateAttribute
        ? {
            onStateChange: (state): void => {
              document.querySelectorAll(`[${stateAttribute}]`).forEach((elem) => {
                elem.setAttribute(stateAttribute, state.recording ? 'recording' : 'stopped');
              });
            },
          }
        : null,
      composeModal
        ? (): VoiceInputPlugin => {
            const props = typeof composeModal === 'object' ? composeModal : defaultModalProps;
            let div: HTMLDivElement | undefined;
            return {
              dispose: (): void => {
                div?.parentNode?.removeChild(div);
              },
              onUpdate: (transcript): void => {
                div ??= document.body.appendChild(document.createElement('div'));
                if (props.className) div.className = props.className;
                Object.assign(div.style, { display: 'block', ...props.style });
                div.textContent = transcript;
              },
              onFinish: (): void => {
                if (div) Object.assign(div.style, { display: 'none' });
              },
            };
          }
        : null,
      keyboardShortcut && !keyboardShortcutLongPressMode
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
      keyboardShortcut && keyboardShortcutLongPressMode
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
      toggleButtonAttribute
        ? (v): VoiceInputPlugin => {
            const dispose = registerGlobalEvent('click', (event) => {
              // In the case of `<button><span/><button>`, event.target would be the HTMLSpanElement.
              const actionElement = (event.target as Element).closest(
                'a[href],button,input[type="button"]',
              );
              if (actionElement?.closest(`[${toggleButtonAttribute}]`)) {
                v.toggle();
                if (toggleButtonFocusAttribute && v.recording()) {
                  const selector = actionElement.getAttribute(toggleButtonFocusAttribute);
                  const focusElem = selector && document.querySelector<HTMLElement>(selector);
                  if (focusElem) {
                    focusElement(focusElem);
                  }
                }
                return false;
              }
              return true;
            });
            return { dispose };
          }
        : null,
    ],
  });
  return instance;
}

export const isSupported = !!VoiceRecognition;

export { VoiceInput };
