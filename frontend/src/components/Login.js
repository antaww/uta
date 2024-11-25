// src/components/Login.js
import React from 'react';

function Login() {
  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  return (
    <div className="container text-center my-5">
      <h1>Bienvenue sur le Générateur de Playlist Spotify</h1>
      <p>Connectez-vous avec votre compte Spotify pour commencer.</p>
      <button className="btn btn-success" onClick={handleLogin}>Se Connecter avec Spotify</button>
    </div>
  );
}

export default Login;
