// src/App.js
import React from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Home from './components/Home';
import {UserProvider} from './context/UserContext';
import './App.css';

function App() {
	return (
		<UserProvider>
			<Router>
				<Navbar/>
				<Routes>
					<Route path="/" element={<Login/>}/>
					<Route path="/home" element={<Home/>}/>
				</Routes>
			</Router>
		</UserProvider>
	);
}

export default App;
