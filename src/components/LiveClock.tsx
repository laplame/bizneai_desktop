import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Reloj en vivo que mantiene su propio estado.
 * Al estar aislado, sus actualizaciones cada segundo no provocan re-renders
 * del componente padre (evita desmontar modales como CheckoutModal).
 */
export default function LiveClock() {
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Clock size={16} strokeWidth={2} />
      {currentTime}
    </>
  );
}
