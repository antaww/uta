import os
from datetime import time

import pandas as pd
import spotipy
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_session import Session
from spotipy.oauth2 import SpotifyOAuth
import csv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Permet les cookies avec CORS
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'votre_clé_secrète')
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

# Création de l'objet Spotify pour les requêtes
sp = spotipy.Spotify(auth_manager=sp_oauth)

# Fonction pour récupérer l'ID d'un artiste
def get_artist_id(artists):
    try:
        results = sp.search(q=f"artist:{artists}", type="artist", limit=1)
        if results["artists"]["items"]:
            return results["artists"]["items"][0]["id"]
    except Exception as e:
        print(f"Erreur lors de la recherche de l'artiste {artists}: {e}")
    return None

# Fonction pour récupérer les albums d'un artiste
def get_artist_albums(artist_id):
    albums = []
    try:
        results = sp.artist_albums(artist_id, album_type="album,single", limit=50)
    except Exception as e:
        print(f"Erreur lors de la récupération des albums : {e}")
        while results:
            albums.extend(results["items"])
            if results["next"]:
                results = sp.next(results)
            else:
                break
    except Exception as e:
        print(f"Erreur lors de la récupération des albums : {e}")
    return albums

# Fonction pour récupérer les morceaux d'un album
def get_album_tracks(album_id):
    tracks = []
    try:
        results = sp.album_tracks(album_id)
        while results:
            tracks.extend(results["items"])
            if results["next"]:
                results = sp.next(results)
            else:
                break
    except Exception as e:
        print(f"Erreur lors de la récupération des morceaux : {e}")
    return tracks

# Lire les noms d’artistes depuis un CSV
input_csv = "dataset-spotify.csv"  # Remplacez par le chemin vers votre fichier CSV
output_csv = "consolidated_discography.csv"

df = pd.read_csv(input_csv)
artists = df['artists'].drop_duplicates().dropna()  # Suppression des doublons et valeurs manquantes


# Liste pour stocker les résultats
all_tracks = []

# Itérer sur chaque artiste
for artists in artists:
    print(f"Traitement de l'artiste : {artists}")
    artist_id = get_artist_id(artists)

    if not artist_id:
        print(f"Artiste introuvable : {artists}")
        continue

    # Récupérer les albums
    albums = get_artist_albums(artist_id)
    print(f"Nombre d'albums trouvés pour {artists} : {len(albums)}")
    if not albums:
        print(f"Aucun album trouvé pour : {artists}")
        continue

    # Récupérer les morceaux pour chaque album
    for album in albums:
        album_name = album["name"]
        album_id = album["id"]
        album_tracks = get_album_tracks(album_id)
        for track in album_tracks:
            all_tracks.append({
                "artists": artists,
                "album_name": album_name,
                "album_id": album_id,
                "track_name": track["name"],
                "track_id": track["id"],
                "track_duration_ms": track["duration_ms"],
                "explicit": track["explicit"],
                "track_number": track["track_number"],
                "release_date": album["release_date"],
                "external_url": track["external_urls"]["spotify"],
                "preview_url": track["preview_url"]
            })
        print(f"Morceaux récupérés pour l'album : {album_name}")
        print(f"Nombre total de morceaux : {len(all_tracks)}")
        print(f"Nom du dernier morceau : {all_tracks[-1]['track_name']}")





# Enregistrer les résultats consolidés dans un CSV
df_tracks = pd.DataFrame(all_tracks)
df_tracks.to_csv(output_csv, index=False, encoding="utf-8")
print(f"Discographie consolidée enregistrée dans {output_csv}")
