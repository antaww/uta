import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

function Playlists() {
    const { user } = useContext(UserContext);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [suggestedTracks, setSuggestedTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchPlaylists();
        }
    }, [user]);

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

    if (!user) {
        return (
            <div className="container text-center mt-5">
                <h2>Please log in to see your playlists</h2>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className="fat-text mb-4">Your Playlists</h2>
            
            {playlists.length === 0 ? (
                <p>You don't have any playlists.</p>
            ) : (
                <div className="row">
                    <div className="col-md-4">
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
                    </div>
                    
                    <div className="col-md-8">
                        {error && <div className="alert alert-danger">{error}</div>}

                        {loading && <p>Loading details and suggestions...</p>}

                        {playlistDetails && (
                            <div>
                                <h4 className="fat-text">Playlist: {playlistDetails.playlist_name}</h4>
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
                                <h4 className="fat-text">Music Suggestions</h4>
                                <table className="table table-striped">
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
                    </div>
                </div>
            )}
        </div>
    );
}

export default Playlists; 