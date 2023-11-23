# voice-input

voice-input allows you to easily add functionality to your website that enables voice input to the currently focused text area using shortcuts or buttons.

## Install

```sh
npm install voice-input
```

## Usage

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>voice-input example</title>
    <style>
      [data-voice-input]::after {
        content: ' on';
      }
      [data-voice-input='recording']::after {
        content: ' off';
      }
    </style>
  </head>
  <body>
    <p>
      <button data-voice-input>mic</button>
    </p>
    <div>
      <textarea>textarea</textarea>
    </div>
    <div>
      <div contenteditable>contenteditable</div>
    </div>
    <script type="module">
      import { setup } from 'voice-input';
      setup();
    </script>
  </body>
</html>
```

This will set up the voice input feature and you will be able to use voice input in the text area by pressing the mic button or entering the `Alt+v` shortcut key.

## API

```ts
function setup(options: {
  // Supported language.
  lang?: string; // = navigator.language
  // Enable speech modal.
  modal?: boolean; // = true
  // Properties of speech modal.
  modalProps?: {
    className?: string;
    style?: Partial<CSSStyleDeclaration>;
  };
  // Specifying a keyboard shortcuts. Disable with empty string.
  // Uppercase letter requires shift key (ex. Alt+V = Alt+Shift+v).
  keyboardShortcut?: string; // = 'Alt+v'
  // Activate when pressing the key.
  keyboardShortcutPressing?: boolean; // = false
  // Specifying a keyboard shortcut to confirm input. Disable with empty string.
  confirmKeyboarShortcut?: string; // = ''
  // Spectfying a button selector to toggle voice input.
  buttonShortcutAttribute?: string; // = 'data-voice-input',
  // Spectfying a button selector to focus a text area.
  buttonShortcutFocusAttribute?: string; // = 'data-voice-input-focus',
  // Plugin. For specific usage, please refer to src/VoiceInput.ts.
  plugins?: {
    dispose?: () => void;
    onUpdate?: (transcript: string) => void;
    onFinish?: () => void;
    onStateChange?: (state: { recording: boolean }) => void;
  }[];
}): void;
```
