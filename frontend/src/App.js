// src/App.js
import React from 'react';
import {BrowserRouter as Router, Route, Routes, Navigate, useLocation} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Home from './components/Home';
import DatasetRecommendations from './components/DatasetRecommendations';
import HistoryRecommendations from './components/HistoryRecommendations';
import CustomRecommendations from './components/CustomRecommendations';
import Playlists from './components/Playlists';
import {UserProvider, UserContext} from './context/UserContext';
import './App.css';

// Composant pour protéger les routes qui nécessitent une authentification
const PrivateRoute = ({ children }) => {
	const { user } = React.useContext(UserContext);
	const location = useLocation();

	if (!user) {
		// Rediriger vers la page de login en sauvegardant la page demandée
		return <Navigate to="/login" state={{ from: location.pathname }} replace />;
	}

	return children;
};

function App() {
	return (
		<UserProvider>
			<Router>
				<Navbar/>
				<Routes>
					<Route path="/" element={<Navigate to="/login" />} />
					<Route path="/login" element={<Login/>}/>
					<Route path="/home" element={
						<PrivateRoute>
							<Home/>
						</PrivateRoute>
					}/>
					<Route path="/dataset-recommendations" element={
						<PrivateRoute>
							<DatasetRecommendations/>
						</PrivateRoute>
					}/>
					<Route path="/history-recommendations" element={
						<PrivateRoute>
							<HistoryRecommendations/>
						</PrivateRoute>
					}/>
					<Route path="/custom-recommendations" element={
						<PrivateRoute>
							<CustomRecommendations standalone={true}/>
						</PrivateRoute>
					}/>
					<Route path="/playlists" element={
						<PrivateRoute>
							<Playlists/>
						</PrivateRoute>
					}/>
				</Routes>
			</Router>
		</UserProvider>
	);
}

export default App;
