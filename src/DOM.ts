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
  fn: ((ev: WindowEventMap[K]) => void) | ((ev: WindowEventMap[K]) => boolean | undefined),
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
