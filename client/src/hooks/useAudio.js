import { useRef, useCallback } from "react";
import { fetchAudio } from "../lib/api";

/**
 * Manages TTS playback.
 *
 * Strategy:
 * - Fetch audio as soon as text is ready (parallel to any ongoing playback)
 * - Play audio, driving the transcript typewriter via onProgress callbacks
 * - Resolve only when audio finishes so the debate loop stays sequential
 */
export function useAudio() {
  const queue = useRef([]);
  const playing = useRef(false);
  const currentAudio = useRef(null);
  const userInteracted = useRef(false);

  // Call this on any user click to unlock autoplay
  const unlockAutoplay = useCallback(() => {
    userInteracted.current = true;
  }, []);

  const processQueue = useCallback(() => {
    if (queue.current.length === 0) {
      playing.current = false;
      return;
    }

    playing.current = true;
    const { audioPromise, text, onProgress, onEnd } = queue.current.shift();

    audioPromise.then((url) => {
      if (!url) {
        // TTS failed — still typewrite the text at a fixed pace
        typewriteFallback(text, onProgress, onEnd, () => processQueue());
        return;
      }

      const audio = new Audio(url);
      audio.preload = "auto";
      currentAudio.current = audio;

      audio.onplay = () => {
        // Drive typewriter from audio duration
        driveTypewriter(audio, text, onProgress);
      };

      audio.onended = () => {
        onProgress(text); // ensure full text is shown
        URL.revokeObjectURL(url);
        onEnd?.();
        currentAudio.current = null;
        processQueue();
      };

      audio.onerror = () => {
        // Audio error — fall back to typewriter
        typewriteFallback(text, onProgress, onEnd, () => processQueue());
      };

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay blocked — typewrite without audio
          typewriteFallback(text, onProgress, onEnd, () => processQueue());
        });
      }
    }).catch(() => {
      typewriteFallback(text, onProgress, onEnd, () => processQueue());
    });
  }, []);

  /**
   * Drives the transcript typewriter in sync with audio playback.
   * Uses audio.currentTime to determine how much text to reveal.
   */
  function driveTypewriter(audio, text, onProgress) {
    const words = text.split(" ");
    let rafId = null;

    function tick() {
      if (!audio || audio.paused || audio.ended) return;

      const elapsed = audio.currentTime;
      const duration = audio.duration || 1;
      const progress = Math.min(elapsed / duration, 1);

      // Reveal words proportionally to playback position
      const wordsToShow = Math.ceil(progress * words.length);
      const partial = words.slice(0, wordsToShow).join(" ");
      onProgress(partial);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);

    // Clean up on audio end
    audio.onended = () => {
      cancelAnimationFrame(rafId);
      onProgress(text);
    };
  }

  /**
   * Fallback when audio is unavailable — typewrite at a natural reading pace.
   * ~200 words per minute = ~300ms per word
   */
  function typewriteFallback(text, onProgress, onEnd, onComplete) {
    const words = text.split(" ");
    const MS_PER_WORD = 120; // feels natural, not too slow
    let i = 0;

    function next() {
      if (i >= words.length) {
        onProgress(text);
        onEnd?.();
        onComplete();
        return;
      }
      i++;
      onProgress(words.slice(0, i).join(" "));
      setTimeout(next, MS_PER_WORD);
    }

    next();
  }

  /**
   * Enqueue a TTS job.
   *
   * @param {string}   text        Full text to speak
   * @param {string}   voiceId     ElevenLabs or OpenAI voice ID
   * @param {Function} onProgress  Called with partial text as audio plays
   * @param {Function} onEnd       Called when audio finishes
   */
  const enqueue = useCallback((text, voiceId, onProgress, onEnd) => {
    const audioPromise = voiceId
      ? fetchAudio(text, voiceId).catch(() => null)
      : Promise.resolve(null);

    queue.current.push({ audioPromise, text, onProgress, onEnd });

    if (!playing.current) {
      processQueue();
    }
  }, [processQueue]);

  const stop = useCallback(() => {
    queue.current = [];
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    playing.current = false;
  }, []);

  return { enqueue, stop, unlockAutoplay };
}