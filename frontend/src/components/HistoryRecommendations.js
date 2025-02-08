import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Track from './Like';
import InfoModal from './InfoModal';

function HistoryRecommendations() {
    const { user } = useContext(UserContext);
    const [historyRecommendations, setHistoryRecommendations] = useState({
        tracks: [],
        based_on: {
            recent_tracks: [],
            top_artists: [],
            top_genres: []
        }
    });
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [error, setError] = useState('');
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [targetPopularity, setTargetPopularity] = useState(50);
    const [resultCount, setResultCount] = useState(10);

    const fetchHistoryRecommendations = async () => {
        setLoadingRecommendations(true);
        try {
            const response = await axios.get('/get_recommendations', {
                params: { 
                    target_popularity: targetPopularity,
                    limit: resultCount
                },
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

    if (!user) {
        return (
            <div className="container text-center mt-5">
                <h2>Please log in to see your recommendations</h2>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className="fat-text mb-4">Recommendations based on your History</h2>
            
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

            <div className="mb-4">
                <h5>Number of Recommendations</h5>
                <div className="d-flex align-items-center">
                    <input
                        type="range"
                        className="form-range"
                        min="1"
                        max="80"
                        value={resultCount}
                        onChange={(e) => setResultCount(parseInt(e.target.value))}
                    />
                    <span className="ms-2">{resultCount}</span>
                </div>
                <small>
                    Choose how many recommendations you want to see (1-80)
                </small>
            </div>

            <button
                className="btn btn-primary green-btn"
                onClick={fetchHistoryRecommendations}
                disabled={loadingRecommendations}
            >
                {loadingRecommendations ? (
                    <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                    </span>
                ) : 'Get Recommendations'}
            </button>

            {error && <div className="alert alert-danger mt-4">{error}</div>}

            {historyRecommendations.tracks.length > 0 && (
                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowHistoryModal(true)}
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
                            {historyRecommendations.tracks.map((track, index) => (
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
                show={showHistoryModal} 
                onClose={() => setShowHistoryModal(false)}
                title="Recommendation Details"
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
        </div>
    );
}

export default HistoryRecommendations; 