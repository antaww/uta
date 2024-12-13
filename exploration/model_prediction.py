import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns

def prepare_data(data_path):
    """Charge et prépare les données pour la modélisation"""
    # Chargement des données
    data = pd.read_csv(data_path)
    
    # Sélection des features pertinentes
    features = [
        'danceability', 'energy', 'loudness', 'speechiness',
        'acousticness', 'instrumentalness', 'liveness', 'valence',
        'explicit', 'year', 'duration_ms', 'tempo'
    ]
    
    X = data[features]
    y = data['popularity']
    
    # Standardisation des features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=features)
    
    return X_scaled, y, features

def train_model(X, y):
    """Entraîne le modèle avec optimisation des hyperparamètres"""
    # Définition de la grille de paramètres
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [10, 20, 30, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    }
    
    # Initialisation du modèle
    rf_model = RandomForestRegressor(random_state=42)
    
    # GridSearch avec validation croisée
    grid_search = GridSearchCV(
        rf_model,
        param_grid,
        cv=5,
        scoring='r2',
        n_jobs=-1,
        verbose=1
    )
    
    # Entraînement
    grid_search.fit(X, y)
    
    return grid_search

def evaluate_model(model, X, y, features):
    """Évalue le modèle et affiche les résultats"""
    # Split des données
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Prédictions
    y_pred = model.predict(X_test)
    
    # Métriques d'évaluation
    print("\nMétriques d'évaluation:")
    print(f"R² Score: {r2_score(y_test, y_pred):.3f}")
    print(f"MSE: {mean_squared_error(y_test, y_pred):.3f}")
    print(f"RMSE: {mean_squared_error(y_test, y_pred, squared=False):.3f}")
    print(f"MAE: {mean_absolute_error(y_test, y_pred):.3f}")
    
    # Importance des features
    feature_importance = pd.DataFrame({
        'feature': features,
        'importance': model.best_estimator_.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nImportance des features:")
    print(feature_importance)
    
    # Visualisation de l'importance des features
    plt.figure(figsize=(10, 6))
    sns.barplot(x='importance', y='feature', data=feature_importance)
    plt.title('Importance des features dans la prédiction')
    plt.tight_layout()
    plt.show()
    
    return feature_importance

def main():
    # Chargement et préparation des données
    X, y, features = prepare_data('songs_normalize.csv')
    
    # Entraînement du modèle
    print("Entraînement du modèle...")
    model = train_model(X, y)
    
    # Affichage des meilleurs paramètres
    print("\nMeilleurs paramètres:", model.best_params_)
    print("Meilleur score R²:", model.best_score_)
    
    # Évaluation du modèle
    feature_importance = evaluate_model(model, X, y, features)
    
    return model, feature_importance

if __name__ == "__main__":
    model, feature_importance = main() 