// home.jsx
import "./App.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home() {
  const token = localStorage.getItem("token");
  const companyName = localStorage.getItem("company_name");
  const navigate = useNavigate();

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

  return (
    <div className="home">
      <div className="titre">
      <h3>
        Espace collaborateur :{" "}
        <span style={{ color: "red" }}>
          {companyName}
        </span>
      </h3>
      
      <div className="para_1">
        <p className="display">
          Protéger vos données et valoriser votre image<br/> 
          <strong className="luham">Luham Logistik S.R.L</strong><br/> 
          Nous sommes l’expertise double.
        </p>
        <h3 className="compte">Dashboard</h3>
      </div>
      </div>
      <div className="container-home">
        <div className="btn"><Link to="/AjouterProduit">Ajouter Produits</Link></div>
        <br/>
        <div className="btn"><Link to="/Produits">Liste des Produits</Link></div>
        <br />
        <div className="btn"><Link to="/Colis">Colis / Étiquette</Link></div>
        <br />
        <div className="btn"><Link to="/export">Exportation</Link></div>
      </div>

      <div className="bas-home">
       <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation  digitale qui rapproche le monde.”</span>
        <a className="btn-success resp-1" href="https://luhamcode.com/contact" role="button"> Contactez-nous</a>
        <div>
         <p className="droit">&copy; 2026 . Tous droits réservés a <a href="https://luhamcode.com/">https://luhamcode.com</a> <span class="credits">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank">LuhamCode</a></span></p>
         </div>
      </div>
    </div>
  );
}

export default Home;
