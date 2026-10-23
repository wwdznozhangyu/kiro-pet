// Pronunciation via the Web Speech API (built into Chromium / Electron).
// We pick a voice matching the requested accent so UK vs US actually differ.

let voicesReady = false;

function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) {
      voicesReady = true;
      resolve(existing);
      return;
    }
    const handler = () => {
      voicesReady = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback in case the event never fires.
    window.setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], accent: 'uk' | 'us'): SpeechSynthesisVoice | undefined {
  const wantLang = accent === 'uk' ? 'en-gb' : 'en-us';
  return (
    voices.find((v) => v.lang.toLowerCase() === wantLang) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(accent === 'uk' ? 'en-g' : 'en-u')) ??
    voices.find((v) => v.lang.toLowerCase().startsWith('en'))
  );
}

export async function speak(text: string, accent: 'uk' | 'us'): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  const voices = await ensureVoices();
  void voicesReady;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = accent === 'uk' ? 'en-GB' : 'en-US';
  const voice = pickVoice(voices, accent);
  if (voice) utter.voice = voice;
  utter.rate = 0.9;
  utter.pitch = 1;
  window.speechSynthesis.speak(utter);
}
