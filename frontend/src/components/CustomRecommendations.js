import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ArtistSearch from './ArtistSearch';

function CustomRecommendations({ onGetRecommendations, targetPopularity }) {
    const [selectedArtists, setSelectedArtists] = useState([]);
    const [selectedTracks, setSelectedTracks] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [availableGenres, setAvailableGenres] = useState([]);
    const [trackQuery, setTrackQuery] = useState('');
    const [trackResults, setTrackResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fonction debounce
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    useEffect(() => {
        // Charger les genres disponibles
        const fetchGenres = async () => {
            try {
                const response = await axios.get('/get_genres', { withCredentials: true });
                setAvailableGenres(response.data.genres);
            } catch (err) {
                console.error('Error fetching genres:', err);
            }
        };
        fetchGenres();
    }, []);

    const searchTracks = async (query) => {
        if (!query.trim()) {
            setTrackResults([]);
            return;
        }

        try {
            const response = await axios.get('/search_tracks', {
                params: { query },
                withCredentials: true
            });
            setTrackResults(response.data.tracks);
        } catch (err) {
            if (err.response?.status === 429) {
                console.error('Rate limit reached. Please wait before searching again.');
            } else {
                console.error('Error searching tracks:', err);
            }
        }
    };

    const debouncedTrackSearch = useCallback(
        debounce(searchQuery => {
            if (searchQuery.length > 0) {
                searchTracks(searchQuery);
            }
        }, 300),
        []
    );

    const handleArtistSelect = (artist) => {
        if (selectedArtists.length < 5) {
            setSelectedArtists([...selectedArtists, artist]);
        }
    };

    const handleTrackSelect = (track) => {
        if (selectedTracks.length < 5) {
            setSelectedTracks([...selectedTracks, track]);
        }
    };

    const handleGenreSelect = (genre) => {
        if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleRemoveArtist = (artistId) => {
        setSelectedArtists(selectedArtists.filter(artist => artist.id !== artistId));
    };

    const handleRemoveTrack = (trackId) => {
        setSelectedTracks(selectedTracks.filter(track => track.id !== trackId));
    };

    const handleRemoveGenre = (genre) => {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
    };

    const handleGetRecommendations = async () => {
        setLoading(true);
        try {
            // Réinitialiser les recommandations précédentes
            onGetRecommendations({
                tracks: [],
                based_on: {
                    selected_artists: [],
                    selected_tracks: [],
                    selected_genres: []
                }
            });

            const response = await axios.post('/get_custom_recommendations', {
                artists: selectedArtists.map(artist => artist.id),
                tracks: selectedTracks.map(track => track.id),
                genres: selectedGenres,
                target_popularity: targetPopularity
            }, { withCredentials: true });
            
            onGetRecommendations(response.data);
        } catch (err) {
            console.error('Error getting recommendations:', err);
        } finally {
            setLoading(false);
        }
    };

    // Ajouter cette fonction helper en haut du composant
    const capitalizeGenre = (genre) => {
        return genre
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="custom-recommendations mb-4">
            <h4 className="fat-text mb-3">Custom Recommendations</h4>
            
            {/* Artists Section */}
            <div className="mb-3">
                <h5>Select Artists (max 5)</h5>
                <ArtistSearch 
                    onSelect={handleArtistSelect} 
                    selectedArtists={selectedArtists.map(a => a.id)} 
                />
                <div className="search-results mt-2">
                    {selectedArtists.map(artist => (
                        <button
                            key={artist.id}
                            className="btn btn-sm btn-primary me-2 mb-2 d-flex align-items-center"
                        >
                            {artist.image && (
                                <img 
                                    src={artist.image} 
                                    alt={artist.name} 
                                    style={{
                                        width: '20px', 
                                        height: '20px', 
                                        borderRadius: '50%',
                                        marginRight: '8px'
                                    }}
                                />
                            )}
                            <span>{artist.name}</span>
                            <button 
                                className="btn-close btn-close-white ms-2" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveArtist(artist.id);
                                }}
                                style={{ 
                                    fontSize: '0.7rem',
                                    padding: '4px',
                                    marginLeft: '8px'
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Tracks Section */}
            <div className="mb-3">
                <h5>Select Tracks (max 5)</h5>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search tracks..."
                    value={trackQuery}
                    onChange={(e) => {
                        setTrackQuery(e.target.value);
                        if (!e.target.value.trim()) {
                            setTrackResults([]);
                        }
                        debouncedTrackSearch(e.target.value);
                    }}
                />
                <div className="search-results mt-2">
                    {trackResults.map(track => (
                        <button
                            key={track.id}
                            className="btn btn-sm btn-outline-primary me-2 mb-2"
                            onClick={() => handleTrackSelect(track)}
                            disabled={selectedTracks.map(t => t.id).includes(track.id)}
                        >
                            {track.image && (
                                <img 
                                    src={track.image} 
                                    alt={track.name} 
                                    style={{
                                        width: '20px', 
                                        height: '20px', 
                                        marginRight: '8px'
                                    }}
                                />
                            )}
                            {track.name} - {track.artists.join(', ')}
                        </button>
                    ))}
                </div>
                <div className="search-results mt-2">
                    {selectedTracks.map(track => (
                        <button
                            key={track.id}
                            className="btn btn-sm btn-primary me-2 mb-2 d-flex align-items-center"
                        >
                            {track.image && (
                                <img 
                                    src={track.image} 
                                    alt={track.name} 
                                    style={{
                                        width: '20px', 
                                        height: '20px', 
                                        marginRight: '8px'
                                    }}
                                />
                            )}
                            <span>{track.name} - {track.artists.join(', ')}</span>
                            <button 
                                className="btn-close btn-close-white ms-2" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTrack(track.id);
                                }}
                                style={{ 
                                    fontSize: '0.7rem',
                                    padding: '4px',
                                    marginLeft: '8px'
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Genres Section */}
            <div className="mb-3">
                <h5>Select Genres (max 3)</h5>
                <select 
                    className="form-select" 
                    onChange={(e) => handleGenreSelect(e.target.value)}
                    value=""
                >
                    <option value="">Choose a genre...</option>
                    {availableGenres.map(genre => (
                        <option 
                            key={genre} 
                            value={genre}
                            disabled={selectedGenres.includes(genre)}
                        >
                            {capitalizeGenre(genre)}
                        </option>
                    ))}
                </select>
                <div className="search-results mt-2">
                    {selectedGenres.map(genre => (
                        <button
                            key={genre}
                            className="btn btn-sm btn-primary me-2 mb-2 d-flex align-items-center"
                        >
                            <span>{capitalizeGenre(genre)}</span>
                            <button 
                                className="btn-close btn-close-white ms-2" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGenre(genre);
                                }}
                                style={{ 
                                    fontSize: '0.7rem',
                                    padding: '4px',
                                    marginLeft: '8px'
                                }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <button 
                className="btn btn-primary green-btn"
                onClick={handleGetRecommendations}
                disabled={loading || (!selectedArtists.length && !selectedTracks.length && !selectedGenres.length)}
            >
                {loading ? (
                    <span>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Getting Recommendations...
                    </span>
                ) : 'Get Recommendations'}
            </button>
        </div>
    );
}

export default CustomRecommendations; 