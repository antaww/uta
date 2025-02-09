import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ArtistSearch = ({ selectedArtists, setSelectedArtists }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedArtistDetails, setSelectedArtistDetails] = useState([]);

    // Charger les détails des artistes sélectionnés
    useEffect(() => {
        const fetchArtistDetails = async () => {
            if (selectedArtists.length === 0) {
                setSelectedArtistDetails([]);
                return;
            }

            try {
                const response = await axios.get('/get_artists_details', {
                    params: { ids: selectedArtists.join(',') },
                    withCredentials: true
                });
                setSelectedArtistDetails(response.data.artists);
            } catch (err) {
                console.error('Error fetching artist details:', err);
            }
        };

        fetchArtistDetails();
    }, [selectedArtists]);

    const searchArtists = async (searchQuery) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get('/search_artists', {
                params: { query: searchQuery },
                withCredentials: true
            });
            setResults(response.data.artists);
        } catch (err) {
            console.error('Error searching artists:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (artist) => {
        if (!selectedArtists.includes(artist.id)) {
            setSelectedArtists([...selectedArtists, artist.id]);
            setQuery('');
            setResults([]);
        }
    };

    const handleRemove = (artistId) => {
        setSelectedArtists(selectedArtists.filter(id => id !== artistId));
    };

    // Debounce la recherche pour éviter trop de requêtes
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

    // Appliquer le debounce à la fonction de recherche
    const debouncedSearch = React.useCallback(
        debounce(searchQuery => {
            if (searchQuery.length > 0) {
                searchArtists(searchQuery);
            }
        }, 300),
        []
    );

    return (
        <div>
            {/* Barre de recherche */}
            <input
                type="text"
                className="form-control"
                placeholder="Search artists..."
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) {
                        setResults([]);
                    }
                    debouncedSearch(e.target.value);
                }}
            />

            {/* Indicateur de chargement */}
            {loading && (
                <div className="mt-2">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                </div>
            )}

            {/* Résultats de recherche */}
            {results.length > 0 && (
                <div className="search-results mt-2">
                    {results.map(artist => (
                        <button
                            key={artist.id}
                            className="btn btn-sm btn-outline-secondary me-2 mb-2"
                            onClick={() => handleSelect(artist)}
                            disabled={selectedArtists.includes(artist.id)}
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
                            {artist.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Artistes sélectionnés */}
            {selectedArtistDetails.length > 0 && (
                <div className="search-results mt-3">
                    {selectedArtistDetails.map(artist => (
                        <button
                            key={artist.id}
                            className="btn btn-sm btn-outline-secondary me-2 mb-2"
                            onClick={() => handleRemove(artist.id)}
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
                            {artist.name}
                            <span className="ms-2">×</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArtistSearch; 