# Uta
## Setup
### Spotify Client
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Create a new app
3. Copy the `Client ID` and `Client Secret` to `backend/.env` file
4. Add `http://localhost:5000/callback` to the `Redirect URIs` in the app settings
5. .env must look like this:
```
SPOTIPY_CLIENT_ID=your_id
SPOTIPY_CLIENT_SECRET=your_secret
SPOTIPY_REDIRECT_URI=http://localhost:5000/callback
```


### Install Python
```bash
pip install -r requirements.txt
```

### Install Node.js
```bash
cd frontend; npm install
```


### Run the server
```bash
cd backend; python app.py
```


### Run the frontend
```bash
cd frontend; npm start
```

(in case of 3000 port is already in use) : 
```bash
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```