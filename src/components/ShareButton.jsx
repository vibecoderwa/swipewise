import { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = window.location.origin;
    const data = {
      title: 'Swipewise',
      text: 'See which credit card you should use, every time. Connect once, stop leaving rewards on the table.',
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  return (
    <button className="brand-action" onClick={onClick} aria-label="Share Swipewise">
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}
