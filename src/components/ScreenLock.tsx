import { useState, useCallback } from 'react';
import { Lock, Delete, LogIn } from 'lucide-react';
import { unlockFromPin } from '../services/rolesScreenLock';

interface ScreenLockProps {
  onUnlock: () => void;
}

const ScreenLock = ({ onUnlock }: ScreenLockProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const addDigit = useCallback(
    (d: string) => {
      setError(false);
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + d;
        if (next.length === 4 && unlockFromPin(next)) {
          queueMicrotask(() => onUnlock());
        }
        return next;
      });
    },
    [onUnlock]
  );

  const backspace = useCallback(() => {
    setError(false);
    setPin((p) => p.slice(0, -1));
  }, []);

  const clearPin = useCallback(() => {
    setError(false);
    setPin('');
  }, []);

  const tryUnlock = useCallback(() => {
    if (unlockFromPin(pin)) {
      onUnlock();
      return;
    }
    setError(true);
    setPin('');
  }, [pin, onUnlock]);

  return (
    <div className="screen-lock-overlay">
      <div className="screen-lock-card">
        <div className="screen-lock-icon">
          <Lock size={40} strokeWidth={2} />
        </div>
        <h1 className="screen-lock-title">Sesión bloqueada</h1>
        <p className="screen-lock-subtitle">Ingresa tu PIN de 4 dígitos (definido en Configuración → Roles)</p>

        <div className={`screen-lock-dots ${error ? 'screen-lock-dots--error' : ''}`}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={pin.length > i ? 'filled' : ''} />
          ))}
        </div>
        {error && <p className="screen-lock-error">PIN incorrecto</p>}

        <div className="screen-lock-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((key) => (
            <button key={key} type="button" className="screen-lock-key" onClick={() => addDigit(key)}>
              {key}
            </button>
          ))}
          <button type="button" className="screen-lock-key screen-lock-key--muted" onClick={clearPin}>
            C
          </button>
          <button type="button" className="screen-lock-key" onClick={() => addDigit('0')}>
            0
          </button>
          <button type="button" className="screen-lock-key screen-lock-key--muted" onClick={backspace}>
            <Delete size={22} />
          </button>
        </div>

        <button type="button" className="screen-lock-enter" onClick={tryUnlock} disabled={pin.length !== 4}>
          <LogIn size={20} />
          Desbloquear
        </button>
      </div>
    </div>
  );
};

export default ScreenLock;
