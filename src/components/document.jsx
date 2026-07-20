import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { data, useNavigate } from "react-router-dom";

function Document({ data }) {
  const token = localStorage.getItem("token");
     const navigate = useNavigate();
    const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
    const companyId = localStorage.getItem("company_id");
    const API_URL = "http://localhost:3000";
  
     useEffect(() => {
      // Si pas de token, on ne lance pas le minuteur
      if (!token) return;
  
      // 20 minutes en millisecondes (Astuce : mettez 10000 pour tester en 10 secondes)
      const tempsInactivite = 10 * 60 * 1000; 
      let timer;
  
      const redirectionLogin = () => {
        console.log("Session expirée pour inactivité");
        localStorage.clear(); // Supprime le token et le nom de l'entreprise
        navigate("/"); // Redirige vers la page de login
      };
  
      const resetTimer = () => {
        clearTimeout(timer);
        timer = setTimeout(redirectionLogin, tempsInactivite);
      };
  
      // Événements à surveiller
      const evenements = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      evenements.forEach(evt => {
        document.addEventListener(evt, resetTimer);
      });
  
      resetTimer(); // Lancement du premier compte à rebours
  
      // Nettoyage pour éviter les fuites de mémoire et les bugs de redirection
      return () => {
        clearTimeout(timer);
        evenements.forEach(evt => {
          document.removeEventListener(evt, resetTimer);
        });
      };
    }, [navigate, token]);
  
    // Protection de la route : si pas de token, redirection immédiate
    if (!token) {
      return <Navigate to="/" replace />;
    }
  

  // Structure complète incluant désormais la date de livraison
  const [formData, setFormData] = useState({
    // Partie 1 : Expéditeur
    expediteur_nom: "",
    expediteur_adresse: "",
    expediteur_email: "",
    expediteur_contact: "",
    
    // Partie 2 : Destinataire
    client_societe: "",
    destinataire_nom: "",
    destinataire_adresse: "",
    destinataire_email: "",
    destinataire_telephone: "",
    
    // Partie 3 : Informations générales du colis
    nombre_total: "",
    code_ref: "",
    poids_coli: "",
    nature_emballage: "",
    nom_emballage: "",
    numero_serie: "",
    detail_coli: "",
    
    // Partie 4 : Validation
    date_livraison: "",
    
    // Liste des produits
    produits: [{ nom: "", taille: "", quantite: "", hauteur: "", largeur: "", volume: "" }]
  });

  const [catalogueProduits, setCatalogueProduits] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);

  // 1. Charger les produits de l'entreprise au démarrage
  useEffect(() => {
    if (companyId) {
      axios.get(`${API_URL}/produits?company_id=${companyId}`)
        .then(res => {
          setCatalogueProduits(Array.isArray(res.data) ? res.data : []);
        })
        .catch(err => console.error("Erreur chargement catalogue:", err));
    }
  }, [companyId]);

  // 2. Remplissage auto quand un colis est créé (depuis les props)
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

  // 3. Génération automatique de l'aperçu PDF
  useEffect(() => {
    const doc = new jsPDF();
    
    // --- BLOC ENTREPRISE EN HAUT À GAUCHE (En vert) ---
    doc.setTextColor(34, 139, 34);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Société  ${companyName}`, 14, 10);
    

    doc.setTextColor(34, 139, 34);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(` ${formData.expediteur_nom || "-"}`, 13, 13);
    doc.text(`${formData.expediteur_email || "-"}`, 14, 16);
    doc.text(`${formData.expediteur_contact || "-"}`, 14, 19);
    doc.text(`${formData.expediteur_adresse || "-"}`, 14, 22);
    
    

    // --- TITRE DU DOCUMENT EN HAUT A DROITE ---
    doc.setTextColor(34, 139, 34);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Mr / Mme / Société : ${formData.destinataire_nom || "-"}`, 194, 9,{ align: "right" });
    doc.text(`Mail : ${formData.destinataire_email || "-"}`, 194, 14,{ align: "right" });
    doc.text(`Tél : ${formData.destinataire_telephone || "-"}`, 196, 19, { align: "right" });

    

    // --- OBJECT  DU DOCUMENT  ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Object : ${formData.code_ref || "-"}`, 100, 35, { align: "center" });
    
    // --- PARTIE 1 : EXPÉDITEUR (Colonne Gauche) ---
    const startY_Sections = 53;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    
    const addrExp = doc.splitTextToSize(`Adresse : ${formData.expediteur_adresse || "-"}`, 85);
    
    
    const nextY_Exp = startY_Sections + 21 + (addrExp.length * 6);
    

    // --- PARTIE 2 : DESTINATAIRE (Colonne Droite) ---
    const colDroiteX = 110;
    
   
    
    const addrDest = doc.splitTextToSize(`Adresse : ${formData.destinataire_adresse || "-"}`, 85);
    
    
    const nextY_Dest = startY_Sections + 14 + (addrDest.length * 6);
   

    // Ligne horizontale de séparation dynamique
    const separationY = Math.max(nextY_Exp + 10, nextY_Dest + 10);
    

       // --- OBJECT  DU DOCUMENT  ---
    const startY_Colis = separationY + 8;
    
    
    // Ligne 1 : Informations principales
    
    
    // Ligne 2 : Nouveaux éléments ajoutés (Nature, Nom emballage, N° de série)
    
    
    // Ligne 3 : Détails ou instructions sur le colis
    const detailsColis = doc.splitTextToSize(`${formData.detail_coli || "-"}`,  196, 19, { align: "center" });
    doc.text(detailsColis, 16, 44, { align: "left" });

    // Ajustement de la hauteur de départ du tableau des produits pour éviter les superpositions
   


    // --- TABLEAU DES PRODUITS (Vert Luham) ---
     const tableStartY = startY_Colis + 30 + (detailsColis.length * 5);
    autoTable(doc, {
      startY: tableStartY,
      
    });

    // --- PARTIE 4 : VALIDATION & SIGNATURES (Calcul automatique après le tableau) ---
    const startY_Signatures = doc.lastAutoTable.finalY + 12;
   
    // Grille sur 3 colonnes pour les blocs de signature
    const signatureY = startY_Signatures + 18;
    
    
    
    // Cadres en pointillés pour matérialiser les zones de signature
    

    // --- BAS DE PAGE ENTRE DEUX LIGNES VERTES ---
    const Y_basDePage = 285;
    doc.setDrawColor(34, 139, 34); 
    doc.setLineWidth(0.3);
    
    doc.line(14, Y_basDePage - 5, 196, Y_basDePage - 5);
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.setTextColor(34, 139, 234);
    doc.text(
      `${companyName}, ${formData.expediteur_nom || "-"} ${formData.expediteur_contact || "-"} ${formData.expediteur_email || "-"}`, 
      105, 
      Y_basDePage, 
      { align: "center" }
    );
    
    doc.line(14, Y_basDePage + 3, 196, Y_basDePage + 3);

    const blobUrl = doc.output("bloburl");
    setPdfUrl(blobUrl);

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [formData, companyName]);

  const ajouterProduit = () => {
    setFormData({
      ...formData,
      produits: [...formData.produits, { nom: "", taille: "", quantite: "", hauteur: "", largeur: "", volume: "" }]
    });
  };

  const handleProduitChange = (index, field, value) => {
    const nouveauxProduits = [...formData.produits];
    nouveauxProduits[index][field] = value;
    setFormData({ ...formData, produits: nouveauxProduits });
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `Prepa_${formData.code_ref || "Commande"}.pdf`;
      link.click();
    }
  };
  return (
    <div className="mt-10 p-8  rounded-2xl shadow-2xl border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="luham">
        <h1>Saisir Document :{" "}
          <span style={{ color: "red" }}>{companyName}</span>
        </h1>
      </div>
       
       <div className="para_1_export">
        {/* <p className="display">
          Protéger vos données et valoriser votre image,
          <strong className="luham"> Luham Logistik S.R.L</strong> 
          Nous sommes l’expertise double.
        </p> */}
      </div>
      {/* Inputs Section 1 : Expéditeur */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider text-2">1. Informations lié à votre société</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Adresse du siège social"
              className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
              value={formData.expediteur_nom}
              onChange={(e) => setFormData({ ...formData, expediteur_nom: e.target.value })}
            />
            <input
              type="text"
              placeholder="Société anonyme au capital de 100.000 £"
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
            />
            <input
            type="mail"
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
              placeholder="Nom du Destinataire:Mr/Mme/Societe"
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
          />
        </div>
      </div>

      {/* Inputs Section 3 : Spécifications Colis */}
      <div className="space-y-3">
      <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider text-2">3. Saisir  DU DOCUMENT</h3>
     

      <input type="text"
      placeholder="Object du document"
      className="p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500"
      value={formData.code_ref}onChange={(e) => setFormData({ ...formData, code_ref: e.target.value })}
      /> <br/>
      <textarea
        placeholder="Ecrivez ici le contenu du document"
        rows="2"
        className="doc p-3 bg-gray-50 border rounded-xl text-sm focus:outline-blue-500 md:col-span-3"
        value={formData.detail_coli}
        onChange={(e) => setFormData({ ...formData, detail_coli: e.target.value })}
      />
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
          <button  onClick={() => navigate("/export")} className="btn btn-success flex-1 border rounded py-4 rounded-xl font-bold hover:bg-slate-200 transition">
           Retour à l'export
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
        </div>
      </div>

    </div>
  );
}

export default Document;
