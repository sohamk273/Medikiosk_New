import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  text: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ text, size = 220 }) => {
  const [svgString, setSvgString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;
    QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#064E3B',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        setSvgString(svg);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to generate QR code SVG:', err);
        setError('Could not render QR code');
      });
  }, [text, size]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-red-50 text-red-600 rounded-2xl text-xs font-semibold p-4 text-center border border-red-200"
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
