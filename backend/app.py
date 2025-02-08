import numpy as np
from flask import Flask, request, jsonify, redirect, session, url_for
from flask_cors import CORS
from flask_session import Session
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
from scipy.spatial.distance import cdist
import os
from dotenv import load_dotenv
from urllib.parse import urlparse
import traceback
import random
from spotipy.exceptions import SpotifyException
import pandas as pd
import ast
from collections import defaultdict

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

# Charger le dataset
data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'exploration', 'Version_finale', 'data', 'data.csv')
data = pd.read_csv(data_path)

def get_song_data(song, spotify_data):
    try:
        name = song['name']
        year = song['year']
        mask = (spotify_data['name'].str.lower() == name.lower()) & (spotify_data['year'] == year)
        return spotify_data[mask].iloc[0]
    except:
        return None

def get_mean_vector(song_list, spotify_data):
    song_vectors = []
    
    # Caractéristiques numériques à utiliser
    number_cols = ['valence', 'year', 'acousticness', 'danceability', 'duration_ms', 'energy',
                  'instrumentalness', 'key', 'liveness', 'loudness', 'mode', 'speechiness', 'tempo']
    
    for song in song_list:
        song_data = get_song_data(song, spotify_data)
        if song_data is None:
            print(f'Warning: {song["name"]} does not exist in the database')
            continue
        song_vector = song_data[number_cols].values
        song_vectors.append(song_vector)
    
    if not song_vectors:
        return None
    
    song_matrix = np.array(list(song_vectors))
    return np.mean(song_matrix, axis=0)

def recommend_songs(song_list, spotify_data, n_songs=9):
    """
    Recommande des chansons basées sur les chansons d'entrée en utilisant les caractéristiques musicales
    """
    # Colonnes de métadonnées et caractéristiques numériques
    metadata_cols = ['name', 'year', 'artists']
    number_cols = ['valence', 'year', 'acousticness', 'danceability', 'duration_ms', 'energy',
                  'instrumentalness', 'key', 'liveness', 'loudness', 'mode', 'speechiness', 'tempo']
    
    # Convertir la colonne artists de string à liste si ce n'est pas déjà fait
    if isinstance(spotify_data.iloc[0]['artists'], str):
        spotify_data['artists'] = spotify_data['artists'].apply(ast.literal_eval)
    
    # Obtenir le vecteur moyen des chansons d'entrée
    song_center = get_mean_vector(song_list, spotify_data)
    input_songs_data = []
    for song in song_list:
        song_data = get_song_data(song, spotify_data)
        if song_data is not None:
            input_songs_data.append({
                'name': song_data['name'],
                'year': int(song_data['year']),
                'artists': song_data['artists'],
                'valence': float(song_data['valence']),
                'acousticness': float(song_data['acousticness']),
                'danceability': float(song_data['danceability']),
                'energy': float(song_data['energy']),
                'instrumentalness': float(song_data['instrumentalness']),
                'liveness': float(song_data['liveness']),
                'loudness': float(song_data['loudness']),
                'speechiness': float(song_data['speechiness']),
                'tempo': float(song_data['tempo'])
            })

    if song_center is None:
        # Si aucune chanson d'entrée n'est trouvée, retourner des recommandations aléatoires
        recommendations = spotify_data.sample(n=n_songs)
    else:
        # Normaliser les caractéristiques
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(spotify_data[number_cols])
        scaled_song_center = scaler.transform(song_center.reshape(1, -1))
        
        # Calculer les distances
        distances = cdist(scaled_data, scaled_song_center, 'cosine').reshape(-1)
        
        # Créer un masque pour exclure les chansons d'entrée
        song_names = [song['name'].lower() for song in song_list]
        song_years = [song['year'] for song in song_list]
        mask = ~((spotify_data['name'].str.lower().isin(song_names)) & 
                (spotify_data['year'].isin(song_years)))
        
        # Trier par similarité (1 - distance) et sélectionner les meilleures recommandations
        spotify_data['distances'] = distances
        recommendations = spotify_data[mask].nsmallest(n_songs, 'distances')
    
    # Formater les résultats
    results = []
    for _, song in recommendations.iterrows():
        results.append({
            'name': song['name'],
            'year': int(song['year']),
            'artists': song['artists'],
            'valence': float(song['valence']),
            'acousticness': float(song['acousticness']),
            'danceability': float(song['danceability']),
            'energy': float(song['energy']),
            'instrumentalness': float(song['instrumentalness']),
            'liveness': float(song['liveness']),
            'loudness': float(song['loudness']),
            'speechiness': float(song['speechiness']),
            'tempo': float(song['tempo'])
        })
    
    return results, input_songs_data

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route('/like', methods=['POST'])
def like():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

    track_id = request.json['track_id']
    if not track_id:
        return jsonify({'error': 'Missing track_id'}), 400

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
        return jsonify({'error': 'User not authenticated'}), 401

    track_id = request.json['track_id']
    if not track_id:
        return jsonify({'error': 'Missing track_id'}), 400

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
        return jsonify({'error': 'User not authenticated'}), 401

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
        return jsonify({'error': 'User not authenticated'}), 401

    playlist_id = request.args.get('playlist_id')
    if not playlist_id:
        return jsonify({'error': 'Missing playlist_id'}), 400

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
        return jsonify({'error': 'User not authenticated'}), 401

    playlist_id = request.args.get('playlist_id')
    if not playlist_id:
        return jsonify({'error': 'Missing playlist_id'}), 400

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
        return jsonify({'error': 'User not authenticated'}), 401

    try:
        target_popularity = int(request.args.get('target_popularity', 50))
        limit = int(request.args.get('limit', 10))  # Récupérer le paramètre limit avec une valeur par défaut de 10
        min_popularity = max(0, target_popularity - 10)
        max_popularity = min(100, target_popularity + 10)

        # Récupérer le pays de l'utilisateur
        user_info = sp.current_user()
        market = user_info['country']

        # 1. Récupérer l'historique d'écoute récent et les top artistes
        recent_tracks = sp.current_user_recently_played(limit=50)
        top_artists_data = sp.current_user_top_artists(limit=20, time_range='medium_term')
        
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
        top_artists = sorted(artist_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:8]
        top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        
        # Collecter des pistes similaires
        similar_tracks = []
        
        # À partir des top artistes de l'utilisateur
        for artist in top_artists_data['items']:
            try:
                top_tracks = sp.artist_top_tracks(artist['id'], country=market)['tracks']
                for track in top_tracks[:5]:  # Réduit de 10 à 5 pour avoir plus de variété
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Top artiste: {artist['name']}"
                        })
            except Exception as e:
                print(f"Erreur lors de la récupération des tracks pour {artist['name']}: {e}")
                continue

        # À partir des genres et artistes
        seed_artists = [artist_id for artist_id, _ in top_artists[:4]]
        seed_genres = [genre for genre, _ in top_genres[:5]]
        
        try:
            # Faire plusieurs appels avec différents paramètres pour plus de variété
            for i in range(2):  # Faire 2 appels différents
                recommendations_results = sp.recommendations(
                    seed_artists=seed_artists[i:i+2],  # Utiliser différents artistes à chaque fois
                    seed_genres=seed_genres[i:i+3],    # Utiliser différents genres à chaque fois
                    limit=20,  # Réduit de 30 à 20
                    market=market,
                    min_popularity=min_popularity,
                    max_popularity=max_popularity
                )
                
                for track in recommendations_results['tracks']:
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Recommendation basée sur vos goûts"
                        })
        except Exception as e:
            print(f"Erreur lors de la récupération des recommendations: {e}")

        # Rechercher des tracks similaires aux dernières écoutes
        for recent_track in recent_tracks_formatted[:5]:  # Réduit de 10 à 5
            try:
                seed_track = recent_track['id']
                results = sp.recommendations(
                    seed_tracks=[seed_track],
                    limit=5,  # Réduit de 10 à 5
                    market=market,
                    min_popularity=min_popularity
                )
                for track in results['tracks']:
                    if track['id'] not in recent_track_ids:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Similaire à: {recent_track['name']}"
                        })
            except Exception as e:
                print(f"Erreur lors de la recherche de similaires pour {recent_track['name']}: {e}")
                continue

        # Mélanger et sélectionner le nombre de recommandations demandé
        random.shuffle(similar_tracks)
        recommendations = similar_tracks[:limit]  # Utiliser le paramètre limit au lieu de 80

        # Formater la réponse
        formatted_response = {
            'tracks': [item['track'] for item in recommendations],
            'based_on': {
                'recent_tracks': recent_tracks_formatted[:10],
                'top_artists': [{'name': info['name'], 'count': info['count']} for _, info in top_artists],
                'top_genres': [{'name': genre, 'count': count} for genre, count in top_genres]
            }
        }

        print(f"Recommendations: {formatted_response}")
        preview_count = sum(1 for item in recommendations if item['track']['preview_url'] is not None)
        print(f"Nombre de previews disponibles : {preview_count}/{len(recommendations)}")
        return jsonify(formatted_response)
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_playlist_suggestions', methods=['POST'])
def get_playlist_suggestions():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

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

@app.route('/search_artists', methods=['GET'])
def search_artists():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

    query = request.args.get('query')
    if not query or len(query.strip()) == 0:
        return jsonify({'error': 'Query empty'}), 400

    try:
        results = sp.search(q=query, type='artist', limit=10)
        artists = [{
            'id': artist['id'],
            'name': artist['name'],
            'image': artist['images'][0]['url'] if artist['images'] else None
        } for artist in results['artists']['items']]
        return jsonify({'artists': artists})
    except SpotifyException as e:
        if e.http_status == 429:  # Too Many Requests
            retry_after = e.headers.get('Retry-After', 30)
            return jsonify({
                'error': 'Rate limit exceeded',
                'retry_after': retry_after
            }), 429
        print(f"Error searching artists: {e}")
        return jsonify({'error': str(e)}), e.http_status

@app.route('/search_tracks', methods=['GET'])
def search_tracks():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

    query = request.args.get('query')
    if not query or len(query.strip()) == 0:
        return jsonify({'error': 'Query empty'}), 400

    try:
        results = sp.search(q=query, type='track', limit=10)
        tracks = [{
            'id': track['id'],
            'name': track['name'],
            'artists': [artist['name'] for artist in track['artists']],
            'album': track['album']['name'],
            'image': track['album']['images'][0]['url'] if track['album']['images'] else None
        } for track in results['tracks']['items']]
        return jsonify({'tracks': tracks})
    except Exception as e:
        print(f"Error searching tracks: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_genres', methods=['GET'])
def get_genres():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

    try:
        genres = [
            "acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal",
            "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british",
            "cantopop", "chicago-house", "children", "chill", "classical", "club",
            "comedy", "country", "dance", "dancehall", "death-metal", "deep-house",
            "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep",
            "edm", "electro", "electronic", "emo", "folk", "forro", "french",
            "funk", "garage", "german", "gospel", "goth", "grindcore", "groove",
            "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle",
            "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm",
            "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance",
            "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin",
            "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore",
            "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera",
            "pagode", "party", "philippines-opm", "piano", "pop", "pop-film",
            "post-dubstep", "power-pop", "progressive-house", "psych-rock",
            "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton",
            "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad",
            "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter",
            "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish",
            "study", "summer", "swedish", "synth-pop", "tango", "techno",
            "trance", "trip-hop", "turkish", "work-out", "world-music"
        ]
        return jsonify({'genres': sorted(genres)})  # Trier par ordre alphabétique
    except Exception as e:
        print(f"Error fetching genres: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/get_custom_recommendations', methods=['POST'])
def get_custom_recommendations():
    sp = get_spotify_client()
    if not sp:
        return jsonify({'error': 'User not authenticated'}), 401

    try:
        data = request.json
        target_popularity = int(data.get('target_popularity', 50))
        min_popularity = max(0, target_popularity - 10)
        max_popularity = min(100, target_popularity + 10)

        seed_artists = data.get('artists', [])[:5]
        seed_tracks = data.get('tracks', [])[:5]
        seed_genres = data.get('genres', [])[:3]
        # todo: fix not working when no artist selected
        
        # Vérifier qu'au moins un seed est fourni
        if not (seed_artists or seed_tracks or seed_genres):
            return jsonify({'error': 'At least one seed (artist, track, or genre) is required'}), 400

        # Récupérer le pays de l'utilisateur
        user_info = sp.current_user()
        market = user_info['country']

        similar_tracks = []
        
        # Obtenir des recommandations basées sur les artistes sélectionnés
        if seed_artists:
            try:
                for artist_id in seed_artists:
                    top_tracks = sp.artist_top_tracks(artist_id, country=market)['tracks']
                    for track in top_tracks[:10]:
                        similar_tracks.append({
                            'track': track,
                            'source': f"Top tracks de l'artiste sélectionné"
                        })
            except Exception as e:
                print(f"Erreur lors de la récupération des tracks pour les artistes: {e}")

        # Obtenir des recommandations basées sur les morceaux sélectionnés
        if seed_tracks:
            try:
                # Faire une seule requête avec tous les seed_tracks
                results = sp.recommendations(
                    seed_tracks=seed_tracks,
                    limit=min(10 * len(seed_tracks), 20),  # Limiter le nombre total
                    market=market,
                    min_popularity=min_popularity,
                    max_popularity=max_popularity
                )
                for track in results['tracks']:
                    similar_tracks.append({
                        'track': track,
                        'source': f"Similaire aux morceaux sélectionnés"
                    })
            except Exception as e:
                print(f"Erreur lors de la recherche de similaires pour les tracks: {e}")

        # Obtenir des recommandations basées sur les genres
        if seed_genres:
            try:
                # Utiliser tous les genres sélectionnés en une seule requête
                results = sp.recommendations(
                    seed_genres=seed_genres,
                    limit=min(10 * len(seed_genres), 20),  # Limiter le nombre total
                    market=market,
                    min_popularity=min_popularity,
                    max_popularity=max_popularity
                )
                for track in results['tracks']:
                    similar_tracks.append({
                        'track': track,
                        'source': f"Basé sur les genres sélectionnés"
                    })
            except Exception as e:
                print(f"Erreur lors de la recherche par genres: {e}")

        if not similar_tracks:
            return jsonify({'error': 'Could not generate recommendations with the given seeds'}), 400

        # Mélanger et formater la réponse
        random.shuffle(similar_tracks)
        formatted_response = {
            'tracks': [item['track'] for item in similar_tracks[:80]],  # Limiter à 80 pistes
            'based_on': {
                'selected_artists': seed_artists,
                'selected_tracks': seed_tracks,
                'selected_genres': seed_genres
            }
        }

        return jsonify(formatted_response)

    except Exception as e:
        print(f"Error generating custom recommendations: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/get_dataset_recommendations', methods=['POST'])
def get_dataset_recommendations():
    try:
        input_songs = request.json.get('songs', [])
        if not input_songs:
            return jsonify({'error': 'No input songs provided'}), 400

        recommendations, input_songs_data = recommend_songs(input_songs, data)
        return jsonify({
            'recommendations': recommendations,
            'based_on': {
                'input_songs': input_songs_data
            }
        })

    except Exception as e:
        print(f"Error generating dataset recommendations: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/search_dataset_tracks', methods=['GET'])
def search_dataset_tracks():
    query = request.args.get('query', '').lower()
    if not query or len(query.strip()) == 0:
        return jsonify({'error': 'Query empty'}), 400

    # Rechercher dans le dataset
    # Convertir la colonne artists de string à liste si ce n'est pas déjà fait
    if isinstance(data.iloc[0]['artists'], str):
        data['artists'] = data['artists'].apply(ast.literal_eval)

    # Filtrer les chansons qui correspondent à la recherche
    mask = data['name'].str.lower().str.contains(query) | \
           data['artists'].apply(lambda x: any(query in artist.lower() for artist in x))
    
    results = data[mask].head(10)  # Limiter à 10 résultats
    
    # Formater les résultats
    tracks = []
    for _, track in results.iterrows():
        tracks.append({
            'id': track['id'],  # Utiliser l'ID du dataset
            'name': track['name'],
            'artists': track['artists'],
            'year': int(track['year'])
        })
    
    return jsonify({'tracks': tracks})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
