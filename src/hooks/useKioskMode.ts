/**
 * useKioskMode — modo autoservicio para terminales táctiles dedicadas.
 *
 * Flujo:
 *  - Se ACTIVA desde Configuración (enterKioskMode) — no hay toggle libre en el POS.
 *  - Al activarse: clase `kiosk-mode` en <body> (estilos táctiles, ver src/index.css)
 *    y, en Electron, ventana en pantalla completa kiosko vía IPC.
 *  - NO se puede salir sin passcode: exitKioskMode(passcode) valida contra el
 *    passcode de acceso a Configuración (validateConfigAccessPassword). Sin él,
 *    el kiosko es autosustentable (no hay tecla Escape ni botón de salida directo).
 *
 * El estado se guarda en localStorage y se sincroniza entre componentes por un
 * evento, para que Configuración pueda activarlo y el POS reaccione.
 */
import { useEffect, useState } from 'react';
import { validateConfigAccessPassword } from '../services/configPasswords';

const KIOSK_KEY = 'bizneai-kiosk-mode';
const KIOSK_EVENT = 'bizneai-kiosk-changed';

function readKiosk(): boolean {
  try {
    return localStorage.getItem(KIOSK_KEY) === '1';
  } catch {
    return false;
  }
}

function writeKiosk(on: boolean): void {
  try {
    localStorage.setItem(KIOSK_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(KIOSK_EVENT));
}

export function isKioskModeActive(): boolean {
  return readKiosk();
}

/** Entra en modo kiosko autoservicio (se llama desde Configuración). */
export function enterKioskMode(): void {
  writeKiosk(true);
}

/**
 * Sale del modo kiosko solo si el passcode de acceso a Configuración es válido.
 * Devuelve true si salió, false si el passcode es incorrecto.
 */
export function exitKioskMode(passcode: string, username?: string): boolean {
  if (!validateConfigAccessPassword(passcode, username)) return false;
  writeKiosk(false);
  return true;
}

/** Hook: expone el estado del kiosko y mantiene body-class + ventana Electron. */
export function useKioskMode() {
  const [kiosk, setKiosk] = useState<boolean>(readKiosk);

  // Sincroniza con enterKioskMode/exitKioskMode disparados desde otros componentes.
  useEffect(() => {
    const sync = () => setKiosk(readKiosk());
    window.addEventListener(KIOSK_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(KIOSK_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('kiosk-mode', kiosk);
    // Electron: pantalla completa kiosko (no-op en navegador).
    void window.electronAPI?.setKioskMode?.(kiosk);
  }, [kiosk]);

  return { kiosk };
}
