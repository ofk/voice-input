/* eslint-disable no-param-reassign */

import { Recognition } from './DOM';

// The class is written in C-style for minification optimization.

export type VoiceRecognizerInstance = [
  recognition: SpeechRecognition,
  isStopped: boolean,
  finalTranscript: string,
  interimTranscript: string,
  onResult?: (transcript: string, interim?: boolean) => void,
  onStateChange?: (isStopped: boolean) => void
];

const kRecognition = 0;
const kIsStopped = 1;
const kFinalTranscript = 2;
const kInterimTranscript = 3;
const kOnResult = 4;
const kOnStateChange = 5;

function voiceRecognizerStateChange(instance: VoiceRecognizerInstance, isStopped: boolean): void {
  if (instance[kIsStopped] !== isStopped) {
    instance[kIsStopped] = isStopped;
    instance[kOnStateChange]?.(isStopped);
  }
}

export function voiceRecognizerNew(
  lang = '',
  onResult?: VoiceRecognizerInstance[4],
  onStateChange?: VoiceRecognizerInstance[5]
): VoiceRecognizerInstance {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const recognition = new Recognition!();
  const instance: VoiceRecognizerInstance = [recognition, true, '', '', onResult, onStateChange];
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
    if (!instance[kIsStopped]) instance[kRecognition].start();
  };
  recognition.onerror = (event): void => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    console.error(`${Recognition!.name} error: ${event.error}`);
    voiceRecognizerStateChange(instance, true);
  };
  return instance;
}

export function voiceRecognizerStart(instance: VoiceRecognizerInstance): void {
  if (instance[kIsStopped]) {
    voiceRecognizerStateChange(instance, false);
    instance[kRecognition].start();
  }
}

export function voiceRecognizerStopped(instance: VoiceRecognizerInstance): boolean {
  return instance[kIsStopped];
}

export function voiceRecognizerStop(instance: VoiceRecognizerInstance): void {
  if (!instance[kIsStopped]) {
    instance[kFinalTranscript] = '';
    instance[kInterimTranscript] = '';
    voiceRecognizerStateChange(instance, true);
    instance[kRecognition].stop();
  }
}

export function voiceRecognizerConfirm(instance: VoiceRecognizerInstance): void {
  if (!instance[kIsStopped] && (instance[kFinalTranscript] || instance[kInterimTranscript])) {
    instance[kRecognition].stop(); // `onresult` is called.
  }
}
