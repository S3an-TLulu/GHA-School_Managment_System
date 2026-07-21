import QRCode from 'qrcode';

// Build the in-app deep link a uniform item's QR code points to. Scanning it
// opens the app at the item's page (App reads the #uniform/<id> hash on load).
export function itemDeepLink(itemId: string): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#uniform/${itemId}`;
}

// Generate a PNG data URL for a QR code encoding the given text.
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
}
