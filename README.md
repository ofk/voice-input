# voice-input

voice-input allows you to easily add functionality to your website that enables voice input to the currently focused text area using shortcuts or buttons.

## Install

```sh
npm install voice-input
```

## Example

To use voice-input, import the `setup` function from 'voice-input' and call it:

```html
<!DOCTYPE html>
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
    <button data-voice-input>mic</button>
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

This will set up the voice input functionality, allowing you to utilize voice input in the currently focused text area on your website.
