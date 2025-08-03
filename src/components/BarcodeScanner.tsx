import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';
import { X, Camera, Search } from 'lucide-react';
import type { QuaggaJSStatic, QuaggaJSConfigObject } from '../types';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner = ({ onScan, onClose, isOpen }: BarcodeScannerProps) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && !isScanning) {
      startScanner();
    } else if (!isOpen && isScanning) {
      stopScanner();
    }
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      // Importar Quagga dinámicamente
      const Quagga = await import('quagga');
      
      Quagga.default.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment"
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          setError('Error al iniciar el escáner: ' + err.message);
          setIsScanning(false);
          return;
        }
        
        Quagga.default.start();
      });

      Quagga.default.onDetected((result: any) => {
        const code = result.codeResult.code;
        if (code) {
          onScan(code);
          stopScanner();
          onClose();
        }
      });

      (Quagga.default as QuaggaJSStatic).onProcessed((result: any) => {
        if (result) {
          const drawingCanvas = (Quagga.default as QuaggaJSStatic).canvas.ctx.overlay;
          const drawingCtx = (Quagga.default as QuaggaJSStatic).canvas.ctx.overlay.getContext('2d');
          
          if (result.line) {
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            drawingCtx.strokeStyle = '#00ff00';
            drawingCtx.lineWidth = 3;
            drawingCtx.beginPath();
            drawingCtx.moveTo(result.line[0].x, result.line[0].y);
            drawingCtx.lineTo(result.line[1].x, result.line[1].y);
            drawingCtx.stroke();
          }
        }
      });

    } catch (err) {
      setError('Error al cargar el escáner de códigos de barras');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      const Quagga = await import('quagga');
      Quagga.default.stop();
      setIsScanning(false);
    } catch (err) {
      console.error('Error al detener el escáner:', err);
    }
  };

  const handleManualInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const input = event.currentTarget;
      const code = input.value.trim();
      if (code) {
        onScan(code);
        input.value = '';
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="barcode-scanner-header">
          <h3>Escanear Código de Barras</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="barcode-scanner-content">
          {error ? (
            <div className="scanner-error">
              <p>{error}</p>
              <p>Puedes ingresar el código manualmente:</p>
              <input
                type="text"
                placeholder="Ingresa el código de barras..."
                onKeyPress={handleManualInput}
                className="manual-barcode-input"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div className="scanner-video-container">
                <div ref={scannerRef} className="scanner-video" />
                {isScanning && (
                  <div className="scanner-overlay">
                    <div className="scanner-target">
                      <div className="scanner-corner top-left"></div>
                      <div className="scanner-corner top-right"></div>
                      <div className="scanner-corner bottom-left"></div>
                      <div className="scanner-corner bottom-right"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="scanner-instructions">
                <p>Coloca el código de barras dentro del área marcada</p>
                <p>O ingresa el código manualmente:</p>
                <input
                  type="text"
                  placeholder="Ingresa el código de barras..."
                  onKeyPress={handleManualInput}
                  className="manual-barcode-input"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner; 