import "./App.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Home() {
  const token = localStorage.getItem("token");
  const companyName = localStorage.getItem("company_name");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;

    const tempsInactivite = 10 * 60 * 1000; 
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
        {/* CORRIGÉ : Cible maintenant la route standard avec tiret */}
        <div className="btn"><Link to="/ajouter-produit">Ajouter Produits</Link></div>
        <br/>
        <div className="btn"><Link to="/produits">Liste des Produits</Link></div>
        <br />
        <div className="btn"><Link to="/colis">Colis / Étiquette</Link></div>
        <br />
        <div className="btn"><Link to="/export">Exportation</Link></div>
      </div>

      <div className="bas-home">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation digitale qui rapproche le monde.”</span>
        <a className="btn-success resp-1" href="https://luhamcode.com/contact" role="button"> Contactez-nous</a>
        <div>
          <p className="droit">&copy; 2026 . Tous droits réservés à <a href="https://luhamcode.com/">https://luhamcode.com</a> <span className="credits">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank" rel="noreferrer">LuhamCode</a></span></p>
        </div>
      </div>
    </div>
  );
}

export default Home;
