/* eslint-disable no-param-reassign */

export const VoiceRecognition =
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// The class is written in C-style for minification optimization.

export type VoiceRecognizerInstance = [
  recognition: SpeechRecognition,
  state: number,
  finalTranscript: string,
  interimTranscript: string,
  onResult?: (transcript: string, interim?: boolean) => void,
  onStateChange?: (state: number) => void,
  onError?: (error: SpeechRecognitionErrorEvent) => void,
];

const kRecognition = 0;
const kState = 1;
const kFinalTranscript = 2;
const kInterimTranscript = 3;
const kOnResult = 4;
const kOnStateChange = 5;
const kOnError = 6;

export const STATE_UNSTARTED = -1;
export const STATE_STARTED = 0;
export const STATE_STOPPED = 1;

function voiceRecognizerStateChange(instance: VoiceRecognizerInstance, state: number): void {
  if (instance[kState] !== state) {
    instance[kState] = state;
    instance[kOnStateChange]?.(state);
  }
}

export function voiceRecognizerNew(
  lang = '',
  onResult?: VoiceRecognizerInstance[4],
  onStateChange?: VoiceRecognizerInstance[5],
  onError?: VoiceRecognizerInstance[6],
): VoiceRecognizerInstance {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const recognition = new VoiceRecognition!();
  const instance: VoiceRecognizerInstance = [
    recognition,
    STATE_UNSTARTED,
    '',
    '',
    onResult,
    onStateChange,
    onError,
  ];
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = lang;
  recognition.onresult = (event): void => {
    instance[kInterimTranscript] = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = event.results[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      instance[result.isFinal ? kFinalTranscript : kInterimTranscript] += result[0]!.transcript;
    }
    // There is no word divider in Japanese and Chinese. cf. https://en.wikipedia.org/wiki/Word_divider#None
    // Therefore, remove spaces between characters in Japanese and Chinese.
    const transcript = (instance[kFinalTranscript] + instance[kInterimTranscript])
      .replace(/([ぁ-んァ-ヶー一-龠])\s+(?=[ぁ-んァ-ヶー一-龠])/g, '$1')
      .trim();
    const interim = !!instance[kInterimTranscript].trim();
    if (transcript) {
      instance[kOnResult]?.(transcript, interim);
    }
    if (!interim) {
      instance[kFinalTranscript] = '';
    }
  };
  recognition.onend = (): void => {
    // Continues the recognition unless explicitly stopped by the user.
    if (instance[kState] === STATE_STARTED) instance[kRecognition].start();
  };
  recognition.onerror = (event): void => {
    voiceRecognizerStateChange(instance, STATE_STOPPED);
    instance[kOnError]?.(event);
  };
  return instance;
}

export function voiceRecognizerStart(instance: VoiceRecognizerInstance): void {
  if (instance[kState] !== STATE_STARTED) {
    voiceRecognizerStateChange(instance, STATE_STARTED);
    instance[kRecognition].start();
  }
}

export function voiceRecognizerState(instance: VoiceRecognizerInstance): number {
  return instance[kState];
}

export function voiceRecognizerStop(instance: VoiceRecognizerInstance): void {
  if (instance[kState] === STATE_STARTED) {
    instance[kFinalTranscript] = '';
    instance[kInterimTranscript] = '';
    voiceRecognizerStateChange(instance, STATE_STOPPED);
    instance[kRecognition].stop();
  }
}

export function voiceRecognizerConfirm(instance: VoiceRecognizerInstance): void {
  if (
    instance[kState] === STATE_STARTED &&
    (instance[kFinalTranscript] || instance[kInterimTranscript])
  ) {
    instance[kRecognition].stop(); // `onresult` is called.
  }
}
