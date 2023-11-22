import { focusElement, isTextField, registerGlobalEvent } from './DOM';
import type { VoiceInputOptions } from './VoiceInput';
import {
  VoiceInput,
  kButtonShortcutAttribute,
  kButtonShortcutFocusAttribute,
  kConfirmKeyboarShortcut,
  kGetInsertionTarget,
  kInsertText,
  kKeyboardShortcut,
  kLang,
  kModalProps,
  kOnStateChange,
  kSetupButtonShortcut,
  kSetupConfirmKeyboardShortcut,
  kSetupKeyboardShortcut,
  kUpdateButtonShortcutAttribute,
  kUpdateModal,
} from './VoiceInput';
import { VoiceRecognition } from './VoiceRecognizer';

let instance: VoiceInput | undefined;

const defaultModalProps: VoiceInputOptions['modalProps'] = {
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

const defaultUpdateModal = ((): VoiceInputOptions['updateModal'] => {
  let div: HTMLDivElement | undefined;
  return ({ className, style, children }) => {
    div ??= document.body.appendChild(document.createElement('div'));
    if (className) div.className = className;
    if (style) Object.assign(div.style, style);
    if (children != null) div.textContent = children;
  };
})();

const defaultGetInsertionTarget: VoiceInputOptions['getInsertionTarget'] = () =>
  document.activeElement as HTMLElement | null;

const defaultInsertText: VoiceInputOptions['insertText'] = (text, elem) => {
  // It works with React controlled element.
  if (elem && (isTextField(elem) || elem.contentEditable)) {
    focusElement(elem);
    return elem.ownerDocument.execCommand('insertText', false, text);
  }
  return false;
};

const defaultSetupButtonShortcut: VoiceInputOptions['setupButtonShortcut'] = (fn) =>
  registerGlobalEvent('click', fn);

const defaultUpdateButtonShortcutAttribute: VoiceInputOptions['updateButtonShortcutAttribute'] = (
  attribute,
  state,
) => {
  document.querySelectorAll(`[${attribute}]`).forEach((elem) => {
    elem.setAttribute(attribute, state.recording ? 'recording' : 'stopped');
  });
};

const defaultSetupKeyboardShortcut: VoiceInputOptions['setupKeyboardShortcut'] = (fn) =>
  registerGlobalEvent('keydown', fn);

export function setup({
  [kLang]: lang = navigator.language,
  [kOnStateChange]: onStateChange,
  [kModalProps]: modalProps = defaultModalProps,
  [kUpdateModal]: updateModal = defaultUpdateModal,
  [kGetInsertionTarget]: getInsertionTarget = defaultGetInsertionTarget,
  [kInsertText]: insertText = defaultInsertText,
  [kButtonShortcutAttribute]: buttonShortcutAttribute = 'data-voice-input',
  [kButtonShortcutFocusAttribute]: buttonShortcutFocusAttribute = 'data-voice-input-focus',
  [kSetupButtonShortcut]: setupButtonShortcut = defaultSetupButtonShortcut,
  [kUpdateButtonShortcutAttribute]:
    updateButtonShortcutAttribute = defaultUpdateButtonShortcutAttribute,
  [kKeyboardShortcut]: keyboardShortcut = 'Alt+V',
  [kSetupKeyboardShortcut]: setupKeyboardShortcut = defaultSetupKeyboardShortcut,
  [kConfirmKeyboarShortcut]: confirmKeyboarShortcut = null,
  [kSetupConfirmKeyboardShortcut]: setupConfirmKeyboardShortcut = defaultSetupKeyboardShortcut,
}: Partial<VoiceInputOptions> = {}): VoiceInput {
  instance?.dispose();
  instance = new VoiceInput({
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
  });
  return instance;
}

export const isSupported = !!VoiceRecognition;

export { VoiceInput };
