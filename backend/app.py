import numpy as np
from flask import Flask, request, jsonify, redirect, session, url_for
from flask_cors import CORS
from flask_session import Session
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
import traceback
import random

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Permet les cookies avec CORS
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'votre_clé_secrète')  # Remplacez par une clé secrète sécurisée
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)  # Initialise la gestion des sessions

# Configurations Spotify
SPOTIPY_CLIENT_ID = os.getenv('SPOTIPY_CLIENT_ID')
SPOTIPY_CLIENT_SECRET = os.getenv('SPOTIPY_CLIENT_SECRET')
SPOTIPY_REDIRECT_URI = os.getenv('SPOTIPY_REDIRECT_URI')

sp_oauth = SpotifyOAuth(
    client_id=SPOTIPY_CLIENT_ID,
    client_secret=SPOTIPY_CLIENT_SECRET,
    redirect_uri=SPOTIPY_REDIRECT_URI,
    scope=[
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "playlist-read-private",
        "playlist-read-collaborative",
        "user-follow-modify",
        "user-follow-read",
        "user-read-playback-position",
        "user-top-read",
        "user-read-recently-played",
        "user-library-modify",
        "user-library-read",
        "user-read-email",
        "user-read-private"
    ]
)

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route('/like', methods=['POST'])
def like():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    track_id = request.json['track_id']
    if not track_id:
        return jsonify({'error': 'track_id manquant'}), 400

    try:
        sp.current_user_saved_tracks_add([track_id])
        return jsonify({'message': 'ok'})
    except Exception as e:
        print(f"Error liking track: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/unlike', methods=['POST'])
def unlike():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    track_id = request.json['track_id']
    if not track_id:
        return jsonify({'error': 'track_id manquant'}), 400

    try:
        sp.current_user_saved_tracks_delete([track_id])
        return jsonify({'message': 'ok'})
    except Exception as e:
        print(f"Error unliking track: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/callback')
def callback():
    session.clear()
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return jsonify({'error': error}), 400

    try:
        token_info = sp_oauth.get_access_token(code, check_cache=False)
    except Exception as e:
        print(f"Error obtaining access token: {e}")
        return jsonify({'error': 'Failed to obtain access token'}), 500

    session['token_info'] = token_info
    return redirect('http://localhost:3000/home')

def get_spotify_client():
    token_info = session.get('token_info', {})
    if not token_info:
        return None

    # Vérifier si le token a expiré
    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info['refresh_token'])
        session['token_info'] = token_info

    return spotipy.Spotify(auth=token_info['access_token'])

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route('/current_user', methods=['GET'])
def current_user():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'authenticated': False}), 401

    try:
        user = sp.current_user()
        return jsonify({'authenticated': True, 'user': user})
    except Exception as e:
        print(f"Error fetching current user: {e}")
        return jsonify({'authenticated': False, 'error': str(e)}), 500

@app.route('/get_playlists', methods=['GET'])
def get_playlists():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    try:
        playlists = []
        results = sp.current_user_playlists()
        while results:
            for item in results['items']:
                playlists.append({
                    'name': item['name'],
                    'id': item['id'],
                    'url': item['external_urls']['spotify'],
                    'owner': item['owner']['display_name']
                })
            if results['next']:
                results = sp.next(results)
            else:
                results = None
        return jsonify(playlists)
    except Exception as e:
        print(f"Error fetching playlists: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/get_playlist_image', methods=['GET'])
def get_playlist_image():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    playlist_id = request.args.get('playlist_id')
    if not playlist_id:
        return jsonify({'error': 'playlist_id manquant'}), 400

    try:
        image = sp.playlist_cover_image(playlist_id)
        if image:
            return jsonify({'url': image[0]['url']})
        else:
            return jsonify({'url': ''})
    except Exception as e:
        print(f"Error fetching playlist image: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_playlist_details', methods=['GET'])
def get_playlist_details():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    playlist_id = request.args.get('playlist_id')
    if not playlist_id:
        return jsonify({'error': 'playlist_id manquant'}), 400

    try:
        playlist = sp.playlist(playlist_id)
        tracks = playlist['tracks']['items']
        all_tracks = []
        while playlist['tracks']['next']:
            playlist = sp.next(playlist['tracks'])
            tracks.extend(playlist['items'])

        for item in tracks:
            track = item['track']
            all_tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artist': ', '.join([artist['name'] for artist in track['artists']]),
                'album': track['album']['name'],
                'preview_url': track['preview_url'],
                'external_url': track['external_urls']['spotify']
            })

        return jsonify({
            'playlist_name': playlist['name'],
            'tracks': all_tracks
        })
    except spotipy.exceptions.SpotifyException as e:
        error_message = f"SpotifyException: {str(e)}"
        print(error_message)
        print(traceback.format_exc())
        return jsonify({'error': error_message}), 500
    except Exception as e:
        error_message = f"Exception: {str(e)}"
        print(error_message)
        print(traceback.format_exc())
        return jsonify({'error': error_message}), 500


@app.route('/get_recommendations', methods=['GET'])
def get_recommendations():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    try:
        # 1. Récupérer l'historique d'écoute récent et les top artistes
        recent_tracks = sp.current_user_recently_played(limit=30)
        top_artists_data = sp.current_user_top_artists(limit=10, time_range='short_term')
        
        # Formater l'historique d'écoute
        recent_tracks_formatted = []
        recent_track_ids = set()
        artist_counts = {}
        genre_counts = {}
        
        # Traiter l'historique récent
        for item in recent_tracks['items']:
            track = item['track']
            recent_track_ids.add(track['id'])
            recent_tracks_formatted.append({
                'id': track['id'],
                'name': track['name'],
                'artists': [artist['name'] for artist in track['artists']],
                'album': track['album']['name']
            })
            
            # Compter les artistes et genres
            for artist in track['artists']:
                artist_id = artist['id']
                if artist_id not in artist_counts:
                    artist_counts[artist_id] = {
                        'count': 1,
                        'name': artist['name']
                    }
                else:
                    artist_counts[artist_id]['count'] += 1

        # Collecter les genres des top artistes
        for artist in top_artists_data['items']:
            for genre in artist['genres']:
                genre_counts[genre] = genre_counts.get(genre, 0) + 1

        # Obtenir les top artistes et genres
        top_artists = sorted(artist_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:5]
        top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Collecter des pistes similaires
        similar_tracks = []
        
        # À partir des top artistes de l'utilisateur
        for artist in top_artists_data['items']:
            try:
                top_tracks = sp.artist_top_tracks(artist['id'])['tracks']
                for track in top_tracks[:5]:
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Top artiste: {artist['name']}"
                        })
            except Exception as e:
                print(f"Erreur lors de la récupération des tracks pour {artist['name']}: {e}")
                continue

        # À partir des genres
        for genre, _ in top_genres:
            try:
                # Rechercher des tracks par genre
                results = sp.search(q=f"genre:{genre}", type='track', limit=10)
                for track in results['tracks']['items']:
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Genre: {genre}"
                        })
            except Exception as e:
                print(f"Erreur lors de la recherche du genre {genre}: {e}")
                continue

        # Rechercher des tracks similaires aux dernières écoutes
        for recent_track in recent_tracks_formatted[:5]:
            try:
                results = sp.search(
                    q=f"track:{recent_track['name']} artist:{recent_track['artists'][0]}", 
                    type='track', 
                    limit=5
                )
                for track in results['tracks']['items']:
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Similaire à: {recent_track['name']}"
                        })
            except Exception as e:
                print(f"Erreur lors de la recherche de similaires pour {recent_track['name']}: {e}")
                continue

        # Mélanger et sélectionner les recommandations
        random.shuffle(similar_tracks)
        recommendations = similar_tracks[:40]

        # Formater la réponse
        formatted_response = {
            'tracks': [item['track'] for item in recommendations],
            'based_on': {
                'recent_tracks': recent_tracks_formatted[:10],
                'top_artists': [{'name': info['name'], 'count': info['count']} for _, info in top_artists],
                'top_genres': [{'name': genre, 'count': count} for genre, count in top_genres]
            }
        }
        
        return jsonify(formatted_response)
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_playlist_suggestions', methods=['POST'])
def get_playlist_suggestions():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    try:
        playlist_id = request.json['playlist_id']
        playlist = sp.playlist(playlist_id)
        tracks = playlist['tracks']['items']
        all_tracks = []
        while playlist['tracks']['next']:
            playlist = sp.next(playlist['tracks'])
            tracks.extend(playlist['items'])

        for item in tracks:
            track = item['track']
            all_tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artist': ', '.join([artist['name'] for artist in track['artists']]),
                'album': track['album']['name'],
                'preview_url': track['preview_url'],
                'external_url': track['external_urls']['spotify']
            })

        # Créer une matrice de features pour les chansons
        features = []
        for track in all_tracks:
            if track['preview_url']:
                features.append(sp.audio_features(track['id'])[0])

        feature_names = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
                         'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo']
        X = np.array([[track[feature] for feature in feature_names] for track in features])
        print(features)

        return jsonify({'message': 'ok'})

    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
