declare module 'quagga' {
  export interface QuaggaJSConfigObject {
    inputStream: {
      name: string;
      type: string;
      target?: string | HTMLElement;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
    };
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers: number;
    frequency: number;
    decoder: {
      readers: string[];
    };
    locate: boolean;
  }

  export interface QuaggaJSStatic {
    init(config: QuaggaJSConfigObject, callback: (err: any) => void): void;
    start(): void;
    stop(): void;
    pause(): void;
    unpause(): void;
    onDetected(callback: (result: any) => void): void;
    offDetected(callback?: (result: any) => void): void;
    decodeSingle(config: QuaggaJSConfigObject, callback: (result: any) => void): void;
  }

  const Quagga: QuaggaJSStatic;
  export default Quagga;
} 