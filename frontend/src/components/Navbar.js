// src/components/Navbar.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
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
        <Link className="fat-text navbar-brand d-flex align-items-center" to="/home">
          <FaSpotify size={30} className="me-2" />
          UTA
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dataset-recommendations">Dataset Recommendations</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/history-recommendations">History Recommendations</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/custom-recommendations">Custom Recommendations</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/playlists">Your Playlists</Link>
                </li>
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item">
                <button className="btn btn-danger red-btn" onClick={handleLogout}>Logout</button>
              </li>
            ) : (
              <li className="nav-item">
                <button className="btn btn-success me-2 green-btn" onClick={handleLogin}>Login</button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;