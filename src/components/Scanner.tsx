import { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan as ScanIcon, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScanResult, Supplement } from '../types';
import { fetchSupplementInfo } from '../services/supplementApi';
import { supplementStorage } from '../utils/supplementStorage';
import Quagga from 'quagga';

interface ScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export function Scanner({ onScanComplete }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const quaggaInitialized = useRef(false);

  const initializeScanner = () => {
    if (!videoRef.current) return;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          facingMode: "environment",
          aspectRatio: { min: 1, max: 2 },
          width: { min: 640 },
          height: { min: 480 }
        },
      },
      locate: true,
      numOfWorkers: 4,
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        debug: {
          drawBoundingBox: true,
          showFrequency: true,
          drawScanline: true
        }
      }
    }, function(err) {
      if (err) {
        console.error(err);
        toast.error('Failed to initialize scanner');
        return;
      }
      console.log("QuaggaJS initialization succeeded");
      quaggaInitialized.current = true;
      Quagga.start();
    });

    let lastResult: string | null = null;
    let sameResultCount = 0;

    Quagga.onDetected((result) => {
      const code = result.codeResult.code;
      console.log('Detected barcode:', code);
      
      if (code === lastResult) {
        sameResultCount++;
        if (sameResultCount >= 2) {
          handleValidBarcode(result);
          sameResultCount = 0;
          lastResult = null;
        }
      } else {
        lastResult = code;
        sameResultCount = 1;
      }
    });
  };

  const handleValidBarcode = async (result: any) => {
    const barcode = result.codeResult.code;
    if (!barcode) return;

    // Stop scanning
    stopScanning();
    setLoading(true);

    try {
      const nutritionalInfo = await fetchSupplementInfo(barcode);
      
      if (nutritionalInfo) {
        const newSupplement: Omit<Supplement, 'id'> = {
          name: nutritionalInfo.product_name || 'Unknown Supplement',
          barcode,
          dosage: nutritionalInfo.servingSize || 'Not specified',
          frequency: 'Daily',
          timeOfDay: 'Morning',
          intakeHistory: [],
          nutritionalInfo,
          verified: true,
          apiData: {
            source: 'OpenFoodFacts',
            productId: barcode,
            lastUpdated: new Date().toISOString(),
            status: 'verified'
          }
        };

        await supplementStorage.add(newSupplement);
        toast.success('Supplement added successfully!');
        
        onScanComplete({
          barcode,
          format: result.codeResult.format,
          timestamp: new Date().toISOString()
        });
      } else {
        toast.error('No supplement information found');
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast.error('Error processing barcode');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setScanning(true);
      setHasPermission(true);
      await initializeScanner();
    } catch (error) {
      console.error(error);
      setHasPermission(false);
      toast.error('Unable to access camera');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (quaggaInitialized.current) {
      Quagga.stop();
      quaggaInitialized.current = false;
    }
    
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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
              className="absolute top-0 left-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
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
