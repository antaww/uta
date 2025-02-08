// src/components/Home.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { FaMusic, FaHistory, FaUserEdit, FaListUl } from 'react-icons/fa';

function Home() {
	const { user } = useContext(UserContext);

	if (!user) {
		return (
			<div className="container text-center mt-5">
				<h1>Welcome to UTA!</h1>
				<p className="lead">Login with your Spotify account to get started.</p>
				<p>UTA is a web application using AI to generate music recommendations based on your Spotify listening history.</p>
			</div>
		);
	}

	return (
		<div className="container mt-4">
			<div className="d-flex align-items-center gap-3 mb-4">
				<img src={user.images[0].url} alt={user.display_name} className="profile-icon"/>
				<h2 className="fat-text">Welcome, {user.display_name}!</h2>
			</div>

			<div className="row g-4">
				<div className="col-md-6">
					<Link to="/dataset-recommendations" className="text-decoration-none">
						<div className="card bg-dark text-white h-100 hover-card">
							<div className="card-body">
								<div className="d-flex align-items-center mb-3">
									<FaMusic className="me-2 text-spotify" size={24} />
									<h3 className="card-title mb-0 text-spotify">Dataset Recommendations</h3>
								</div>
								<p className="card-text">Get music recommendations based on our curated dataset of songs and their features.</p>
							</div>
						</div>
					</Link>
				</div>

				<div className="col-md-6">
					<Link to="/history-recommendations" className="text-decoration-none">
						<div className="card bg-dark text-white h-100 hover-card">
							<div className="card-body">
								<div className="d-flex align-items-center mb-3">
									<FaHistory className="me-2 text-spotify" size={24} />
									<h3 className="card-title mb-0 text-spotify">History Recommendations</h3>
								</div>
								<p className="card-text">Get personalized recommendations based on your listening history and preferences.</p>
							</div>
						</div>
					</Link>
				</div>

				<div className="col-md-6">
					<Link to="/custom-recommendations" className="text-decoration-none">
						<div className="card bg-dark text-white h-100 hover-card">
							<div className="card-body">
								<div className="d-flex align-items-center mb-3">
									<FaUserEdit className="me-2 text-spotify" size={24} />
									<h3 className="card-title mb-0 text-spotify">Custom Recommendations</h3>
								</div>
								<p className="card-text">Create your own mix of recommendations by selecting your favorite artists, tracks, and genres.</p>
							</div>
						</div>
					</Link>
				</div>

				<div className="col-md-6">
					<Link to="/playlists" className="text-decoration-none">
						<div className="card bg-dark text-white h-100 hover-card">
							<div className="card-body">
								<div className="d-flex align-items-center mb-3">
									<FaListUl className="me-2 text-spotify" size={24} />
									<h3 className="card-title mb-0 text-spotify">Your Playlists</h3>
								</div>
								<p className="card-text">Browse your Spotify playlists and get personalized recommendations based on their content.</p>
							</div>
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}

export default Home;
