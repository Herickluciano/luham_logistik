import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

// CORRIGÉ : Forçage de l'URL absolue pour éliminer définitivement l'erreur 404 / onrender.com
const API_URL = "https://onrender.com";

function Colis() {
  const navigate = useNavigate();
  const componentRef = useRef();
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    produitId: "",
    produit_nom: "", 
    dest_nom: "",
    dest_adresse: "",
    dest_gln: "",
    dest_gtin: "",
    nombreBox: "",
    codice : ""
  });

  const [colisCree, setColisCree] = useState(null);

  // ======================
  // GESTION INACTIVITÉ (5 MIN) ET AUTH
  // ======================
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const tempsInactivite = 5 * 60 * 1000;
    let timer;

    const redirectionLogin = () => {
      localStorage.clear();
      navigate("/");
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(redirectionLogin, tempsInactivite);
    };

    const evenements = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    evenements.forEach(evt => document.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timer);
      evenements.forEach(evt => document.removeEventListener(evt, resetTimer));
    };
  }, [navigate, token]);

  // ======================
  // RÉCUPÉRATION AUTOMATIQUE DU PRODUIT
  // ======================
  useEffect(() => {
    const chargerProduit = async () => {
      if (!formData.produitId) return;

      try {
        const res = await axios.get(`${API_URL}/produits/${formData.produitId}`);

        setFormData((prev) => ({
          ...prev,
          dest_gtin: res.data.gtin || "",
          produit_nom: res.data.nom || "Produit inconnu"
        }));

      } catch (error) {
        console.error(error);
        console.log("Produit non trouvé");

        setFormData((prev) => ({
          ...prev,
          produit_nom: "",
          dest_gtin: ""
        }));
      }
    };

    chargerProduit();
  }, [formData.produitId]);

  // ======================
  // IMPRESSION & ENVOI
  // ======================
  const handlePrint = useReactToPrint({
    content: () => componentRef.current
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      produit_id: formData.produitId,
      produit_nom: formData.produit_nom,
      destinataire_nom: formData.dest_nom,
      destinataire_adresse: formData.dest_adresse,
      destinataire_gln: formData.dest_gln,
      destinataire_gtin: formData.dest_gtin,
      nombre_box: formData.nombreBox,
      codice: formData.codice
    };

    try {
      const res = await axios.post(`${API_URL}/colis`, dataToSend);
      setColisCree({ id: res.data.id, ...dataToSend });
      alert("Colis enregistré !");
    } catch (error) {
      alert("Erreur lors de l'envoi.");
    }
  };

  const handleDownloadImage = async () => {
    if (!componentRef.current) return;
    
    try {
      const canvas = await html2canvas(componentRef.current, {
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff", 
        scale: 2 
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `etiquette-${colisCree?.id || 'colis'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors de la génération de l\'image', err);
    }
  };
  return (
    <div className="page p-10 bg-slate-100 min-h-screen flex flex-col lg:flex-row gap-10 notranslate">
      
      {/* FORMULAIRE */}
      <div className=" w-full lg:w-1/3 no-print">
        <div className="col">
          <div className="luham">
            <h1>
              <span>Espace collaborateur : </span>
              <span style={{ color: "red" }}>{companyName}</span>
            </h1>
          </div>
          
          <div className="para_1">
            <p className="display">
              <span>Protéger vos données et valoriser votre image</span><br/> 
              <strong className="luham">Luham Logistik S.R.L</strong><br/> 
              <span>Nous sommes l’expertise double.</span>
            </p>
            <h3 className="compte-login">Espace d'afficharge de l' étiquette</h3>
          </div>
        </div>
        
        <div className="colis-1 cmd-6 p-8 rounded-b-2xl shadow-xl space-y-4 ">
          <form onSubmit={handleSubmit} className="form-colis">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="ID Produit"
                className="w-2/3 p-3 border rounded-xl"
                value={formData.produitId}
                onChange={(e) => setFormData({ ...formData, produitId: e.target.value })}
                required
              />
              <input
                placeholder="Box"
                className="w-1/3 p-3 border rounded-xl"
                value={formData.nombreBox}
                onChange={(e) => setFormData({ ...formData, nombreBox: e.target.value })}
                required
              />
               <input
                placeholder="Codice Ref : IT0000"
                className="w-1/3 p-3 border rounded-xl"
                value={formData.codice}
                onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                required
              />
            </div>
            
            {formData.produit_nom ? (
              <div className="detecte p-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
                <span>Produit détecté : </span><b>{formData.produit_nom}</b>
              </div>
            ) : null}

            <input type="text" placeholder="Nom destinataire" className="w-full p-3 border rounded-xl mt-2" value={formData.dest_nom} onChange={(e) => setFormData({ ...formData, dest_nom: e.target.value })} required />
            <textarea placeholder="Adresse & contact" className="text-col w-full p-3 border rounded-xl mt-2" value={formData.dest_adresse} onChange={(e) => setFormData({ ...formData, dest_adresse: e.target.value })} required />
            <input type="text" placeholder="GTIN" className="w-full p-3 border rounded-xl mt-2" value={formData.dest_gtin} onChange={(e) => setFormData({ ...formData, dest_gtin: e.target.value })} />
            
            <button type="submit" className="btn btn-success border rounded bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Générer l'étiquette</button>
          </form>
        </div>
      </div>
{/* APERCU ETIQUETTE */}
      <div className="flex-1 flex justify-center items-start">
        {colisCree ? (
          <div className="etik-col flex flex-col items-center">
            
            {/* L'ÉTITIQUETTE À IMPRIMER / TÉLÉCHARGER */}
            <div 
              ref={componentRef} 
              className="forme bg-white  border-1 border-slate-200 rounded-2xl p-6 shadow-sm w-[400px]" 
              translate="no"
            >
              <div className="w-full border-b border-slate-200 pb-2 mb-4 flex justify-between items-center">
                <h1 className="titre-colis text-success text-sm font-bold uppercase text-slate-600">
                  <span>Expediteur : </span>
                  <span>Société {companyName}</span>
                </h1>
              </div>
              
              <div className="dest w-full grid grid-cols-2 gap-4">
                <div>
                  <p className="text-dest uppercase font-bold text-gray-500 text-xs">Client (Destination)</p>
                  <div className="detaille">
                    <p className="detail font-bold text-lg text-slate-800">{colisCree.destinataire_nom}</p>
                    <p className="detail text-sm text-slate-600">{colisCree.destinataire_adresse}</p>
                  </div>
                </div>
                
                <div className="info-colis text-right">
                  <p className="info-colis-1 text-[10px] uppercase font-bold text-gray-500">Infos Colis</p>
                  <p className="text-sm italic text-slate-600">
                    <span>Produit : </span>
                    <b className="text-blue-700">{colisCree.produit_nom}</b>
                  </p>
                  <p className="info-colis-2 text-sm font-bold mt-1 text-slate-800">
                    <span>Nbr de Produits : </span>
                    <span>{colisCree.nombre_box}</span>
                  </p>
                  <p className="info-colis-3 text-sm font-bold mt-1 text-slate-800">
                    <span>Codice Ref : </span>
                    <span>{colisCree.codice}</span>
                  </p>
                </div>
              </div>

              {/* ZONE DU CODE-BARRES ISOLE */}
              <div className="info-colis-5 mt-8 flex flex-col items-center w-full">
                <Barcode value={String(colisCree.destinataire_gtin || "0")} height={50} width={1.5} fontSize={12} />
                <div className="my-4 border-t border-dashed border-gray-300 w-full"></div>
                <p className="coli-numero text-[10px] font-bold uppercase mb-1 text-slate-500">Numéro de colis (SSCC)</p>
                <Barcode value={`00${String(colisCree.id || 0).padStart(16, "0")}`} height={30} width={2} fontSize={10} />
              </div>
            </div>

            {/* ACTION BUTTONS (Masqués à l'impression) */}
            <div className="zone-btn btn-groupe mt-4 flex gap-4 no-print">
              <button 
                onClick={handlePrint} 
                className="btn btn-success border rounded bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Imprimer l'étiquette
              </button>
              <button 
                onClick={handleDownloadImage} 
                className="btn btn-success border rounded bg-green-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Télécharger l'étiquette
              </button>

       <button 
            type="button"
            onClick={() => navigate("/produits")}
            className="btn btn-success border rounded bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors" >
            Retour a liste des produits
          </button>
    </div>
          </div>
          
        ) : (
          <div className="text-inf border-4 border-dashed border-slate-300 p-20 rounded-2xl flex flex-col items-center italic">
            {/* <h3 className="titre-col">Saisissez un ID produit et les infos destinataire </h3><br/> */}
             <button 
            type="button"
            onClick={() => navigate("/produits")}
            className="retour btn btn-success border rounded bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors" >
            Retour a liste des produits
          </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default Colis;
