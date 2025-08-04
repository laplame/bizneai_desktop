import React from 'react';
import { Cpu, Database, Settings as SettingsIcon } from 'lucide-react';

interface NavbarProps {
  isMiningActive: boolean;
  onMiningClick: () => void;
  onSettingsClick: () => void;
  lastBackupTime: string;
}

const Navbar: React.FC<NavbarProps> = ({
  isMiningActive,
  onMiningClick,
  onSettingsClick,
  lastBackupTime
}) => {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <h1>BizneAI POS</h1>
          <small>Venta #{Math.floor(Math.random() * 1000) + 1000}</small>
        </div>
      </div>
      
      <div className="navbar-center">
        <div className="navbar-status">
          {/* Backup Status Indicator */}
          <div className="status-indicator">
            <Database className="h-4 w-4" />
            <span>Último backup: {lastBackupTime}</span>
          </div>
          
          {/* Mining Status Indicator */}
          {isMiningActive && (
            <div className="status-indicator mining-active">
              <Cpu className="h-4 w-4" />
              <span>Minería LUXAE activa</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-actions">
          {/* Mining Button */}
          <button 
            className={`navbar-btn mining-btn ${isMiningActive ? 'active' : ''}`}
            onClick={onMiningClick}
            title={isMiningActive ? 'Minería activa' : 'Iniciar minería'}
          >
            <Cpu className="h-4 w-4" />
            <span>Minería</span>
            {isMiningActive && <div className="mining-indicator"></div>}
          </button>
          
          {/* Settings Button */}
          <button 
            className="navbar-btn settings-btn"
            onClick={onSettingsClick}
            title="Configuración"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Config</span>
          </button>
        </div>
        
        <div className="navbar-date">
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 