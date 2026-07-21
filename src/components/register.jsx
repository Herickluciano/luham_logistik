import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    company_name: "", // Ira dans companies.name et users.company_name
    company_gln: "",  // Ira dans companies.gln
    email: "",        // Table users
    password: "",     // Table users
    user_id: ""
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // 1. Appel dynamique configuré sur la route `/register` de votre backend Render
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
        name: formData.company_name, // Correspond à companies.name
        gln: formData.company_gln,   // Correspond à companies.gln
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name // Correspond à users.company_name
      });

      setMessage({ type: "success", text: "Compte créé avec succès !" });
      setTimeout(() => navigate("/"), 2000);

    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Erreur de connexion au serveur"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="luham ">
          Luham Logistik S.R.L
        </h1>
        <div className="para_1">
               <span className="display_4">Propulsez votre croissance avec une stratégie digitale sur mesure.</span>
               <p className="display">Protéger vos données et valoriser votre image. <strong className="luham">Luham Logistik S.R.L</strong>, Nous sommes l’expertise double.</p>
               <h2 className="compte-login">Espace administrateur</h2>
          </div>

        <form onSubmit={handleRegister} className="container-reg">
          <div className="container-form">
            <img className="admine" src="./admin.png" alt="image" />
            {/* SECTION ENTREPRISE */}
            <div className="lesImput">
            <div className="form-input">
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nom de la société"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                required 
              />
            </div>
          
            <div className="form-input">
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Code GLN (ex: 344567...)"
                value={formData.company_gln}
                onChange={(e) => setFormData({...formData, company_gln: e.target.value})}
              />
            </div>

            {/* SECTION ADMIN */}
            <div className="form-input">
              <input 
                type="email" 
                className="w-full p-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="NomAgence@luhamcode.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
            </div>

            <div className="form-input"><i className="fa fa-lock fa-2x" aria-hidden="true"></i>
              <input 
                type="password" 
                placeholder="password:..........."
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
          
          {message.text && (
            <div className={`mt-4 p-3 rounded-lg text-xs font-bold text-center ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message.text}
            </div>
          )}
         </div>
         <div className="lesButton">
           
          <button type="submit"  className="submit ">
           Créer compte 
          </button>

          <button 
            type="button"
            onClick={() => navigate("/")}
            className="submit-reg "
          >
            Retour Login
          </button>
          </div>
         
          </div>
        </form>
        
      </div>
       <div className="bas-register">
        <span className="slogan">“<strong className="luham">LuhamCode</strong> – L’innovation digitale qui rapproche le monde.”</span>
        {/* 2. Correction de l'URL relative en URL absolue */}
        <a className="btn-success resp-1" href="https://luhamcode.com" role="button"> Contactez-nous</a>
        <div>
         <p className="droit">&copy; 2026 . Tous droits réservés a <a href="https://nesteline.alwaysdata.net">https://nesteline.alwaysdata.net</a> <span className="credits">Design by <a href="https://www.facebook.com/share/1Cgrh1dvau/?mibextid=wwXIfr" target="_blank">LuhamCode</a></span></p>
         </div>
        </div>
    </div>
  );
}

export default Register;
