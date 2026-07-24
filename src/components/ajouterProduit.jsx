import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // CORRIGÉ : Retrait de l'import invalide 'data'

// CORRIGÉ : Utilisation de votre vraie adresse de production Render
const API_URL = "https://votre-nom-d-app.onrender.com"; 

function AjouterProduit() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const storedCompanyId = localStorage.getItem("company_id") || "";

  const [formData, setFormData] = useState({
    nom: "",
    gtin: "",
    description: "",
    poids_net: "",
    dimensions: "",
    created_at: "",
    gtin_groupage: "",
    palettisation: "",
    company_id: storedCompanyId
  });

  // ======================
  // GESTION INACTIVITÉ (10 MIN)
  // ======================
  useEffect(() => {
    if (!token) return;

    const tempsInactivite = 10 * 60 * 1000;
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

  // CALCUL CLÉ GTIN-13
  const calculerGTIN13 = (code12) => {
    if (!/^\d{12}$/.test(code12)) return code12;
    let somme = 0;
    for (let i = 0; i < 12; i++) {
      const chiffre = parseInt(code12[i]);
      somme += i % 2 === 0 ? chiffre : chiffre * 3;
    }
    const reste = somme % 10;
    const cle = reste === 0 ? 0 : 10 - reste;
    return code12 + cle;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "gtin") {
      const chiffres = value.replace(/\D/g, "");
      let nouveauGTIN = chiffres;
      if (chiffres.length === 12) {
        nouveauGTIN = calculerGTIN13(chiffres);
      }
      setFormData({ ...formData, gtin: nouveauGTIN });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert("Company ID manquant");
      return;
    }
    try {
      await axios.post(`${API_URL}/produits`, {
        ...formData,
        company_id: Number(formData.company_id)
      });
      alert("Produit ajouté avec succès !");
      setFormData({ ...formData, nom: "", gtin: "", description: "", poids_net: "", dimensions: "", gtin_groupage: "", created_at: "", palettisation: "" });
    } catch (err) {
      alert("Erreur lors de l'ajout du produit");
    }
  };

  return (
    <div className="p-10">
      <div className="luham">
        <h1>Espace collaborateur :{" "}
          <span style={{ color: "red" }}>{companyName}</span>
        </h1>
      </div>
      
      <div className="para_1">
        <p className="display">
          Protéger vos données et valoriser votre image<br/> 
          <strong className="luham">Luham Logistik S.R.L</strong><br/> 
          Nous sommes l’expertise double.
        </p>
        <h2 className="compte-ajout">Entrez vos produits</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="container-ajout">
          <input
            name="nom"
            placeholder="Désignation du produit"
            onChange={handleChange}
            value={formData.nom}
            required
          />

          <input
            name="created_at"
            placeholder="date de creation"
            onChange={handleChange}
            required
          />

          <input
            name="company_id"
            placeholder="Company ID"
            onChange={handleChange}
            value={formData.company_id}
            required
          />

          <input
            name="gtin"
            placeholder="Code de Ref (12 chiffres = auto)"
            onChange={handleChange}
            value={formData.gtin}
            required
          />

          <input
            name="gtin_groupage"
            placeholder="Numéro de Groupage"
            onChange={handleChange}
            value={formData.gtin_groupage}
          />

          <input
            name="poids_net"
            placeholder="Poids net du produit"
            onChange={handleChange}
            value={formData.poids_net}
            required
          />

          <input
            name="dimensions"
            placeholder="Dimensions du produit: 00*00*00"
            onChange={handleChange}
            value={formData.dimensions}
            required
          />

          <textarea
            name="description"
            placeholder="Description du produit"
            onChange={handleChange}
            value={formData.description}
            required
            className="w-full p-2 border rounded mt-2"
          />
          <br/>
          <button type="submit" className="submit-ajout">
            ENREGISTRER
          </button>
          <button 
            type="button"
            onClick={() => navigate("/home")}
            className="submit-reg "
          >
            Retour à l'accueil
          </button>
        </div>
      </form>

      <div className="bas-ajout">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation digitale qui rapproche le monde.”</span>
        <a className="btn-success resp-1" href="https://nesteline.alwaysdata.net/contact/" role="button">Contactez-nous</a>
        <div>
          <p className="droit">
            &copy; 2026 . Tous droits réservés à <a href="http://luhamcode.com">www.luhamcode.com</a> 
            <span className="className">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank" rel="noreferrer">Luciano Hamilton Bleguy</a></span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AjouterProduit;
