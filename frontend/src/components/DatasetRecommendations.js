import React, { useState } from 'react';
import axios from 'axios';
import InfoModal from './InfoModal';
import SongComparisonChart from './SongComparisonChart';

const DatasetRecommendations = () => {
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedComparisonSong, setSelectedComparisonSong] = useState([]);
    const [recommendationDetails, setRecommendationDetails] = useState({
        recommendations: [],
        based_on: {
            input_songs: []
        }
    });

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get('/search_dataset_tracks', {
                params: { query },
                withCredentials: true
            });
            setSearchResults(response.data.tracks);
        } catch (err) {
            console.error('Error searching tracks:', err);
            setError('Failed to search tracks');
        }
    };

    const handleSongSelect = (song) => {
        if (!selectedSongs.find(s => s.id === song.id)) {
            setSelectedSongs([...selectedSongs, {
                name: song.name,
                year: song.year,
                id: song.id
            }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveSong = (songId) => {
        setSelectedSongs(selectedSongs.filter(song => song.id !== songId));
    };

    const getRecommendations = async () => {
        if (selectedSongs.length === 0) {
            setError('Please select at least one song');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post('/get_dataset_recommendations', {
                songs: selectedSongs
            }, {
                withCredentials: true
            });
            setRecommendations(response.data.recommendations);
            setRecommendationDetails(response.data);
        } catch (err) {
            console.error('Error getting recommendations:', err);
            setError('Failed to get recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleComparisonSongSelect = (song) => {
        setSelectedComparisonSong(song);
    };

    return (
        <div className="container mt-4">
            <h2 className="fat-text mb-4">Recommendations based on dataset</h2>
            
            {/* Search input */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search for a song or artist in the dataset..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                />
                
                {/* Search results */}
                {searchResults.length > 0 && (
                    <div className="list-group mt-2">
                        {searchResults.map(track => (
                            <button
                                key={track.id}
                                className="list-group-item list-group-item-action"
                                onClick={() => handleSongSelect(track)}
                            >
                                {track.name} - {Array.isArray(track.artists) ? track.artists.join(', ') : track.artists} ({track.year})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected songs */}
            {selectedSongs.length > 0 && (
                <div className="mb-3">
                    <h5>Selected Songs:</h5>
                    <div className="list-group">
                        {selectedSongs.map(song => (
                            <div key={song.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {song.name} ({song.year})
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemoveSong(song.id)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Get recommendations button */}
            <button
                className="btn btn-primary green-btn"
                onClick={getRecommendations}
                disabled={loading || selectedSongs.length === 0}
            >
                {loading ? (
                    <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                    </span>
                ) : 'Get Recommendations'}
            </button>

            {/* Error message */}
            {error && (
                <div className="alert alert-danger mt-3">
                    {error}
                </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Recommendations:</h5>
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowDetailsModal(true)}
                        >
                            <i className="bi bi-info-circle"></i> View Details
                        </button>
                    </div>
                    <table className="table table-striped">
                        <thead className="table-dark">
                            <tr>
                                <th style={{width: '5%'}}>#</th>
                                <th style={{width: '45%'}}>Name</th>
                                <th style={{width: '40%'}}>Artist</th>
                                <th style={{width: '10%'}}>Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recommendations.map((track, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{track.name}</td>
                                    <td>{Array.isArray(track.artists) ? track.artists.join(', ') : track.artists}</td>
                                    <td>{track.year}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            <InfoModal 
                show={showDetailsModal} 
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedComparisonSong([]);
                }}
                title="Recommendation Details"
            >
                {recommendationDetails.based_on.input_songs?.length > 0 && (
                    <div className="info-section">
                        <h6>Input Songs Features</h6>
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Song</th>
                                        <th>Valence</th>
                                        <th>Energy</th>
                                        <th>Danceability</th>
                                        <th>Acousticness</th>
                                        <th>Instrumentalness</th>
                                        <th>Tempo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recommendationDetails.based_on.input_songs.map((song, index) => (
                                        <tr key={index}>
                                            <td>{song.name}</td>
                                            <td>{song.valence}</td>
                                            <td>{song.energy}</td>
                                            <td>{song.danceability}</td>
                                            <td>{song.acousticness}</td>
                                            <td>{song.instrumentalness}</td>
                                            <td>{song.tempo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {recommendations.length > 0 && (
                    <div className="info-section mt-4">
                        <h6>Recommended Songs Features</h6>
                        <div className="table-responsive">
                            <table className="table table-sm">
                                <thead>

                                    <tr>
                                        <th>Song</th>
                                        <th>Valence</th>
                                        <th>Energy</th>
                                        <th>Danceability</th>
                                        <th>Acousticness</th>
                                        <th>Instrumentalness</th>
                                        <th>Tempo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recommendations.map((song, index) => (
                                        <tr key={index}>
                                            <td>{song.name}</td>
                                            <td>{song.valence}</td>
                                            <td>{song.energy}</td>
                                            <td>{song.danceability}</td>
                                            <td>{song.acousticness}</td>
                                            <td>{song.instrumentalness}</td>
                                            <td>{song.tempo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

{recommendations.length > 0 && (
                    <div className="info-section">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Features Comparison</h6>
                        </div>
                        <div className="comparison-container">

                            <div className="comparison-options">
                                {recommendations.map((song, index) => (
                                    <div 
                                        key={index} 
                                        className="form-check" 
                                        style={{ 
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                        }}
                                        onClick={() => {
                                            const isSelected = selectedComparisonSong.some(s => s.name === song.name);
                                            if (isSelected) {
                                                setSelectedComparisonSong(prev => 
                                                    prev.filter(s => s.name !== song.name)
                                                );
                                            } else {
                                                setSelectedComparisonSong(prev => [...prev, song]);
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`compare-song-${index}`}
                                            checked={selectedComparisonSong.some(s => s.name === song.name)}
                                            onChange={() => {}}
                                        />
                                        <label 
                                            className="form-check-label" 
                                            htmlFor={`compare-song-${index}`}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%',
                                                display: 'block'
                                            }}
                                            onClick={(e) => e.preventDefault()}
                                            title={`${song.name} - ${Array.isArray(song.artists) ? song.artists.join(', ') : song.artists}`}
                                        >
                                            {song.name} - {Array.isArray(song.artists) ? song.artists.join(', ') : song.artists}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="comparison-chart">
                                {recommendationDetails.based_on.input_songs?.[0] && (
                                    <SongComparisonChart 
                                        inputSong={recommendationDetails.based_on.input_songs[0]}
                                        comparedSongs={selectedComparisonSong}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </InfoModal>
        </div>
    );
};

export default DatasetRecommendations; 