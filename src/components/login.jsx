import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './App.css';

// SÉCURITÉ ABSOLUE : Si l'adresse pointe par erreur sur le frontend, on force le vrai backend
const OBTENIR_API_URL = () => {
  const urlEnv = import.meta.env.VITE_API_URL;
  if (!urlEnv || urlEnv.includes("luham-logistik.onrender.com")) {
    return "https://luham-logistik-api.onrender.com";
  }
  return urlEnv;
};

const API_URL = OBTENIR_API_URL();

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur("");
    
    try {
      // Requéte envoyée vers le endpoint racine du backend légitime
      const res = await axios.post(`${API_URL}/`, { email, password });
      const token = res.data.token;

      if (!token) {
        setErreur("Aucun token reçu du serveur.");
        return;
      }

      const decoded = jwtDecode(token);
      const companyId = decoded.company_id || res.data.company_id;
      const companyName = decoded.company_name || res.data.company_name;

      localStorage.setItem("token", token);
      localStorage.setItem("company_id", companyId);
      localStorage.setItem("company_name", companyName);

      setEmail("");
      setPassword("");
      navigate("/home");

    } catch (err) {
      console.error(err);
      if (!err.response) {
        setErreur("Impossible de joindre le serveur de données (Backend).");
      } else {
        setErreur(err.response.data?.error || "Identifiants invalides.");
      }
    }
  };

  return (
    <div>
      <h1 className="luham">Luham Logistik S.R.L</h1>
      <div className="para_1">
        <span className="display_4">Propulsez votre croissance avec une stratégie digitale sur mesure.</span>
        <p className="display">Protéger vos données et valoriser votre image. <strong className="luham">Luham Logistik S.R.L</strong>, Nous sommes l’expertise double.</p>
        <h2 className="compte-login">Entrez dans votre espace entreprise</h2>
      </div>

      <form onSubmit={handleLogin} className="container space-y-4">
        <div className="container-form">
          <div>
            <img className="admin" src="./user.png" alt="user" />
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
                placeholder="Password"
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

          <button type="submit" className="submit">
            CONNECTER
          </button>

          <p onClick={() => navigate("/register")} className="bas-logi" style={{ cursor: "pointer" }}>
            Entreprise
          </p>
        </div>
      </form>
      
      <div className="bas-login">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation digitale qui rapproche le monde.”</span>
        <a className="btn-success resp-1" href="https://luhamcode.com" role="button">Contactez-nous</a>
        <div>
          <p className="droit">&copy; 2026 . Tous droits réservés à <a href="https://luhamcode.com">https://luhamcode.com</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
