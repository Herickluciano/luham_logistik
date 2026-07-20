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

/* import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; */

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
        <Route path="/ajouterProduit" element={<AjouterProduit />} />
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