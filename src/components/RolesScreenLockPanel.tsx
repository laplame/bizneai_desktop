import { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  loadRolesSyncItems,
  saveRolesSyncItems,
  isScreenLockEnabled,
  setScreenLockEnabled,
  flattenRolesForEditor,
  groupFlatRowsToSyncItems,
  normalizePin,
  hasScreenLockPinsConfigured,
  type RoleUserFlatRow,
} from '../services/rolesScreenLock';

const RolesScreenLockPanel = () => {
  const [enabled, setEnabled] = useState(() => isScreenLockEnabled());
  const [rows, setRows] = useState<RoleUserFlatRow[]>(() => flattenRolesForEditor(loadRolesSyncItems()));

  useEffect(() => {
    setRows(flattenRolesForEditor(loadRolesSyncItems()));
    setEnabled(isScreenLockEnabled());
  }, []);

  const handleSave = () => {
    const items = groupFlatRowsToSyncItems(rows);
    saveRolesSyncItems(items);
    toast.success('Roles y PIN guardados');
    if (isScreenLockEnabled() && hasScreenLockPinsConfigured()) {
      window.dispatchEvent(new CustomEvent('bizneai-force-screen-lock'));
    }
  };

  const updateRow = (id: string, patch: Partial<RoleUserFlatRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        role: 'Cajero',
        name: '',
        email: '',
        pin: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  return (
    <div className="settings-form roles-screen-lock-panel">
      <p className="form-hint" style={{ marginBottom: '1rem', color: 'var(--bs-dark-text-muted)' }}>
        Los datos siguen el mismo formato que{' '}
        <strong>POST /api/shops/:shopId/roles/sync</strong> (<code>roles[]</code> con{' '}
        <code>users[]</code>). Cada usuario puede tener un <strong>PIN de 4 dígitos</strong> para
        desbloquear el POS. El acceso a <strong>Configuración</strong> usa contraseñas aparte (sección
        Contraseñas de configuración). Usa &quot;Sincronizar Roles&quot; en la sección del servidor para
        enviarlos.
      </p>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const v = e.target.checked;
              setEnabled(v);
              setScreenLockEnabled(v);
              toast.success(v ? 'Bloqueo de pantalla activado' : 'Bloqueo de pantalla desactivado');
            }}
          />
          <Shield size={18} />
          <span>Activar bloqueo de pantalla al abrir el POS (requiere PIN configurado)</span>
        </label>
      </div>

      <div className="roles-table-wrap">
        <table className="roles-pin-table">
          <thead>
            <tr>
              <th>Rol</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>PIN (4 díg.)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.role}
                    onChange={(e) => updateRow(row.id, { role: e.target.value })}
                    placeholder="Ej. Cajero"
                    className="roles-pin-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    placeholder="Nombre"
                    className="roles-pin-input"
                  />
                </td>
                <td>
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => updateRow(row.id, { email: e.target.value })}
                    placeholder="email@..."
                    className="roles-pin-input"
                  />
                </td>
                <td>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="off"
                    value={row.pin}
                    onChange={(e) => updateRow(row.id, { pin: normalizePin(e.target.value) })}
                    placeholder="••••"
                    className="roles-pin-input roles-pin-input--narrow"
                  />
                </td>
                <td>
                  <button type="button" className="icon-btn roles-pin-remove" onClick={() => removeRow(row.id)} title="Quitar fila">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="roles-screen-lock-actions">
        <button type="button" className="btn-secondary" onClick={addRow}>
          <Plus size={18} />
          Agregar usuario / rol
        </button>
        <button type="button" className="btn-primary" onClick={handleSave}>
          <Users size={18} />
          Guardar roles y PIN
        </button>
      </div>
    </div>
  );
};

export default RolesScreenLockPanel;
