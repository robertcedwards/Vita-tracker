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

interface QuaggaValidResult {
  codeResult: {
    code: string;
    format: string;
  };
}

export function Scanner({ onScanComplete }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const quaggaInitialized = useRef(false);

  const initializeScanner = async () => {
    console.log('Initializing scanner...');
    if (!videoRef.current) {
      console.error('Video element not found');
      return;
    }

    console.log('Configuring Quagga...');
    try {
      await new Promise((resolve, reject) => {
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current!,
            constraints: {
              facingMode: "environment",
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 }
            },
          },
          locate: true,
          numOfWorkers: 2,
          decoder: {
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
            debug: {
              drawBoundingBox: true,
              showFrequency: true,
              drawScanline: true,
              showPattern: true
            }
          }
        }, function(err) {
          if (err) {
            console.error('Quagga initialization error:', err);
            reject(err);
            return;
          }
          resolve(true);
        });
      });

      console.log("QuaggaJS initialization succeeded");
      quaggaInitialized.current = true;
      Quagga.start();

      // Add frequency debugging
      Quagga.onProcessed((result) => {
        console.log('Frame processed:', result);
      });
    } catch (error) {
      console.error('Failed to initialize Quagga:', error);
      toast.error('Failed to initialize scanner');
    }
  };

  const handleValidBarcode = async (result: QuaggaValidResult) => {
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
            source: 'OpenFoodFacts' as const,
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
    console.log('Starting scanner...');
    try {
      setScanning(true);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (!videoRef.current) {
        console.error('Video element not found');
        throw new Error('Video element not found');
      }
      
      console.log('Camera access granted, setting up video stream');
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setHasPermission(true);
      
      // Wait for video to be ready before initializing Quagga
      videoRef.current.onloadeddata = () => {
        console.log('Video data loaded, initializing scanner...');
        initializeScanner();
      };
    } catch (error) {
      console.error('Camera access error:', error);
      setHasPermission(false);
      setScanning(false);
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

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
  };

  useEffect(() => {
    let lastResult: string | null = null;
    let sameResultCount = 0;

    const handleDetected = (result: QuaggaValidResult) => {
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
    };

    if (scanning) {
      Quagga.onDetected(handleDetected);
    }

    return () => {
      if (scanning) {
        Quagga.onDetected(() => {});
      }
    };
  }, [scanning]);

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

      <div id="interactive" className="relative aspect-square max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
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
