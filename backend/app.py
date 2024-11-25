from dotenv import load_dotenv
from flask import Flask, request, jsonify
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from sklearn.cluster import KMeans
import os

app = Flask(__name__)

load_dotenv()

# Configurations Spotify
SPOTIPY_CLIENT_ID = os.getenv('SPOTIPY_CLIENT_ID')
SPOTIPY_CLIENT_SECRET = os.getenv('SPOTIPY_CLIENT_SECRET')
SPOTIPY_REDIRECT_URI = os.getenv('SPOTIPY_REDIRECT_URI')

scope = "playlist-read-private playlist-modify-private playlist-modify-public"

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=SPOTIPY_CLIENT_ID,
    client_secret=SPOTIPY_CLIENT_SECRET,
    redirect_uri=SPOTIPY_REDIRECT_URI,
    scope=scope
))

@app.route('/create_playlist', methods=['POST'])
def create_playlist():
    data = request.json
    playlist_id = data.get('playlist_id')
    new_playlist_name = data.get('new_playlist_name', 'Nouvelle Playlist Clusterisée')

    # Récupérer les pistes de la playlist
    results = sp.playlist_tracks(playlist_id)
    tracks = results['items']
    while results['next']:
        results = sp.next(results)
        tracks.extend(results['items'])

    track_ids = [item['track']['id'] for item in tracks if item['track']['id']]

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

    # Appliquer le clustering
    kmeans = KMeans(n_clusters=1)  # Ajustez le nombre de clusters selon vos besoins
    kmeans.fit(feature_list)
    labels = kmeans.labels_

    # Sélectionner une piste par cluster (ici, un seul cluster)
    selected_tracks = []
    for idx, label in enumerate(labels):
        if label == 0:
            selected_tracks.append(valid_track_ids[idx])
            if len(selected_tracks) >= 10:
                break

    # Créer une nouvelle playlist
    user_id = sp.current_user()['id']
    new_playlist = sp.user_playlist_create(user=user_id, name=new_playlist_name, public=False)
    sp.playlist_add_items(new_playlist['id'], selected_tracks)

    return jsonify({
        'message': 'Nouvelle playlist créée avec succès!',
        'playlist_id': new_playlist['id']
    })

if __name__ == '__main__':
    app.run(debug=True)
