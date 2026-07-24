import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './App.css';

// CORRIGÉ : URL absolue écrite en dur pour éliminer définitivement les bugs CORS et onrender.com
const API_URL = "https://onrender.com";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  const navigate = useNavigate();

  // CORRIGÉ : La vérification du token se fait maintenant proprement dans un useEffect
  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur("");

    console.log("Tentative de connexion pour :", email);

    try {
      // CORRIGÉ : Utilisation de l'URL absolue stable
      const res = await axios.post(`${API_URL}/`, {
        email,
        password,
      });

      const token = res.data.token;

      if (!token) {
        setErreur("Aucun token reçu du serveur.");
        return;
      }

      const decoded = jwtDecode(token);
      console.log("TOKEN DÉCODÉ :", decoded);

      const companyId = decoded.company_id || res.data.company_id;
      const companyName = decoded.company_name || res.data.company_name;

      if (!companyId) {
        setErreur("Identifiant entreprise (company_id) manquant.");
        return;
      }

      // Sauvegarde de la session locale
      localStorage.setItem("token", token);
      localStorage.setItem("company_id", companyId);
      localStorage.setItem("company_name", companyName);

      // Vider le formulaire
      setEmail("");
      setPassword("");

      // Redirection vers le tableau de bord
      navigate("/home");

    } catch (err) {
      console.error("Erreur de connexion :", err);

      if (!err.response) {
        setErreur("Impossible de joindre le serveur backend.");
      } else {
        setErreur(
          err.response.data?.error || "Identifiants incorrects ou problème d'accès."
        );
      }
    }
  };

  return (
    <div>
      <h1 className="luham">
        Luham Logistik S.R.L
      </h1>
      <div className="para_1">
        <span className="display_4">Propulsez votre croissance avec une stratégie digitale sur mesure.</span>
        <p className="display">Protéger vos données et valoriser votre image. <strong className="luham">Luham Logistik S.R.L</strong>, Nous sommes l’expertise double.</p>
        <h2 className="compte-login">Entrez dans votre espace entreprise</h2>
      </div>

      <form onSubmit={handleLogin} className="container space-y-4">
        <div className="container-form">
          <div>
            <img className="admin" src="./user.png" alt="utilisateur" />
            <div className="form-input">
              <i className="fa fa-user fa-2x" aria-hidden="true"></i>
              <input
                type="email"
                placeholder="votreAgence@luhamcode.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="form-input">
              <i className="fa fa-lock fa-2x" aria-hidden="true"></i>
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {erreur && (
            <div className="text-red-600 bg-red-50 p-2 rounded-xl text-sm text-center border border-red-200">
              {erreur}
            </div>
          )}

          <button
            type="submit"
            className="submit"
          >
            CONNECTER
          </button>

          <p 
            onClick={() => navigate("/register")}
            className="bas-logi" 
            style={{ cursor: "pointer" }}
          >
            Créer un compte Entreprise
          </p>
        </div>
      </form>

      <div className="bas-login">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation digitale qui rapproche le monde.”</span>
        <a className="btn-success resp-1" href="https://luhamcode.com/contact" role="button">Contactez-nous</a>
        <div>
          <p className="droit">&copy; 2026 . Tous droits réservés à <a href="https://luhamcode.com/">https://luhamcode.com</a> <span className="credits">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank" rel="noreferrer">LuhamCode</a></span></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
