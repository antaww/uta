# Uta
## Setup
### Install Python
```bash
pip install -r requirements.txt
```

### Install Node.js
```bash
cd frontend
npm install
```

### Run the server
```bash
cd backend
python app.py
```

### Run the frontend
```bash
cd frontend
npm start
```

(in case of 3000 port is already in use) : 
```bash
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```