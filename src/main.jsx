import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './components/home'
import Produits from './components/produits'
import AjouterProduit from './components/ajouterProduit' 
import Colis from './components/colis'
import Login from './components/login'
import Register from './components/register'
import Export from './components/export'
import Document from './components/document'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Accueil => login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* APP */}
        <Route path="/home" element={<Home />} />
        
        {/* Redirection des anciennes URL vers la route standard en minuscules */}
        <Route path="/ajouter-produit" element={<AjouterProduit />} />
        <Route path="/ajouterproduit" element={<Navigate to="/ajouter-produit" replace />} />
        
        <Route path="/colis" element={<Colis />} />
        <Route path="/produits" element={<Produits />} />
        <Route path="/export" element={<Export />} />
        <Route path="/document" element={<Document />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
