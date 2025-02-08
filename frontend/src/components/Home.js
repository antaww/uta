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
					<div className="card bg-dark text-white h-100">
						<div className="card-body">
							<div className="d-flex align-items-center mb-3">
								<FaMusic className="me-2" size={24} />
								<h3 className="card-title mb-0">Dataset Recommendations</h3>
							</div>
							<p className="card-text">Get music recommendations based on our curated dataset of songs and their features.</p>
							<Link to="/dataset-recommendations" className="btn btn-primary green-btn">Explore Dataset Recommendations</Link>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card bg-dark text-white h-100">
						<div className="card-body">
							<div className="d-flex align-items-center mb-3">
								<FaHistory className="me-2" size={24} />
								<h3 className="card-title mb-0">History Recommendations</h3>
							</div>
							<p className="card-text">Get personalized recommendations based on your listening history and preferences.</p>
							<Link to="/history-recommendations" className="btn btn-primary green-btn">View History Recommendations</Link>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card bg-dark text-white h-100">
						<div className="card-body">
							<div className="d-flex align-items-center mb-3">
								<FaUserEdit className="me-2" size={24} />
								<h3 className="card-title mb-0">Custom Recommendations</h3>
							</div>
							<p className="card-text">Create your own mix of recommendations by selecting your favorite artists, tracks, and genres.</p>
							<Link to="/custom-recommendations" className="btn btn-primary green-btn">Create Custom Recommendations</Link>
						</div>
					</div>
				</div>

				<div className="col-md-6">
					<div className="card bg-dark text-white h-100">
						<div className="card-body">
							<div className="d-flex align-items-center mb-3">
								<FaListUl className="me-2" size={24} />
								<h3 className="card-title mb-0">Your Playlists</h3>
							</div>
							<p className="card-text">Browse your Spotify playlists and get personalized recommendations based on their content.</p>
							<Link to="/playlists" className="btn btn-primary green-btn">View Your Playlists</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Home;
