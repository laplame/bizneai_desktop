import React from 'react';

interface NavbarProps {
  onSettingsClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSettingsClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">BizneAI</div>
      <ul className="navbar-menu">
        <li>
          <button onClick={onSettingsClick}>Configuración</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
