// src/components/Navbar.js
import React from 'react';
import { FaSpotify } from 'react-icons/fa';

function Navbar() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:5000/logout';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center" href="/">
          <FaSpotify size={30} className="me-2" />
          Spotify Clustering App
        </a>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <button className="btn btn-success me-2" onClick={handleLogin}>Se Connecter</button>
            </li>
            <li className="nav-item">
              <button className="btn btn-danger" onClick={handleLogout}>Se Déconnecter</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
