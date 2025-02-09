import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

function Playlists() {
    const { user } = useContext(UserContext);
    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState('');
    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(50);

    useEffect(() => {
        if (user) {
            fetchPlaylists();
        }
    }, [user]);

    useEffect(() => {
        if (selectedPlaylist) {
            fetchPlaylistDetails();
        }
    }, [selectedPlaylist, currentPage]);

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

    const handlePlaylistSelect = (playlist_id) => {
        setSelectedPlaylist(playlist_id);
        setCurrentPage(1);
        setLoading(true);
        setError('');
        setPlaylistDetails(null);
    };

    const fetchPlaylistDetails = async () => {
        try {
            const response = await axios.get('/get_playlist_details', {
                params: {
                    playlist_id: selectedPlaylist,
                    page: currentPage,
                    per_page: perPage
                },
                withCredentials: true
            });
            setPlaylistDetails(response.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Error retrieving playlist details.');
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
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

                        {loading && <p>Loading playlist details...</p>}

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
                                                <td>{((currentPage - 1) * perPage) + index + 1}</td>
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

                                {/* Pagination Controls */}
                                {playlistDetails.pagination && (
                                    <div className="d-flex justify-content-center gap-2 mt-3 mb-4">
                                        <button
                                            className="btn btn-outline-danger pagination-btn"
                                            onClick={() => handlePageChange(1)}
                                            disabled={currentPage === 1}
                                            title="First page"
                                        >
                                            <FaAngleDoubleLeft />
                                        </button>
                                        <button
                                            className="btn btn-outline-danger pagination-btn"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            title="Previous page"
                                        >
                                            <FaAngleLeft />
                                        </button>
                                        <span className="btn">
                                            Page {currentPage} of {playlistDetails.pagination.total_pages}
                                        </span>
                                        <button
                                            className="btn btn-outline-danger pagination-btn"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === playlistDetails.pagination.total_pages}
                                            title="Next page"
                                        >
                                            <FaAngleRight />
                                        </button>
                                        <button
                                            className="btn btn-outline-danger pagination-btn"
                                            onClick={() => handlePageChange(playlistDetails.pagination.total_pages)}
                                            disabled={currentPage === playlistDetails.pagination.total_pages}
                                            title="Last page"
                                        >
                                            <FaAngleDoubleRight />
                                        </button>
                                    </div>
                                )}

                                <style jsx="true">{`
                                    .pagination-btn {
                                        padding: 0.375rem 0.75rem;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    }
                                    .pagination-btn:disabled {
                                        opacity: 0.5;
                                        cursor: not-allowed;
                                    }
                                    .pagination-btn:disabled:hover {
                                        background-color: transparent;
                                        color: var(--bs-danger);
                                    }
                                    .pagination-btn svg {
                                        width: 16px;
                                        height: 16px;
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Playlists; 