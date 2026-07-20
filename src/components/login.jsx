import { useState } from "react";
import axios from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import './App.css'


function login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  const navigate = useNavigate();

  // Si déjà connecté
  if (localStorage.getItem("token")) {
    return <Navigate to="/home" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur("");

    try {
      const res = await axios.post("http://localhost:3000", {
        email,
        password,
      });

      const token = res.data.token;

      if (!token) {
        setErreur("Aucun token reçu.");
        return;
      }

      const decoded = jwtDecode(token);

      console.log("TOKEN :", decoded);

      const companyId =
        decoded.company_id || res.data.company_id;

      const companyName =
        decoded.company_name || res.data.company_name ;

      if (!companyId) {
        setErreur("company_id manquant");
        return;
      }

      // Sauvegarde session
      localStorage.setItem("token", token);
      localStorage.setItem("company_id", companyId);
      localStorage.setItem("company_name", companyName);

      // vider formulaire
      setEmail("");
      setPassword("");

      navigate("/home");

    } catch (err) {
      console.error(err);

      if (!err.response) {
        setErreur("Serveur backend arrêté");
      } else {
        setErreur(
          err.response.data?.error ||
          "Identifiants incorrects"
        );
      }
    }
  };
  return (
    <div>
        <h1 className="luham ">
          Luham Logistik S.R.L
        </h1>
        <div className="para_1">
               <span className="display_4">Propulsez votre croissance avec une stratégie digitale sur mesure.</span>
               <p className="display">Protéger vos données et valoriser votre image. <strong className="luham">Luham Logistik S.R.L</strong>, Nous sommes l’expertise double.</p>
               <h2 className="compte-login">Entre dans votre espace entreprise </h2>
          </div>

        <form onSubmit={handleLogin} className="container space-y-4 ">
          <div className="container-form">
          <div>
      <img className="admin" src="./user.png" alt="image" />
    <div className="form-input"><i className="fa fa-user fa-2x" aria-hidden="true"></i>
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
            <div className="form-input"><i className="fa fa-lock fa-2x" aria-hidden="true"></i>
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
            <div >
              {erreur}
            </div>
          )}

          <button
            type="submit"
            className="submit "
          >
            CONNECTER
          </button>

           <p 
            onClick={() => navigate("/register")}
           className="bas-logi " 
          >
            Créer un compte Entreprise
          </p>
          </div>
        </form>
        <div className="bas-login">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation  digitale qui rapproche le monde.”</span>
        <a className=" btn-success resp-1" href="https://luhamcode.com/contact" role="button"> Contactez-nous</a>
        <div>
         <p className="droit">&copy; 2026 . Tous droits réservés a <a href="https://luhamcode.com/">https://luhamcode.com</a> <span className="credits">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank">LuhamCode</a></span></p>
         </div>
        </div>
      </div>
  );
}

export default login;