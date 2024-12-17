// src/components/Login.js
import React from 'react';

function Login() {
	const handleLogin = () => {
		window.location.href = 'http://localhost:5000/login';
	};

	return (
		<div className="container text-center my-5">
			<h1>Welcome to UTA !</h1>
			<p>Login with your Spotify account to get started.</p>
			<p>UTA is a web application using AI to generate music recommendations based on your Spotify listening
				history.</p>
		</div>
	);
}

export default Login;
