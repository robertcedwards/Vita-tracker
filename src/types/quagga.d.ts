declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name?: string;
      type?: string;
      target?: HTMLElement | null;
      constraints?: {
        facingMode?: string;
        width?: { min: number; ideal?: number };
        height?: { min: number; ideal?: number };
      };
    };
    locate?: boolean;
    numOfWorkers?: number;
    decoder: {
      readers: string[];
      debug?: boolean | {
        drawBoundingBox?: boolean;
        showFrequency?: boolean;
        drawScanline?: boolean;
      };
    };
  }

  interface CodeResult {
    code: string;
    format: string;
  }

  interface QuaggaResult {
    codeResult: CodeResult;
  }

  export function init(config: QuaggaConfig, callback: (err?: any) => void): void;
  export function start(): void;
  export function stop(): void;
  export function onDetected(callback: (result: QuaggaResult) => void): void;
} 