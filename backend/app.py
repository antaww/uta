from flask import Flask, request, jsonify, redirect, session, url_for
from flask_cors import CORS
from flask_session import Session
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
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

scope = "user-read-private playlist-read-private playlist-read-collaborative"

sp_oauth = SpotifyOAuth(
    client_id=SPOTIPY_CLIENT_ID,
    client_secret=SPOTIPY_CLIENT_SECRET,
    redirect_uri=SPOTIPY_REDIRECT_URI,
    scope=scope
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

@app.route('/get_suggestions', methods=['POST'])
def get_suggestions():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'Utilisateur non authentifié'}), 401

    data = request.json
    playlist_id = data.get('playlist_id')
    if not playlist_id:
        return jsonify({'error': 'playlist_id manquant'}), 400

    try:
        # Récupérer les pistes de la playlist
        results = sp.playlist_tracks(playlist_id)
        tracks = results['items']
        while results['next']:
            results = sp.next(results)
            tracks.extend(results['items'])

        track_ids = [item['track']['id'] for item in tracks if item['track']['id']]

        if not track_ids:
            return jsonify({'error': 'Aucune piste trouvée dans la playlist.'}), 400

        # Récupérer les caractéristiques des pistes
        features = sp.audio_features(tracks=track_ids)
        feature_list = []
        valid_track_ids = []
        for feature in features:
            if feature:
                feature_list.append([
                    feature['danceability'],
                    feature['energy'],
                    feature['key'],
                    feature['loudness'],
                    feature['mode'],
                    feature['speechiness'],
                    feature['acousticness'],
                    feature['instrumentalness'],
                    feature['liveness'],
                    feature['valence'],
                    feature['tempo']
                ])
                valid_track_ids.append(feature['id'])

        if not feature_list:
            return jsonify({'error': 'Aucune caractéristique trouvée pour les pistes.'}), 400

        # Appliquer le clustering
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(feature_list)

        kmeans = KMeans(n_clusters=5, random_state=42)  # Ajustez le nombre de clusters selon vos besoins
        kmeans.fit(scaled_features)
        labels = kmeans.labels_

        # Sélectionner une piste par cluster
        selected_tracks = []
        for cluster in range(5):
            cluster_indices = [i for i, label in enumerate(labels) if label == cluster]
            if cluster_indices:
                selected = cluster_indices[0]
                selected_tracks.append(valid_track_ids[selected])
                if len(selected_tracks) >= 10:
                    break

        # Récupérer les détails des pistes suggérées
        suggested_tracks = []
        for track_id in selected_tracks:
            track = sp.track(track_id)
            suggested_tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artist': ', '.join([artist['name'] for artist in track['artists']]),
                'album': track['album']['name'],
                'preview_url': track['preview_url'],
                'external_url': track['external_urls']['spotify']
            })

        return jsonify({
            'suggestions': suggested_tracks
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
