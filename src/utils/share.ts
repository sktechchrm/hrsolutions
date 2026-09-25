const APP_CREDIT = '📱 Mario Calculator\nby Saiful Islam (Sumir)';

/**
 * Share text via the Web Share API (mobile), WhatsApp web (desktop),
 * or clipboard as last fallback.
 * Uses window.open instead of window.location.href to avoid navigating away.
 */
export const shareWA = async (text: string): Promise<void> => {
  // Prefer native Web Share API — works on Android/iOS Chrome without leaving the page
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // User cancelled or not supported — fall through to WhatsApp
    }
  }

  const encoded = encodeURIComponent(text);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    // Use window.open instead of window.location.href to avoid navigating away from the app
    window.open(`whatsapp://send?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
};

/**
 * Build a formatted share message.
 * @param title  - The calculator name (e.g. 'BMI', 'EMI')
 * @param lines  - Array of result lines to include
 */
export const buildShare = (title: string, lines: string[]): string =>
  `${title} — Mario Calculator\n\n${lines.filter(Boolean).join('\n')}\n\n${APP_CREDIT}`;
