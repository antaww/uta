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
    x = sp.current_user_top_artists(limit=2, time_range="short_term")
    genres = {}
    for idx, item in enumerate(x["items"]):
        for genre in item["genres"]:
            if genre not in genres:
                genres[genre] = 1
            else:
                genres[genre] += 1
    # get the most played genre
    genres = {k: v for k, v in sorted(genres.items(), key=lambda item: item[1], reverse=True)}
    genres = dict(list(genres.items())[:1])

    # Step 2: Get the current user's top artists (limit to 5)
    artists = sp.current_user_top_artists(limit=1, time_range="short_term")

    # Step 3: Get the current user's top tracks (limit to 5)
    tracks = sp.current_user_top_tracks(limit=1, time_range="short_term")

    seed_genres = list(genres.keys())  # List of genres
    seed_artists = [artist["id"] for artist in artists["items"]]  # List of artist IDs
    seed_tracks = [track["id"] for track in tracks["items"]]  # List of track IDs

    # Debug print statements
    print(f"Seed genres: {seed_genres}")
    print(f"Seed artists: {seed_artists}")
    print(f"Seed tracks: {seed_tracks}")

    # Step 5: Get recommendations based on seeds (genres, artists, tracks)
    recommendations = sp.recommendations(
        seed_artists=[seed_artists[0]],  # Convert artist list to a comma-separated string
        seed_tracks=[seed_tracks[0]],  # Convert track list to a comma-separated string
        seed_genres=[seed_genres[0]],  # Convert genres list to a comma-separated string
    )

    # Step 6: Print recommended tracks
    if "tracks" in recommendations:
        print(f"\nRecommended tracks based on your listening history:")
        for idx, track in enumerate(recommendations["tracks"]):
            print(f"{idx + 1} - {track['name']} by {track['artists'][0]['name']} ({track['id']})")

    # Return the recommendations for further use
    return jsonify(recommendations)

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
