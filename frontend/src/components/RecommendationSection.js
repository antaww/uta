import React from 'react';
import Track from './Like';

const RecommendationSection = ({ 
    title, 
    recommendations, 
    onRefresh, 
    loading, 
    showRefreshButton = true,
    onShowDetails,
    customContent
}) => {
    return (
        <div className="mb-5">
            <h4 className="fat-text mb-3">{title}</h4>
            <div className="d-flex gap-2 align-items-center">
                {showRefreshButton && (
                    <button 
                        className="btn btn-primary green-btn" 
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        {loading ? (
                            <span>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Loading...
                            </span>
                        ) : recommendations.tracks.length ? 'Refresh Recommendations' : 'Get Recommendations'}
                    </button>
                )}
                {recommendations.tracks.length > 0 && (
                    <button 
                        className="btn btn-outline-primary"
                        onClick={onShowDetails}
                    >
                        <i className="bi bi-info-circle"></i> View Details
                    </button>
                )}
            </div>

            {customContent}

            {recommendations.tracks.length > 0 && (
                <div className="mt-3">
                    <table className="table table-striped">
                        <thead className="table-dark">
                            <tr>
                                <th style={{width: '5%'}}>#</th>
                                <th style={{width: '25%'}}>Name</th>
                                <th style={{width: '20%'}}>Artist</th>
                                <th style={{width: '25%'}}>Album</th>
                                <th style={{width: '15%'}}>Listen</th>
                                <th style={{width: '10%'}} className="text-center">Spotify</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recommendations.tracks.map((track, index) => (
                                <tr key={track.id}>
                                    <td className="align-middle">{index + 1}</td>
                                    <td className="align-middle">{track.name}</td>
                                    <td className="align-middle">{track.artists.map(artist => artist.name).join(', ')}</td>
                                    <td className="align-middle">
                                        <div className="d-flex align-items-center">
                                            {track.album?.images?.[2]?.url && (
                                                <img 
                                                    src={track.album.images[2].url} 
                                                    alt={track.album.name} 
                                                    style={{width: '40px', height: '40px', marginRight: '10px'}}
                                                />
                                            )}
                                            {track.album.name}
                                        </div>
                                    </td>
                                    <td className="align-middle">
                                        {track.preview_url ? (
                                            <audio controls style={{width: '100%', maxWidth: '200px'}}>
                                                <source src={track.preview_url} type="audio/mpeg"/>
                                                Your browser does not support the audio element.
                                            </audio>
                                        ) : (
                                            'No preview available'
                                        )}
                                    </td>
                                    <td className="align-middle text-center">
                                        <Track track={track}/>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecommendationSection; 