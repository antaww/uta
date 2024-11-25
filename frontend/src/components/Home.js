// src/components/Home.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [playlistDetails, setPlaylistDetails] = useState(null);
  const [suggestedTracks, setSuggestedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const fetchUser = async () => {
      try {
        const response = await axios.get('/current_user', { withCredentials: true });
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
      const response = await axios.get('/get_playlists', { withCredentials: true });
      setPlaylists(response.data);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la récupération des playlists.');
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
        params: { playlist_id },
        withCredentials: true
      });
      setPlaylistDetails(response.data);

      // Récupérer les suggestions
      const suggestionsResponse = await axios.post('/get_suggestions', {
        playlist_id
      }, { withCredentials: true });
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
      <h2>Bienvenue, {user.display_name}!</h2>
      <h3 className="mt-4">Vos Playlists</h3>
      {playlists.length === 0 ? (
        <p>Vous n'avez aucune playlist.</p>
      ) : (
        <div className="list-group">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              className={`list-group-item list-group-item-action ${selectedPlaylist === playlist.id ? 'active' : ''}`}
              onClick={() => handlePlaylistSelect(playlist.id)}
            >
              {playlist.name}
            </button>
          ))}
        </div>
      )}

      {error && <div className="alert alert-danger mt-4">{error}</div>}

      {loading && <p className="mt-4">Chargement des détails et des suggestions...</p>}

      {playlistDetails && (
        <div className="mt-5">
          <h3>Playlist: {playlistDetails.playlist_name}</h3>
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
                        <source src={track.preview_url} type="audio/mpeg" />
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
                        <source src={track.preview_url} type="audio/mpeg" />
                        Votre navigateur ne supporte pas l'élément audio.
                      </audio>
                    ) : (
                      'Pas de prévisualisation'
                    )}
                  </td>
                  <td>
                    <a href={track.external_url} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                      Spotify
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Home;
