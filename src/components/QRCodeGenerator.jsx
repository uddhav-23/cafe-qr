import { useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';  // Changed from QRCode to QRCodeSVG

export function QRCodeGenerator({ value, size = 256 }) {
  const qrRef = useRef();

  const downloadQRCode = useCallback(() => {
    if (qrRef.current) {
      const svg = qrRef.current.querySelector('svg');
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Set canvas size to match SVG size
      canvas.width = size;
      canvas.height = size;
      
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'qr-code.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  }, [size]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={qrRef} className="bg-white p-4 rounded-lg">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      <button
        onClick={downloadQRCode}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Download QR Code
      </button>
    </div>
  );
}