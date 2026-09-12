import QRCode from "qrcode";

/**
 * Generate a base64 DataURL representing the QR code for a ticket or booking.
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#0F172A", // Slate-900
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    // Fallback simple SVG data uri
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="10" y="100" font-size="12" fill="black">${encodeURIComponent(data)}</text></svg>`;
  }
}
