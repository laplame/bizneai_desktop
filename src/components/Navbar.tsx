import React from 'react';

interface NavbarProps {
  onMiningClick?: () => void;
  onSettingsClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMiningClick, onSettingsClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">BizneAI</div>
      <ul className="navbar-menu">
        <li>
          <button onClick={onMiningClick}>Minería</button>
        </li>
        <li>
          <button onClick={onSettingsClick}>Configuración</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
