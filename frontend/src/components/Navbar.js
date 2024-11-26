// src/components/Navbar.js
import React, { useContext } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { UserContext } from '../context/UserContext';

function Navbar() {
  const { user } = useContext(UserContext);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:3000/logout';
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <a className="fat-text navbar-brand d-flex align-items-center" href="/">
          <FaSpotify size={30} className="me-2" />
          UTA
        </a>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {user ? (
              <li className="nav-item">
                <button className="btn btn-danger red-btn" onClick={handleLogout}>Se Déconnecter</button>
              </li>
            ) : (
              <li className="nav-item">
                <button className="btn btn-success me-2 green-btn" onClick={handleLogin}>Se Connecter</button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;