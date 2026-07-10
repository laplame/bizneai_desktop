/**
 * Botón discreto para salir del modo kiosko autoservicio.
 * Solo sale si se ingresa el passcode de acceso a Configuración
 * (exitKioskMode → validateConfigAccessPassword). Sin passcode, no hay salida.
 */
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { exitKioskMode } from '../hooks/useKioskMode';

export default function KioskExitButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    setCode('');
    setError('');
  };

  const submit = () => {
    if (exitKioskMode(code)) {
      close();
    } else {
      setError('Passcode incorrecto');
      setCode('');
    }
  };

  return (
    <>
      <button
        className="kiosk-exit-btn"
        onClick={() => setOpen(true)}
        title="Salir de kiosko (requiere passcode)"
        aria-label="Salir de modo kiosko"
      >
        <Lock size={18} />
      </button>

      {open && (
        <div className="kiosk-exit-overlay" onClick={close}>
          <div className="kiosk-exit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Salir de modo kiosko</h3>
            <p>Ingresa el passcode de administrador para salir del autoservicio.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              placeholder="Passcode"
              className="kiosk-exit-input"
            />
            {error && <div className="kiosk-exit-error">{error}</div>}
            <div className="kiosk-exit-actions">
              <button className="kiosk-exit-cancel" onClick={close}>
                Cancelar
              </button>
              <button className="kiosk-exit-confirm" onClick={submit}>
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
