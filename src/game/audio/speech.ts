/**
 * Browser text-to-speech is used only for model audio (listening prompts and
 * spoken examples). It is never used to fake a pronunciation score: speaking
 * answers are graded from the browser's speech recognition result or the typed
 * fallback, and the server decides correctness.
 */
export function speechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, rate = 1): boolean {
  if (!speechSynthesisSupported() || !text.trim()) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[a-z]/i.test(text) ? 'en-US' : 'id-ID';
    utterance.rate = Math.min(1.5, Math.max(0.5, rate));
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeech(): void {
  if (!speechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Speech synthesis can be blocked by the browser; nothing to clean up.
  }
}
