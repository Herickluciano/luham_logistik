import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";

function Export({ data }) {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const companyId = localStorage.getItem("company_id");

  // ⚠️ REMPLACEZ STRICTEMENT CETTE URL PAR CELLE DE VOTRE WEB SERVICE RENDER (Ex: https://onrender.com)
  const API_URL = "https://onrender.com"; 

  // --- CONFIGURATION DÉCONNEXION AUTOMATIQUE (INACTIVITÉ) ---
  useEffect(() => {
    if (!token) return;

    const tempsInactivite = 10 * 60 * 1000; // 10 minutes
    let timer;

    const redirectionLogin = () => {
      console.log("Session expirée pour inactivité");
      localStorage.clear();
      navigate("/");
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(redirectionLogin, tempsInactivite);
    };

    const evenements = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    evenements.forEach(evt => {
      document.addEventListener(evt, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      evenements.forEach(evt => {
        document.removeEventListener(evt, resetTimer);
      });
    };
  }, [navigate, token]);

  // --- STATE DU FORMULAIRE ---
  const [formData, setFormData] = useState({
    expediteur_nom: "",
    expediteur_adresse: "",
    expediteur_email: "",
    expediteur_contact: "",
    
    client_societe: "",
    destinataire_nom: "",
    destinataire_adresse: "",
    destinataire_email: "",
    destinataire_telephone: "",
    
    nombre_total: "",
    code_ref: "",
    poids_coli: "",
    nature_emballage: "",
    nom_emballage: "",
    numero_serie: "",
    detail_coli: "",
    
    date_livraison: "",
    
    produits: [{ nom: "", taille: "", quantite: "", hauteur: "", largeur: "", volume: "" }]
  });

  const [catalogueProduits, setCatalogueProduits] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Sécurité d'accès
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 1. Appel API en ligne pour charger le catalogue
  useEffect(() => {
    if (companyId) {
      axios.get(`${API_URL}/produits?company_id=${companyId}`)
        .then(res => {
          setCatalogueProduits(Array.isArray(res.data) ? res.data : []);
        })
        .catch(err => {
          console.error("Erreur critique chargement catalogue distant:", err);
        });
    }
  }, [companyId]);

  // 2. Hydratation automatique depuis les propriétés globales
  useEffect(() => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        client_societe: data.destinataire_nom || "",
        destinataire_nom: data.destinataire_nom || "",
        destinataire_adresse: data.destinataire_adresse || "",
        nombre_total: data.nombre_box || "",
        code_ref: data.code_ref || "",
        date_livraison: data.date_livraison || "",
        produits: [
          { 
            nom: data.produit_nom || "", 
            taille: "Standard", 
            quantite: data.nombre_box || "",
            hauteur: "Standard",
            largeur: "Standard", 
            volume: "Standard"
          }
        ]
      }));
    }
  }, [data]);

  // 3. Génération dynamique sécurisée de l'aperçu PDF
  useEffect(() => {
    try {
      const doc = new jsPDF();
      
      // En-tête de page (Gauche)
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Société  ${companyName}`, 14, 10);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("partenaire du groupe Luham Logistik S.R.L", 14, 15);
      doc.text("Société anonyme au capital de 100.000 £", 14, 19);
      doc.text("Siege social Via Alessandro, 7, 20121 milano , Italie", 14, 23);
      doc.text("luhamlogistik@gmail.com | 00393278036337", 14, 26);
      doc.text("://luhamcode.com", 14, 29);

      // En-tête de page (Droite)
      doc.text(" La livraison sécurisée de vos marchandises", 194, 9, { align: "right" });
      doc.text("une planification de chaque étape de la chaîne", 194, 14, { align: "right" });
      doc.text("traçabilité rigoureuse", 196, 19, { align: "right" });

      // Structure Document
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("FEUILLE DE DECLARATION D'EXPEDITION", 100, 35, { align: "center" });
      doc.text("N° :__ __ __ __ __", 90, 43, { align: "center" });
      
      // Bloc Expéditeur
      const startY_Sections = 53;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("1. EXPÉDITEUR", 14, startY_Sections);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Société Livreur : ${companyName}`, 14, startY_Sections + 14);
      doc.text(`Societe client : ${formData.expediteur_nom || "-"}`, 14, startY_Sections + 7);
      
      const addrExp = doc.splitTextToSize(`Adresse : ${formData.expediteur_adresse || "-"}`, 85);
      doc.text(addrExp, 14, startY_Sections + 21);
      
      const nextY_Exp = startY_Sections + 21 + (addrExp.length * 6);
      doc.text(`Mail : ${formData.expediteur_email || "-"}`, 14, nextY_Exp);
      doc.text(`Contact : ${formData.expediteur_contact || "-"}`, 14, nextY_Exp + 7);

      // Bloc Destinataire
      const colDroiteX = 110;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("2. DESTINATAIRE", colDroiteX, startY_Sections);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`Client : ${formData.destinataire_nom || "-"}`, colDroiteX, startY_Sections + 7);
      
      const addrDest = doc.splitTextToSize(`Adresse : ${formData.destinataire_adresse || "-"}`, 85);
      doc.text(addrDest, colDroiteX, startY_Sections + 14);
      
      const nextY_Dest = startY_Sections + 14 + (addrDest.length * 6);
      doc.text(`Mail : ${formData.destinataire_email || "-"}`, colDroiteX, nextY_Dest);
      doc.text(`Tél : ${formData.destinataire_telephone || "-"}`, colDroiteX, nextY_Dest + 7);

      const separationY = Math.max(nextY_Exp + 10, nextY_Dest + 10);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, separationY, 196, separationY);

      // Caractéristiques colis
      const startY_Colis = separationY + 8;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("3. SPECIFICATIONS DU COLIS", 14, startY_Colis);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      doc.text(`Nbr de colis : ${formData.nombre_total || "-"}`, 14, startY_Colis + 8);
      doc.text(`Réf Commande : ${formData.code_ref || "-"}`, 70, startY_Colis + 8);
      doc.text(`Poids global : ${formData.poids_coli || "-"} kg`, 140, startY_Colis + 8);
      
      doc.text(`Nature emballage : ${formData.nature_emballage || "-"}`, 14, startY_Colis + 16);
      doc.text(`Nom emballage : ${formData.nom_emballage || "-"}`, 70, startY_Colis + 16);
      doc.text(`N° Série : ${formData.numero_serie || "-"}`, 140, startY_Colis + 16);
      doc.text(`Date livraison : ${formData.date_livraison || "-"}`, 14, startY_Colis + 24);

      // Transformation des données pour jspdf-autotable
      const tableRows = formData.produits.map(p => [
        p.nom || "-",
        p.taille || "-",
        p.quantite || "-",
        p.hauteur || "-",
        p.largeur || "-",
        p.volume || "-"
      ]);

      // CORRIGÉ : Nettoyage de l'objet vide headStyles qui provoquait une coupure d'exécution
      autoTable(doc, {
        startY: startY_Colis + 32,
        head: [['Nom du Produit', 'Taille', 'Quantité', 'Hauteur', 'Largeur', 'Volume']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] } 
      });

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      return () => URL.revokeObjectURL(url);
    } catch (pdfError) {
      console.error("Échec du rendu du PDF à la saisie :", pdfError);
    }
  }, [formData, companyName]);

  const telechargerPDF = () => {
    const doc = new jsPDF();
    doc.text(`Déclaration d'expédition - ${formData.code_ref || 'Document'}`, 14, 20);
    doc.save(`declaration_${formData.code_ref || 'export'}.pdf`);
  };
  return (
    <div className="mt-10 p-8  rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="luham">
        <h1>Espace collaborateur :{" "}
          <span style={{ color: "red" }}>{companyName}</span>
        </h1>
      </div>
       <div className="para_1_export">
        {/* <p className="display">
          Protéger vos données et valoriser votre image,
          <strong className="luham"> Luham Logistik S.R.L</strong> 
          Nous sommes l’expertise double.
        </p> */}
        
        <h3 className="compt">Tableau d'import / export</h3>
      </div>
      {/* Inputs Section 1 : Expéditeur */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider text-1">1. Informations Expéditeur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nom de l'expéditeur"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.expediteur_nom}
              onChange={(e) => setFormData({ ...formData, expediteur_nom: e.target.value })}
            />
            <input
              type="email"
              placeholder="Adresse Mail"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.expediteur_email}
              onChange={(e) => setFormData({ ...formData, expediteur_email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Numéro de Contact"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500 md:col-span-2"
              value={formData.expediteur_contact}
              onChange={(e) => setFormData({ ...formData, expediteur_contact: e.target.value })}
            /><br/>
            <textarea
              placeholder="Adresse complète d'expédition"
              rows="2"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500 md:col-span-2"
              value={formData.expediteur_adresse}
              onChange={(e) => setFormData({ ...formData, expediteur_adresse: e.target.value })}
            />
          </div>
        </div>

{/* Inputs Section 2 : Destinataire */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">2. Informations Destinataire</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Société Client"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.client_societe}
              onChange={(e) => setFormData({ ...formData, client_societe: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nom du Destinataire"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.destinataire_nom}
              onChange={(e) => setFormData({ ...formData, destinataire_nom: e.target.value })}
            />
            <input
              type="email"
              placeholder="Mail Destinataire"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.destinataire_email}
              onChange={(e) => setFormData({ ...formData, destinataire_email: e.target.value })}
            />
            <input
            type="tel"
            placeholder="Téléphone"
            className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
            value={formData.destinataire_telephone}
            onChange={(e) => setFormData({ ...formData, destinataire_telephone: e.target.value })}
          /><br/>
          <textarea
            placeholder="Adresse complète de livraison"
            rows="2"
            className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500 md:col-span-2"
            value={formData.destinataire_adresse}
            onChange={(e) => setFormData({ ...formData, destinataire_adresse: e.target.value })}
          />
        </div>
      </div>

      {/* Inputs Section 3 : Spécifications Colis */}
      <div className="space-y-3">
      <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider text-1">3. Spécifications Générales du Colis</h3>
      <input type="number"
      placeholder="Nombre de colis"
      className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
      value={formData.nombre_total}
      onChange={(e) => setFormData({ ...formData, nombre_total: e.target.value })}
      />

      <input type="text"
      placeholder="Code Réf Commande"
      className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
      value={formData.code_ref}onChange={(e) => setFormData({ ...formData, code_ref: e.target.value })}
      />

      <input type="number"
      placeholder="Poids global (kg)"
      className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
      value={formData.poids_coli}onChange={(e) => setFormData({ ...formData, poids_coli: e.target.value })}
      /><br/>

      <textarea
        placeholder="Détails sur le colis (instructions, fragilité...)"
        rows="2"
        className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500 md:col-span-3"
        value={formData.detail_coli}
        onChange={(e) => setFormData({ ...formData, detail_coli: e.target.value })}
      />
      </div>
      {/* Formulaire de saisie (Colonne Gauche) */}
     <div className="space-y-3">
        <h2 className="text-2xl font-black mb-6 text-slate-800">
         <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Documentde préparation de commande</h3>
        </h2>
         
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input
            type="text"
            placeholder="Société Client"
            className="p-3 bg-gray-50 border rounded-xl"
            value={formData.client_societe}
            onChange={(e) => setFormData({ ...formData, client_societe: e.target.value })}
          />
          <input
            type="text"
            placeholder="Nom Destinataire"
            className="p-3 bg-gray-50 border rounded-xl"
            value={formData.destinataire_nom}
            onChange={(e) => setFormData({ ...formData, destinataire_nom: e.target.value })}
          />
          <input
            type="text"
            placeholder="Adresse"
            className="p-3 bg-gray-50 border rounded-xl md:col-span-2"
            value={formData.destinataire_adresse}
            onChange={(e) => setFormData({ ...formData, destinataire_adresse: e.target.value })}
          />
        </div>

        <h3 className="text-lg font-bold mb-4">Articles à préparer</h3>
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
          {formData.produits.map((produit, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-6">
                <select 
                  className="w-full p-3 border rounded-xl bg-white"
                  value={produit.nom}
                  onChange={(e) => handleProduitChange(index, "nom", e.target.value)}
                >
                  <option value="">-- Sélectionner le produit à expedier --</option>
                  {catalogueProduits.map(p => (
                    <option key={p.id} value={p.nom}>{p.nom} (GTIN: {p.gtin})</option>
                  ))}
                  {produit.nom && <option value={produit.nom}>Garder: {produit.nom}</option>}
                </select>
              </div>
              <div className="space-y-3">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Information produt</h3>
              <form className="from-pfd">
              <div className="col-span-3">
                <input
                  type="text"
                  placeholder="code / ref du produit"
                  className="code w-full p-3 border rounded-xl"
                  value={produit.taille}
                  onChange={(e) => handleProduitChange(index, "taille", e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Qté"
                  className="qte w-full p-3 border rounded-xl"
                  value={produit.quantite}
                  onChange={(e) => handleProduitChange(index, "quantite", e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Hauteur du colis"
                  className="hauteur w-full p-3 border rounded-xl"
                  value={produit.hauteur}
                  onChange={(e) => handleProduitChange(index, "hauteur", e.target.value)}
                />
              </div>
              </form>
              </div>
              <form className="from-pfd">
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Largeur du colis"
                  className="large w-full p-3 border rounded-xl"
                  value={produit.largeur}
                  onChange={(e) => handleProduitChange(index, "largeur", e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Volume du colis"
                  className="volume w-full p-3 border rounded-xl"
                  value={produit.volume}
                  onChange={(e) => handleProduitChange(index, "volume", e.target.value)}
                />
              </div>
            
              </form>
              <form className="from-pfd">
                  <div className="col-span-3">
               <input
              type="text"
              placeholder="Nature d'emballage"
              className="nature p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.nature_emballage}
              onChange={(e) => setFormData({ ...formData, nature_emballage: e.target.value })}
            />
             </div>
              <div className="col-span-3">
               <input
              type="text"
              placeholder="Nom de l'emballage"
              className="embalage p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.nom_emballage}
              onChange={(e) => setFormData({ ...formData, nom_emballage: e.target.value })}
            />
             </div>
             <div className="col-span-3">
               <input
              type="text"
              placeholder="Numéro de série"
              className="numero p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.numero_serie}
              onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
            />
             </div>
              </form>
                <div className="space-y-3">
               
                {/* Inputs Section 4 : Validation (Nouveau) */}
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">4.Date de livraison prévue</h3>
              <input type="date"
              className="date p-3 w-full bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.date_livraison}
              onChange={(e) => setFormData({ ...formData, date_livraison: e.target.value })}/>
              </div>
             
            </div>
          ))}
          
        </div>
        
       
      </div>

      {/* Fenêtre de Prévisualisation (Colonne Droite) */}
      <div className="flex flex-col h-[500px] lg:h-auto border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
        <div className="flex-1 bg-white ">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="Aperçu du PDF"
              className="w-full h-full border-none pdf "
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Génération de l'aperçu...
            </div>
          )}
        </div>
         <div className="lesbtn flex gap-4">
          <button onClick={ajouterProduit} className="btn btn-success flex-1 border rounded py-4 rounded-xl font-bold hover:bg-slate-200 transition">
            + Ajouter un autre article
          </button>
          {/* <button  onClick={downloadPDF} className="btn btn-success border rounded text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
            📥 Télécharger le document apres remplissage
          </button> */}
           <button 
            type="button"
            onClick={() => navigate("/home")}
            className="btn btn-success border rounded text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition" >
            Retour l'accueil
          </button>
          <button 
            type="button"
            onClick={() => navigate("/document")}
            className="btn btn-success border rounded text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition" >
            Saisi texte
          </button>
        </div>
      </div>

    </div>
  );
}

export default Export;
