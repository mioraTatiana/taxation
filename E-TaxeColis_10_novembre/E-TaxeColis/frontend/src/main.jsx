import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// Active l'envoi du jeton de connexion dans toutes les requêtes axios
import "./Simple composants/Outils/api"
import "./Simple composants/Couleurs/Theme.css"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
