import { useEffect, useState } from 'react';
import { getSettings } from '../../data/repo/meta';
import { daysToExam, toDay } from '../../engine/dates';
import { Button } from '../../ui/controls';
import { drawCard } from './cards';
import type { ShareCard } from './summary';
import styles from './ShareButton.module.css';

async function copyAndSave(file: File | null, text: string): Promise<string> {
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    // Clipboard refused; the image can still be saved.
  }
  if (file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
  if (copied && file) return 'Copied the text and saved the image.';
  if (file) return 'Saved the image.';
  return copied ? 'Copied the text.' : 'Could not share from this browser.';
}

/**
 * Share on a results screen. The image is drawn up front, because phone browsers only open the share
 * sheet straight after a tap. Nothing leaves the device until the user picks where to send it.
 */
export function ShareButton({ card, day }: { card: ShareCard; day: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('');
  const key = JSON.stringify(card);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const settings = await getSettings();
        const blob = await drawCard(card, day, daysToExam(toDay(new Date()), settings.examDay));
        if (live) setFile(new File([blob], `graphite-result-${day}.png`, { type: 'image/png' }));
      } catch {
        // No image on this browser: the text can still go.
      }
      if (live) setReady(true);
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, day]);

  const share = async () => {
    setStatus('');
    const payload: ShareData = file ? { files: [file], text: card.text } : { text: card.text };
    if (navigator.canShare?.(payload)) {
      try {
        await navigator.share(payload);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    setStatus(await copyAndSave(file, card.text));
  };

  return (
    <>
      <Button block variant="secondary" onClick={share} disabled={!ready}>
        Share
      </Button>
      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}
    </>
  );
}
