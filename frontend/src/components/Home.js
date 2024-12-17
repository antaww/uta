// src/components/Home.js
import React, {useContext, useEffect, useState} from 'react';
import axios from 'axios';
import Track from "./Like";
import {UserContext} from '../context/UserContext';

function Home() {
	const {
		user,
		setUser
	} = useContext(UserContext);
	const [playlists, setPlaylists] = useState([]);
	const [selectedPlaylist, setSelectedPlaylist] = useState('');
	const [playlistDetails, setPlaylistDetails] = useState(null);
	const [suggestedTracks, setSuggestedTracks] = useState([]);
	const [recommendations, setRecommendations] = useState({
		tracks: [],
		based_on: {
			recent_tracks: [],
			top_artists: [],
			top_genres: []
		}
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

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
				setError('Vous devez vous connecter pour accéder à cette page.');
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
			setError('Erreur lors de la récupération des playlists.');
		}
	};

	const fetchRecommendations = async () => {
		try {
			const response = await axios.get('/get_recommendations', {withCredentials: true});
			setRecommendations(response.data);
		} catch (err) {
			console.error(err);
			setError(err.response?.data?.error || 'Erreur lors de la récupération des recommandations.');
		}
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
			setError(err.response?.data?.error || 'Erreur lors de la récupération des détails ou des suggestions.');
			setLoading(false);
		}
	};

	if (!user) {
		return (
			<div className="container text-center my-5">
				<h2>Chargement...</h2>
			</div>
		);
	}

	return (
		<div className="container my-5">
			<div class="d-flex align-items-center gap-3">
				<img src={user.images[0].url} alt={user.display_name} className="profile-icon"/>
				<h2 class="fat-text">Bienvenue, {user.display_name}!</h2>
			</div>
			<hr/>
			<div class="gap-4 d-flex justify-content-between align-items-center">
				<h4 className="m-0 fat-text">Découverte</h4> {recommendations.tracks.length > 0 ? (
				<button className="btn btn-secondary m-0 fat-text transparent-btn" onClick={fetchRecommendations}>
					Refresh
				</button>) : null}
			</div>
			{recommendations.tracks.length === 0 ? (
				<button className="btn btn-primary mt-3 green-btn" onClick={fetchRecommendations}>
					Découvrir de la musique
				</button>
			) : (
				<div className="mt-3">
					<table className="table table-striped mt-3">
						<thead className="table-dark">
						<tr>
							<th>#</th>
							<th>Nom</th>
							<th>Artiste</th>
							<th>Album</th>
							<th>Écouter</th>
							<th>Spotify</th>
						</tr>
						</thead>
						<tbody>
						{recommendations.tracks.map((track, index) => (
							<tr key={track.id}>
								<td>{index + 1}</td>
								<td>{track.name}</td>
								<td>{track.artists ? track.artists.map(artist => artist.name).join(', ') : 'Artiste inconnu'}</td>
								<td>{track.album ? track.album.name : 'Album inconnu'}</td>
								<td>
									{track.preview_url ? (
										<audio controls>
											<source src={track.preview_url} type="audio/mpeg"/>
											Votre navigateur ne supporte pas l'élément audio.
										</audio>
									) : (
										'Pas de prévisualisation'
									)}
								</td>
								<Track track={track}/>
							</tr>
						))}
						</tbody>
					</table>
				</div>
			)}
			<hr/>
			<h4 className="fat-text">Vos Playlists</h4>
			{playlists.length === 0 ? (
				<p>Vous n'avez aucune playlist.</p>
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

			{loading && <p className="mt-4">Chargement des détails et des suggestions...</p>}

			{playlistDetails && (
				<div className="">
					<hr/>
					<h4 class="fat-text">Playlist: {playlistDetails.playlist_name}</h4>
					<table className="table table-striped mt-3">
						<thead className="table-dark">
						<tr>
							<th>#</th>
							<th>Nom</th>
							<th>Artiste</th>
							<th>Album</th>
							<th>Écouter</th>
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
											Votre navigateur ne supporte pas l'élément audio.
										</audio>
									) : (
										'Pas de prévisualisation'
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
					<h3>Suggestions de Musiques</h3>
					<table className="table table-striped mt-3">
						<thead className="table-dark">
						<tr>
							<th>#</th>
							<th>Nom</th>
							<th>Artiste</th>
							<th>Album</th>
							<th>Écouter</th>
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
											Votre navigateur ne supporte pas l'élément audio.
										</audio>
									) : (
										'Pas de prévisualisation'
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

			{recommendations.tracks.length > 0 && (
				<div className="mt-4">
					<h4 className="fat-text">Basé sur vos écoutes récentes</h4>
					
					{/* Top Artists */}
					<div className="mb-3">
						<h5>Artistes les plus écoutés :</h5>
						<ul className="list-unstyled">
							{recommendations.based_on?.top_artists.map((artist, index) => (
								<li key={index} className="mb-1">
									{artist.name} ({artist.count} écoutes)
								</li>
							))}
						</ul>
					</div>

					{/* Top Genres */}
					<div className="mb-3">
						<h5>Genres les plus écoutés :</h5>
						<ul className="list-unstyled">
							{recommendations.based_on?.top_genres.map((genre, index) => (
								<li key={index} className="mb-1">
									{genre.name} ({genre.count} écoutes)
								</li>
							))}
						</ul>
					</div>

					{/* Recent Tracks */}
					<div className="mb-3">
						<h5>Dernières écoutes :</h5>
						<table className="table table-sm">
							<thead>
								<tr>
									<th>Titre</th>
									<th>Artiste(s)</th>
									<th>Album</th>
								</tr>
							</thead>
							<tbody>
								{recommendations.based_on?.recent_tracks.map((track, index) => (
									<tr key={index}>
										<td>{track.name}</td>
										<td>{track.artists.join(', ')}</td>
										<td>{track.album}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}

export default Home;
