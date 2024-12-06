import { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan as ScanIcon, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScanResult } from '../types';
import { fetchSupplementInfo } from '../services/supplementApi';

interface ScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export function Scanner({ onScanComplete }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setScanning(true);
      setHasPermission(true);
      toast.success('Camera activated');

      // Here we would initialize Quagga or another barcode scanning library
      // For demonstration, we'll simulate a scan after 3 seconds
      setTimeout(async () => {
        const mockBarcode = '123456789';
        setLoading(true);
        
        try {
          const nutritionalInfo = await fetchSupplementInfo(mockBarcode);
          if (nutritionalInfo) {
            toast.success('Supplement information found!');
          } else {
            toast.error('No supplement information found');
          }
        } catch (error) {
          toast.error('Error fetching supplement information');
        } finally {
          setLoading(false);
          onScanComplete({
            barcode: mockBarcode,
            format: 'EAN-13',
            timestamp: new Date().toISOString()
          });
          stopScanning();
        }
      }, 3000);

    } catch (error) {
      console.error(error);
      setHasPermission(false);
      toast.error('Unable to access camera');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  return (
    <div className="h-full">
      <header className="text-center my-8">
        <h1 className="text-2xl font-bold text-gray-900">Scan Supplement</h1>
        <p className="text-gray-600 mt-2">Scan barcode to add or log supplement</p>
      </header>

      <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50" />
              {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={stopScanning}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
            {hasPermission === false ? (
              <div className="text-center p-4">
                <p className="text-red-600 mb-2">Camera permission denied</p>
                <button
                  onClick={() => setHasPermission(null)}
                  className="text-blue-600 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <button
                onClick={startScanning}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                <Camera className="w-5 h-5" />
                Start Scanning
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 px-4">
        <div className="flex items-center gap-4 text-sm text-gray-500 justify-center">
          <ScanIcon className="w-5 h-5" />
          <span>Position the barcode within the frame to scan</span>
        </div>
      </div>
    </div>
  );
}
