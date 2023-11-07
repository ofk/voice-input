export const Recognition =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export function isTextField(elem: Element): elem is HTMLInputElement | HTMLTextAreaElement {
  return elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA';
}

export function focusElement(elem: HTMLElement): void {
  if (elem !== document.activeElement) {
    elem.focus(); // The caret position is at begining after focusing.

    if (isTextField(elem)) {
      elem.setSelectionRange(elem.value.length, elem.value.length);
    } else {
      const range = document.createRange();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selection = window.getSelection()!;
      range.selectNodeContents(elem);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

export function registerGlobalEvent<K extends keyof WindowEventMap>(
  type: K,
  fn: (ev: WindowEventMap[K]) => boolean | void | undefined
): () => void {
  const listener = (ev: WindowEventMap[K]): void => {
    if (fn(ev) === false) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  };
  window.addEventListener(type, listener);
  return (): void => {
    window.removeEventListener(type, listener);
  };
}

const isMac = /Mac|iPod|iPhone|iPad/.test(
  typeof navigator !== 'undefined' ? navigator.platform : ''
);

export function testKeyboardShortcut(event: KeyboardEvent, keyboardShortcut: string): boolean {
  // TODO: Not a strict implementation.
  const keys = keyboardShortcut.toLowerCase().split('+');
  return (
    (keys.includes('mod')
      ? event[isMac ? 'metaKey' : 'ctrlKey']
      : event.ctrlKey === keys.includes('ctrl') && event.metaKey === keys.includes('meta')) &&
    event.altKey === keys.includes('alt') &&
    event.shiftKey === keys.includes('shift') &&
    event.code
      .replace(/^(?:Key|Digit)/, '')
      .replace(/^(Alt|Control|Meta)(?:Left|Right)$/, '$1')
      .toLowerCase() === keys[keys.length - 1]
  );
}
