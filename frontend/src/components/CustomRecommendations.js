import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Track from './Like';
import ArtistSearch from './ArtistSearch';
import InfoModal from './InfoModal';

function CustomRecommendations({ standalone = false, onGetRecommendations = () => {} }) {
    const { user } = useContext(UserContext);
    const [customRecommendations, setCustomRecommendations] = useState({
        tracks: [],
        based_on: {
            selected_artists: [],
            selected_tracks: [],
            selected_genres: []
        }
    });
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [targetPopularity, setTargetPopularity] = useState(50);

    const handleGetRecommendations = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/get_custom_recommendations', {
                artists: selectedArtists,
                tracks: selectedTracks,
                genres: selectedGenres,
                target_popularity: targetPopularity
            }, { withCredentials: true });
            
            setCustomRecommendations(response.data);
            if (!standalone) {
                onGetRecommendations(response.data);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Error getting recommendations.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="container text-center mt-5">
                <h2>Please log in to get custom recommendations</h2>
            </div>
        );
    }

    return (
        <div className={standalone ? "container mt-4" : ""}>
            {standalone && <h2 className="fat-text mb-4">Custom Recommendations</h2>}
            
            <div className="mb-4">
                <h5>Target Popularity</h5>
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
                <small>Higher values will recommend more popular tracks</small>
            </div>

            <ArtistSearch
                selectedArtists={selectedArtists}
                setSelectedArtists={setSelectedArtists}
            />

            <button
                className="btn btn-primary green-btn mt-3"
                onClick={handleGetRecommendations}
                disabled={loading || (!selectedArtists.length && !selectedTracks.length && !selectedGenres.length)}
            >
                {loading ? (
                    <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                    </span>
                ) : 'Get Recommendations'}
            </button>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {customRecommendations.tracks.length > 0 && (
                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowCustomModal(true)}
                        >
                            <i className="bi bi-info-circle"></i> View Details
                        </button>
                    </div>
                    <table className="table table-striped">
                        <thead className="table-dark">
                            <tr>
                                <th style={{width: '5%'}}>#</th>
                                <th style={{width: '20%'}}>Name</th>
                                <th style={{width: '20%'}}>Artist</th>
                                <th style={{width: '30%'}}>Album</th>
                                <th style={{width: '15%'}}>Listen</th>
                                <th style={{width: '10%'}}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {customRecommendations.tracks.map((track, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{track.name}</td>
                                    <td>{track.artists.map(a => a.name).join(', ')}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            {track.album?.images?.[0]?.url && (
                                                <img 
                                                    src={track.album.images[0].url} 
                                                    alt={track.album.name}
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <span>{track.album?.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {track.preview_url ? (
                                            <audio controls>
                                                <source src={track.preview_url} type="audio/mpeg"/>
                                                Your browser does not support the audio element.
                                            </audio>
                                        ) : 'No preview available'}
                                    </td>
                                    <td>
                                        <Track track={track} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <InfoModal 
                show={showCustomModal} 
                onClose={() => setShowCustomModal(false)}
                title="Recommendation Details"
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
        </div>
    );
}

export default CustomRecommendations; 