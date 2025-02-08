// src/components/Login.js
import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useContext(UserContext);

	useEffect(() => {
		// Si l'utilisateur est déjà connecté, rediriger vers /home
		if (user) {
			// Rediriger vers la page précédente si elle existe, sinon vers /home
			const from = location.state?.from || '/home';
			navigate(from, { replace: true });
		}
	}, [user, navigate, location]);

	const handleLogin = () => {
		window.location.href = 'http://localhost:5000/login';
	};

	// Si l'utilisateur est déjà connecté, ne rien afficher pendant la redirection
	if (user) {
		return null;
	}

	return (
		<div className="container text-center mt-5">
			<h1>Welcome to UTA!</h1>
			<p className="lead">Login with your Spotify account to get started.</p>
			<p>UTA is a web application using AI to generate music recommendations based on your Spotify listening history.</p>
			<button onClick={handleLogin} className="btn btn-success green-btn mt-4">
				Login with Spotify
			</button>
		</div>
	);
}

export default Login;
