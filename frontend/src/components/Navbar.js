// src/components/Navbar.js
import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaMusic, FaHistory, FaUserEdit, FaListUl, FaSignOutAlt } from 'react-icons/fa';
import { UserContext } from '../context/UserContext';
import logo from '../assets/logo.png';

function Navbar() {
  const { user } = useContext(UserContext);
  const location = useLocation();

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:3000/logout';
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="fat-text navbar-brand d-flex align-items-center" to="/home">
          <img src={logo} alt="UTA Logo" style={{ height: '4rem', marginRight: '10px' }} />
          <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '.2rem' }}>UTA</span>
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
          <ul className="navbar-nav">
            {user && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/dataset-recommendations') ? 'active' : ''}`}
                    to="/dataset-recommendations" 
                    title="Dataset Recommendations"
                  >
                    <FaMusic size={20} />
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/history-recommendations') ? 'active' : ''}`}
                    to="/history-recommendations"
                    title="History Recommendations"
                  >
                    <FaHistory size={20} />
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/custom-recommendations') ? 'active' : ''}`}
                    to="/custom-recommendations"
                    title="Custom Recommendations"
                  >
                    <FaUserEdit size={20} />
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/playlists') ? 'active' : ''}`}
                    to="/playlists"
                    title="Your Playlists"
                  >
                    <FaListUl size={20} />
                  </Link>
                </li>
              </>
            )}
          </ul>
          <div className="nav-end d-flex align-items-center">
            {user ? (
              <button className="btn btn-danger d-flex red-btn logout-btn" onClick={handleLogout}>
                <FaSignOutAlt size={16} />
                <span>Logout</span>
              </button>
            ) : (
              <button className="btn btn-success me-2 green-btn" onClick={handleLogin}>Login</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;