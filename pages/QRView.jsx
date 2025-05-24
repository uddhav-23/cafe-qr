// src/pages/QRView.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';

export default function QRView() {
  const { id } = useParams();
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(id, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        setQrUrl(url);
      } catch (err) {
        console.error(err);
      }
    };
    generateQR();
  }, [id]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Booking QR Code</h1>
        {qrUrl && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={qrUrl} alt="QR Code" className="max-w-[300px] w-full" />
            </div>
            <p className="text-sm text-muted-foreground">
              Booking ID: {id}
            </p>
            <p className="text-sm text-muted-foreground">
              Please show this QR code when you arrive at the cafe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}