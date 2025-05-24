import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { verifyBooking } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, RotateCw, Upload, Power } from 'lucide-react';

export default function QRScanner() {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [html5QrCode, setHtml5QrCode] = useState(null);
    const [currentCamera, setCurrentCamera] = useState(null);
    const [scannerStatus, setScannerStatus] = useState('initializing');
    const [availableCameras, setAvailableCameras] = useState([]);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const fileInputRef = useRef(null);
    const readerRef = useRef(null);  // Added readerRef
    const navigate = useNavigate();

  // Function to safely stop the scanner
  const stopScanner = async () => {
    try {
      if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
      }
    } catch (err) {
      console.warn('Stop scanner warning:', err);
    }
  };

  // Function to fetch available cameras
  const fetchCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setAvailableCameras(devices);
      if (devices.length > 0) {
        setCurrentCamera(devices[0].id);
      }
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('No cameras found or permission denied');
      setScannerStatus('error');
    }
  };

  // Initialize QR scanner
  const initializeScanner = async () => {
    if (!currentCamera || !isCameraOn) return;

    setScannerStatus('initializing');
    try {
      // Stop existing scanner if running
      await stopScanner();

      // Create new scanner instance if it doesn't exist
      const scanner = html5QrCode || new Html5Qrcode("reader");
      if (!html5QrCode) {
        setHtml5QrCode(scanner);
      }

      await scanner.start(
        currentCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          try {
            setScannerStatus('verifying');
            const bookingResult = await verifyBooking(decodedText);
            setResult(bookingResult);
            setError(null);
            setScannerStatus('success');
            await stopScanner();
          } catch (err) {
            setError('Error verifying booking');
            setResult(null);
            setScannerStatus('error');
          }
        },
        (errorMessage) => {
          // Ignore QR code not found errors
          if (errorMessage.includes("QR code not found")) {
            return;
          }
          console.warn(`QR Code scanning error: ${errorMessage}`);
        }
      );

      setScannerStatus('ready');
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setScannerStatus('error');
      setError('Failed to start camera. Please check permissions.');
    }
  };

  // Effect to handle initial setup
  useEffect(() => {
    fetchCameras();
    return () => {
      stopScanner();
    };
  }, []);

  // Effect to handle camera changes and toggle
  useEffect(() => {
    if (isCameraOn && currentCamera) {
      initializeScanner();
    } else {
      stopScanner();
    }
  }, [currentCamera, isCameraOn]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setScannerStatus('verifying');
      await stopScanner();

      const scanner = html5QrCode || new Html5Qrcode("reader");
      const result = await scanner.scanFile(file, true);
      
      const bookingResult = await verifyBooking(result);
      setResult(bookingResult);
      setError(null);
      setScannerStatus('success');
    } catch (err) {
      console.error('Error scanning image:', err);
      setError('Could not read QR code from image');
      setScannerStatus('error');
    }
  };

  const handleCameraChange = async (deviceId) => {
    await stopScanner();
    setCurrentCamera(deviceId);
    setScannerStatus('switching');
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      await stopScanner();
    }
    setIsCameraOn(!isCameraOn);
  };

  const resetScanner = async () => {
    setResult(null);
    setError(null);
    await stopScanner();
    if (isCameraOn) {
      initializeScanner();
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      #reader {
        width: 100% !important;
        min-height: 300px !important;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }
      #reader video {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover;
        border-radius: 8px;
      }
      #reader__scan_region {
        background: transparent !important;
      }
      #reader__scan_region img {
        display: none;
      }
      .scan-region-highlight {
        border: 2px solid #fff !important;
        border-radius: 8px;
      }
      #reader__camera_selection, 
      #reader__status_text,
      #reader__dashboard_section_swaplink,
      #reader__dashboard_section_csr {
        display: none !important;
      }
      #reader__dashboard_section {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized header */}
      <nav className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          {/* Top row with back button and title */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-accent rounded-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">QR Scanner</h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          
          {/* Bottom row with controls */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-md flex items-center justify-center gap-2 min-w-[120px] ${
                isCameraOn 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <Power className="w-4 h-4" />
              <span className="text-sm">{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
            </button>
            
            {availableCameras.length > 0 && (
              <select
                value={currentCamera || ''}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="px-3 py-2 bg-background border rounded-md text-sm min-w-[150px] text-center"
                disabled={!isCameraOn}
              >
                {availableCameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 min-w-[120px]"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Upload Image</span>
            </button>
            <button
              onClick={resetScanner}
              className="p-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 flex items-center justify-center gap-2 min-w-[40px]"
              disabled={!isCameraOn}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-4 max-w-md">
        {/* QR Scanner View */}
        <div className="bg-card rounded-lg overflow-hidden mb-4 relative aspect-square">
          <div 
            id="reader" 
            ref={readerRef}
            className="w-full h-full"
          />
          {(!isCameraOn || scannerStatus !== 'ready') && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center p-4">
                {!isCameraOn ? (
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-12 h-12" />
                    <span className="text-lg">Camera is turned off</span>
                  </div>
                ) : (
                  <>
                    {scannerStatus === 'initializing' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-white"></div>
                        <span className="text-lg">Initializing camera...</span>
                      </div>
                    )}
                    {scannerStatus === 'switching' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-white"></div>
                        <span className="text-lg">Switching camera...</span>
                      </div>
                    )}
                    {scannerStatus === 'verifying' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-white"></div>
                        <span className="text-lg">Verifying QR code...</span>
                      </div>
                    )}
                    {scannerStatus === 'error' && (
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-red-500 text-3xl">⚠️</span>
                        <span className="text-lg">Camera error. Please reset.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span className="text-lg">{error}</span>
            </div>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className={`p-6 rounded-lg ${
            result.valid 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl mb-2">
                {result.valid ? '✅ Valid Ticket' : '❌ Invalid Ticket'}
              </h3>
              <p className="text-lg">{result.message}</p>
            </div>
            
            {result.data && (
              <div className="mt-6 space-y-3 text-center">
                <div className="p-4 bg-black/5 rounded-lg">
                  <p className="font-semibold text-lg">{result.data.fullName}</p>
                  <p className="text-sm opacity-75">{result.data.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-black/5 rounded-lg">
                    <p className="text-sm opacity-75">Date</p>
                    <p className="font-medium">{new Date(result.data.date).toLocaleDateString()}</p>
                  </div>
                  <div className="p-3 bg-black/5 rounded-lg">
                    <p className="text-sm opacity-75">Guests</p>
                    <p className="font-medium">{result.data.guests}</p>
                  </div>
                </div>
              </div>
            )}
            
            {result.scannedAt && (
              <div className="mt-4 text-center text-sm opacity-75 p-2 bg-black/5 rounded-lg">
                Previously scanned at:
                <br />
                {new Date(result.scannedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        {(result || error) && (
          <button
            onClick={resetScanner}
            className="w-full mt-4 p-3 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center gap-2 text-lg"
          >
            <RotateCw className="w-5 h-5" />
            Scan Another Code
          </button>
        )}
      </div>
    </div>
  );
}