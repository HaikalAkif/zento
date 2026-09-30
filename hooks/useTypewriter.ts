import { useEffect, useState } from 'react';

const TYPE_MS = 55;
const DELETE_MS = 25;
const HOLD_MS = 1600;
const GAP_MS = 350;

/**
 * Types each phrase out, holds, deletes it, moves on. Returns '' while inactive, so
 * callers can hide the effect the moment the field is in use.
 */
export function useTypewriter(phrases: string[], active: boolean): string {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!active || phrases.length === 0) {
      setText(''); // oxlint-disable-line react/set-state-in-effect -- resetting when the effect is switched off
      return;
    }

    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = phrases[phrase];
      if (!deleting) {
        chars++;
        setText(full.slice(0, chars));
        if (chars === full.length) {
          deleting = true;
          timer = setTimeout(tick, HOLD_MS);
          return;
        }
        timer = setTimeout(tick, TYPE_MS);
      } else {
        chars--;
        setText(full.slice(0, chars));
        if (chars === 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          timer = setTimeout(tick, GAP_MS);
          return;
        }
        timer = setTimeout(tick, DELETE_MS);
      }
    };

    timer = setTimeout(tick, GAP_MS);
    return () => clearTimeout(timer);
  }, [phrases, active]);

  return active ? text : '';
}
