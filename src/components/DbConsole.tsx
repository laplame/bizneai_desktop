import { useCallback, useEffect, useState } from 'react';
import { Database, Play, RefreshCw, Minus, X } from 'lucide-react';
import { getLocalApiOrigin, LOCAL_API_PORT } from '../utils/localApiBase';

type DbRow = Record<string, unknown>;

function formatFetchError(e: unknown, origin: string): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    return [
      `No se pudo conectar con el API local (${origin}).`,
      '',
      'No necesitas instalar SQLite por separado: la base de datos va integrada; la consola solo habla por red con el servicio en el puerto ' +
        String(LOCAL_API_PORT) +
        '.',
      '',
      'En Windows, lo más habitual es:',
      '• Node.js no instalado o no está en el PATH — el POS arranca el API con el comando `node`. Instala Node LTS desde nodejs.org y reinicia el equipo o la sesión.',
      '• Falta dist-backend en la instalación — al construir el instalador debe ejecutarse npm run build:server.',
      '• El puerto 3000 lo usa otra aplicación.',
      '',
      `Detalle: ${raw}`,
    ].join('\n');
  }
  return raw;
}

const SAMPLE_SQL: Record<string, string> = {
  kv: "SELECT name FROM sqlite_master WHERE type='table'",
  activity: "SELECT name FROM sqlite_master WHERE type='table'",
  legacy: 'SELECT name FROM sqlite_master WHERE type=\'table\'',
};

const DbConsole = () => {
  const origin = getLocalApiOrigin();
  const base = `${origin}/api/local-db/console`;
  const [apiProbe, setApiProbe] = useState<{
    ok: boolean;
    bundleExists?: boolean;
    launcherExists?: boolean;
    embeddedNodeExists?: boolean;
    platform?: string;
  } | null>(null);
  const [meta, setMeta] = useState<{
    dataDir: string;
    databases: Array<{ key: string; label: string; file: string; path: string }>;
  } | null>(null);
  const [dbKey, setDbKey] = useState('kv');
  const [tables, setTables] = useState<Array<{ name: string; type: string }>>([]);
  const [sql, setSql] = useState(SAMPLE_SQL.kv);
  const [rows, setRows] = useState<DbRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshApiProbe = useCallback(async () => {
    if (typeof window.electronAPI?.probeLocalApi === 'function') {
      try {
        const p = await window.electronAPI.probeLocalApi();
        setApiProbe(p);
      } catch {
        setApiProbe(null);
      }
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
      setError(null);
      await refreshApiProbe();
      const r = await fetch(`${base}/meta`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setMeta(j);
    } catch (e) {
      setError(formatFetchError(e, origin));
    }
  }, [base, origin, refreshApiProbe]);

  const loadTables = useCallback(async () => {
    try {
      const r = await fetch(`${base}/${encodeURIComponent(dbKey)}/tables`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setTables(j.tables || []);
    } catch (e) {
      setTables([]);
      setError(formatFetchError(e, origin));
    }
  }, [base, dbKey, origin]);

  useEffect(() => {
    void refreshApiProbe();
  }, [refreshApiProbe]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    setSql(SAMPLE_SQL[dbKey] ?? SAMPLE_SQL.kv);
    void loadTables();
  }, [dbKey, loadTables]);

  const runQuery = async () => {
    setLoading(true);
    setError(null);
    setRows([]);
    try {
      const r = await fetch(`${base}/${encodeURIComponent(dbKey)}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setRows(Array.isArray(j.rows) ? j.rows : []);
    } catch (e) {
      setError(formatFetchError(e, origin));
    } finally {
      setLoading(false);
    }
  };

  const minimizeWindow = () => {
    if (window.electronAPI?.minimizeDbConsoleWindow) {
      window.electronAPI.minimizeDbConsoleWindow();
    }
  };

  const closeWindow = () => {
    if (window.electronAPI?.closeDbConsoleWindow) {
      window.electronAPI.closeDbConsoleWindow();
    } else {
      window.close();
    }
  };

  const columns =
    rows.length > 0 ? Object.keys(rows[0] as object) : [];

  return (
    <div className="db-console">
      <header className="db-console__header">
        <div className="db-console__title">
          <Database size={22} />
          <h1>Consola SQLite (solo lectura)</h1>
        </div>
        <div className="db-console__header-actions">
          <button type="button" className="btn-secondary db-console__icon-btn" onClick={() => void loadMeta()} title="Actualizar metadatos">
            <RefreshCw size={18} />
          </button>
          {typeof window.electronAPI?.minimizeDbConsoleWindow === 'function' && (
            <button type="button" className="btn-secondary db-console__icon-btn" onClick={minimizeWindow} title="Minimizar">
              <Minus size={18} />
            </button>
          )}
          {typeof window.electronAPI?.closeDbConsoleWindow === 'function' && (
            <button type="button" className="btn-secondary db-console__icon-btn" onClick={closeWindow} title="Cerrar ventana">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {apiProbe && !apiProbe.ok && (
        <div className="db-console__warn" role="alert">
          <strong>API local no responde</strong> en <code>http://127.0.0.1:{LOCAL_API_PORT}</code>.
          {apiProbe.bundleExists === false && (
            <span>
              {' '}
              No se encontró el bundle del servidor (<code>dist-backend/bizneai-server.cjs</code>).
            </span>
          )}
          {apiProbe.platform === 'win32' && !apiProbe.embeddedNodeExists && (
            <p className="db-console__warn-detail">
              Sin Node embebido en el instalador: hace falta <strong>Node.js</strong> en el PATH, o volver a generar el
              instalador incluyendo <code>embedded-node/node.exe</code> (ver README).
            </p>
          )}
        </div>
      )}

      {meta && (
        <p className="db-console__meta">
          <strong>Datos:</strong> <code>{meta.dataDir}</code>
        </p>
      )}

      <div className="db-console__toolbar">
        <label>
          Base de datos
          <select value={dbKey} onChange={(e) => setDbKey(e.target.value)} className="db-console__select">
            {(meta?.databases ?? [{ key: 'kv', label: 'KV' }]).map((d) => (
              <option key={d.key} value={d.key}>
                {d.label} ({d.key})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-primary" onClick={() => void runQuery()} disabled={loading}>
          {loading ? <RefreshCw size={18} className="db-console__spin" /> : <Play size={18} />}
          Ejecutar
        </button>
      </div>

      <div className="db-console__tables">
        <span className="db-console__tables-label">Tablas / vistas:</span>
        {tables.map((t) => (
          <button
            key={t.name}
            type="button"
            className="db-console__table-chip"
            onClick={() => setSql(`SELECT * FROM "${t.name}" LIMIT 100`)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <textarea
        className="db-console__sql"
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        spellCheck={false}
        placeholder="SELECT ..."
      />

      {error && <div className="db-console__error">{error}</div>}

      <div className="db-console__results-wrap">
        {rows.length > 0 && columns.length > 0 && (
          <table className="db-console__table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c}>{formatCell(row[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length === 0 && !error && !loading && (
          <p className="db-console__empty">Sin resultados. Ejecuta un SELECT (solo lectura).</p>
        )}
      </div>
    </div>
  );
};

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default DbConsole;
