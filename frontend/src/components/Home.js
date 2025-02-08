// src/components/Home.js
import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import Track from "./Like";
import {UserContext} from '../context/UserContext';
import CustomRecommendations from './CustomRecommendations';
import InfoModal from './InfoModal';
import RecommendationSection from './RecommendationSection';
import DatasetRecommendations from './DatasetRecommendations';

function Home() {
	const {
		user,
		setUser
	} = useContext(UserContext);
	const [playlists, setPlaylists] = useState([]);
	const [selectedPlaylist, setSelectedPlaylist] = useState('');
	const [playlistDetails, setPlaylistDetails] = useState(null);
	const [suggestedTracks, setSuggestedTracks] = useState([]);
	const [historyRecommendations, setHistoryRecommendations] = useState({
		tracks: [],
		based_on: {
			recent_tracks: [],
			top_artists: [],
			top_genres: []
		}
	});
	const [customRecommendations, setCustomRecommendations] = useState({
		tracks: [],
		based_on: {
			selected_artists: [],
			selected_tracks: [],
			selected_genres: []
		}
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [loadingRecommendations, setLoadingRecommendations] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [showCustomModal, setShowCustomModal] = useState(false);
	const [targetPopularity, setTargetPopularity] = useState(50);

	useEffect(() => {
		// Vérifier si l'utilisateur est authentifié
		const fetchUser = async () => {
			try {
				const response = await axios.get('/current_user', {withCredentials: true});
				if (response.data.authenticated) {
					setUser(response.data.user);
					fetchPlaylists();
				}
			} catch (err) {
				console.error(err);
				setError('You must be logged in to access this page.');
			}
		};

		fetchUser();
	}, []);

	const fetchPlaylists = async () => {
		try {
			const response = await axios.get('/get_playlists', {withCredentials: true});
			const playlistsWithImages = await Promise.all(response.data.map(async (playlist) => {
				const imageResponse = await axios.get('/get_playlist_image', {
					params: {playlist_id: playlist.id},
					withCredentials: true
				});
				return {
					...playlist,
					imageUrl: imageResponse.data.url
				};
			}));
			setPlaylists(playlistsWithImages);
		} catch (err) {
			console.error(err);
			setError('Error retrieving playlists.');
		}
	};

	const fetchHistoryRecommendations = async () => {
		setLoadingRecommendations(true);
		try {
			const response = await axios.get('/get_recommendations', {
				params: { target_popularity: targetPopularity },
				withCredentials: true
			});
			setHistoryRecommendations(response.data);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.error || 'Error retrieving recommendations.');
		} finally {
			setLoadingRecommendations(false);
		}
	};

	const handleCustomRecommendations = (customRecommendations) => {
		setCustomRecommendations(customRecommendations);
	};

	const handlePlaylistSelect = async (playlist_id) => {
		setSelectedPlaylist(playlist_id);
		setLoading(true);
		setError('');
		setPlaylistDetails(null);
		setSuggestedTracks([]);

		try {
			// Récupérer les détails de la playlist
			const response = await axios.get('/get_playlist_details', {
				params: {playlist_id},
				withCredentials: true
			});
			setPlaylistDetails(response.data);

			// Récupérer les suggestions
			const suggestionsResponse = await axios.post('/get_playlist_suggestions', {
				playlist_id
			}, {withCredentials: true});
			setSuggestedTracks(suggestionsResponse.data.suggestions);
			setLoading(false);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.error || 'Error retrieving details or suggestions.');
			setLoading(false);
		}
	};

	return (
		<div className="container mt-4">
			{user ? (
				<>
					<DatasetRecommendations />

					<RecommendationSection
						title="Recommendations based on your History"
						recommendations={historyRecommendations}
						onRefresh={fetchHistoryRecommendations}
						loading={loadingRecommendations}
						onShowDetails={() => setShowHistoryModal(true)}
					/>

					<div className="d-flex align-items-center gap-3">
						<img src={user.images[0].url} alt={user.display_name} className="profile-icon"/>
						<h2 className="fat-text">Welcome, {user.display_name}!</h2>
					</div>
					<hr/>

					<div className="mb-4">
						<h5>Target Popularity for Recommendations</h5>
						<div className="d-flex align-items-center">
							<input
								type="range"
								className="form-range"
								min="0"
								max="100"
								value={targetPopularity}
								onChange={(e) => setTargetPopularity(parseInt(e.target.value))}
							/>
							<span className="ms-2">{targetPopularity}</span>
						</div>
						<small>
							Higher values will recommend more popular tracks
						</small>
					</div>

					<RecommendationSection 
						title="Recommendations based on your Choices"
						recommendations={customRecommendations}
						loading={loadingRecommendations}
						showRefreshButton={false}
						onShowDetails={() => setShowCustomModal(true)}
						customContent={
							<CustomRecommendations 
								onGetRecommendations={handleCustomRecommendations} 
								targetPopularity={targetPopularity}
							/>
						}
					/>

					<hr/>
					<h4 className="fat-text">Your Playlists</h4>
					{playlists.length === 0 ? (
						<p>You don't have any playlists.</p>
					) : (
						<div className="list-group">
							{playlists.map((playlist) => (
								<button
									key={playlist.id}
									className={`d-flex gap-4 playlist-btn list-group-item list-group-item-action ${selectedPlaylist === playlist.id ? 'active' : ''}`}
									onClick={() => handlePlaylistSelect(playlist.id)}
								>
									{playlist.imageUrl &&
										<img src={playlist.imageUrl} alt={playlist.name} className="playlist-icon"/>}
									{playlist.name}
								</button>
							))}
						</div>
					)}

					{error && <div className="alert alert-danger mt-4">{error}</div>}

					{loading && <p className="mt-4">Loading details and suggestions...</p>}

					{playlistDetails && (
						<div className="">
							<hr/>
							<h4 class="fat-text">Playlist: {playlistDetails.playlist_name}</h4>
							<table className="table table-striped mt-3">
								<thead className="table-dark">
								<tr>
									<th>#</th>
									<th>Name</th>
									<th>Artist</th>
									<th>Album</th>
									<th>Listen</th>
								</tr>
								</thead>
								<tbody>
								{playlistDetails.tracks.map((track, index) => (
									<tr key={track.id}>
										<td>{index + 1}</td>
										<td>{track.name}</td>
										<td>{track.artist}</td>
										<td>{track.album}</td>
										<td>
											{track.preview_url ? (
												<audio controls>
													<source src={track.preview_url} type="audio/mpeg"/>
													Your browser does not support the audio element.
												</audio>
											) : (
												'No preview available'
											)}
										</td>
									</tr>
								))}
								</tbody>
							</table>
						</div>
					)}

					{suggestedTracks.length > 0 && (
						<div className="mt-5">
							<h3>Music Suggestions</h3>
							<table className="table table-striped mt-3">
								<thead className="table-dark">
								<tr>
									<th>#</th>
									<th>Name</th>
									<th>Artist</th>
									<th>Album</th>
									<th>Listen</th>
									<th>Spotify</th>
								</tr>
								</thead>
								<tbody>
								{suggestedTracks.map((track, index) => (
									<tr key={track.id}>
										<td>{index + 1}</td>
										<td>{track.name}</td>
										<td>{track.artist}</td>
										<td>{track.album}</td>
										<td>
											{track.preview_url ? (
												<audio controls>
													<source src={track.preview_url} type="audio/mpeg"/>
													Your browser does not support the audio element.
												</audio>
											) : (
												'No preview available'
											)}
										</td>
										<td>
											<a href={track.external_url} target="_blank" rel="noopener noreferrer"
											   className="btn btn-success btn-sm">
												Spotify
											</a>
										</td>
									</tr>
								))}
								</tbody>
							</table>
						</div>
					)}

					<InfoModal 
						show={showHistoryModal} 
						onClose={() => setShowHistoryModal(false)}
						title="Based on your History"
					>
						{historyRecommendations.based_on.recent_tracks?.length > 0 && (
							<div className="info-section">
								<h6>Recent listens:</h6>
								<ul className="info-list">
									{historyRecommendations.based_on.recent_tracks.map((track, index) => (
										<li key={index}>
											<strong>{track.name}</strong>
											<br />
											<small>by {track.artists.join(', ')} • {track.album}</small>
										</li>
									))}
								</ul>
							</div>
						)}
						{historyRecommendations.based_on.top_artists?.length > 0 && (
							<div className="info-section">
								<h6>Most listened artists:</h6>
								<ul className="info-list">
									{historyRecommendations.based_on.top_artists.map((artist, index) => (
										<li key={index}>
											{artist.name} ({artist.count} plays)
										</li>
									))}
								</ul>
							</div>
						)}
						{historyRecommendations.based_on.top_genres?.length > 0 && (
							<div className="info-section">
								<h6>Most listened genres:</h6>
								<ul className="info-list">
									{historyRecommendations.based_on.top_genres.map((genre, index) => (
										<li key={index}>
											{genre.name} ({genre.count} plays)
										</li>
									))}
								</ul>
							</div>
						)}
					</InfoModal>

					<InfoModal 
						show={showCustomModal} 
						onClose={() => setShowCustomModal(false)}
						title="Based on your Selections"
					>
						{customRecommendations.based_on.selected_tracks?.length > 0 && (
							<div className="info-section">
								<h6>Selected tracks:</h6>
								<ul className="info-list">
									{customRecommendations.based_on.selected_tracks.map((trackId, index) => {
										const track = customRecommendations.tracks.find(t => t.id === trackId);
										return (
											<li key={index}>
												{track ? `${track.name} by ${track.artists.map(a => a.name).join(', ')}` : trackId}
											</li>
										);
									})}
								</ul>
							</div>
						)}
						{customRecommendations.based_on.selected_artists?.length > 0 && (
							<div className="info-section">
								<h6>Selected artists:</h6>
								<ul className="info-list">
									{customRecommendations.based_on.selected_artists.map((artistId, index) => {
										const artist = customRecommendations.tracks.find(t => 
											t.artists.some(a => a.id === artistId)
										)?.artists.find(a => a.id === artistId);
										return (
											<li key={index}>
												{artist ? artist.name : artistId}
											</li>
										);
									})}
								</ul>
							</div>
						)}
						{customRecommendations.based_on.selected_genres?.length > 0 && (
							<div className="info-section">
								<h6>Selected genres:</h6>
								<ul className="info-list">
									{customRecommendations.based_on.selected_genres.map((genre, index) => (
										<li key={index}>{genre}</li>
									))}
								</ul>
							</div>
						)}
					</InfoModal>
				</>
			) : (
				<div className="text-center">
					<h2>Welcome to Spotify Recommendations</h2>
					<p>Please log in to see your recommendations.</p>
					<a href="/login" className="btn btn-success">Login with Spotify</a>
				</div>
			)}
		</div>
	);
}

export default Home;
