import { useState, useCallback, FormEvent } from 'react';
import { Lock, LogIn, ArrowLeft } from 'lucide-react';
import { unlockConfigurationAccessWithPassword } from '../services/configPasswords';

interface ConfigurationAccessGateProps {
  onUnlocked: () => void;
  onCancel: () => void;
}

const ConfigurationAccessGate = ({ onUnlocked, onCancel }: ConfigurationAccessGateProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const tryUnlock = useCallback(() => {
    setError(false);
    if (unlockConfigurationAccessWithPassword(password, username)) {
      onUnlocked();
      return;
    }
    setError(true);
    setPassword('');
  }, [password, username, onUnlocked]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      tryUnlock();
    },
    [tryUnlock]
  );

  return (
    <div className="screen-lock-overlay">
      <div className="screen-lock-card" style={{ maxWidth: '22rem' }}>
        <div className="screen-lock-icon">
          <Lock size={40} strokeWidth={2} />
        </div>
        <h1 className="screen-lock-title">Configuración</h1>
        <p className="screen-lock-subtitle">
          Introduce la contraseña de acceso a configuración. Si la cambiaste en Configuración, usa la vigente.
        </p>

        <form onSubmit={onSubmit}>
          <div className="form-group" style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
            <label htmlFor="config-access-user" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
              Usuario (opcional)
            </label>
            <input
              id="config-access-user"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setError(false);
                setUsername(e.target.value);
              }}
              className="url-input"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: 'var(--bs-dark-surface)',
                border: '1px solid var(--bs-dark-border)',
                borderRadius: 'var(--bs-radius)',
                color: 'var(--bs-dark-text)',
                fontSize: '0.9375rem',
              }}
              placeholder="Opcional"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
            <label htmlFor="config-access-password" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.875rem' }}>
              Contraseña de acceso
            </label>
            <input
              id="config-access-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setError(false);
                setPassword(e.target.value);
              }}
              className="url-input"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                background: 'var(--bs-dark-surface)',
                border: '1px solid var(--bs-dark-border)',
                borderRadius: 'var(--bs-radius)',
                color: 'var(--bs-dark-text)',
                fontSize: '0.9375rem',
              }}
              placeholder="Contraseña"
            />
          </div>
          {error && <p className="screen-lock-error">Contraseña incorrecta</p>}

          <button type="submit" className="screen-lock-enter" style={{ width: '100%' }}>
            <LogIn size={20} />
            Entrar
          </button>
        </form>

        <button type="button" className="btn-secondary" style={{ marginTop: '0.75rem', width: '100%' }} onClick={onCancel}>
          <ArrowLeft size={20} />
          Volver al POS
        </button>
      </div>
    </div>
  );
};

export default ConfigurationAccessGate;
