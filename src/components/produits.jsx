import { useEffect, useState } from "react"; 
import axios from "axios"; 
import { useNavigate } from "react-router-dom"; // Import nécessaire pour la redirection

const API_URL = "https://onrender.com";

function Produits() {
  const companyName = localStorage.getItem("company_name") || "Mon Entreprise";
  const companyId = localStorage.getItem("company_id");
  const token = localStorage.getItem("token");
  
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const navigate = useNavigate();

  // ======================
  // GESTION INACTIVITÉ (20 MIN)
  // ======================
  useEffect(() => {
    if (!token) return;

    const tempsInactivite = 20 * 60 * 1000; 
    let timer;

    const redirectionLogin = () => {
      localStorage.clear();
      navigate("/"); // Redirection vers login
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
  // CHARGEMENT DONNÉES
  // ======================
  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = () => {
    if (!companyId) {
      setErreur("Company ID manquant (login)");
      setChargement(false);
      return;
    }
    axios
      .get(`${API_URL}/produits?company_id=${companyId}`)
      .then(res => {
        setProduits(Array.isArray(res.data) ? res.data : []);
        setChargement(false);
      })
      .catch(err => {
        setErreur("Erreur serveur lors de la récupération");
        setChargement(false);
      });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer ce produit définitivement ?")) {
      try {
        await axios.delete(`${API_URL}/produits/${id}`);
        setProduits(produits.filter(p => p.id !== id));
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/produits/${editingProduct.id}`, editingProduct);
      setProduits(produits.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
      alert("Produit mis à jour !");
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  const produitsFiltres = produits.filter((p) => {
    if (!search) return true;
    const last4 = String(p.gtin || "").slice(-4);
    return last4.includes(search);
  });

 return ( 
    <div className="p-10 bg-slate-50 min-h-screen font-sans"> 
      <div className="max-w-5xl mx-auto  rounded-3xl shadow-xl overflow-hidden">
        
        <div className="luham p-6">
          <h1 className="text-titre">
            Espace collaborateur :{" "}
            <span style={{ color: "red" }}>{companyName}</span>
          </h1>
        </div>

        <div className="para_1 px-6">
          <p className="display">
            Protéger vos données et valoriser votre image<br/> 
            <strong className="luham">Luham Logistik S.R.L</strong><br/> 
            Nous sommes l’expertise double.
          </p>
        </div>

        {/* HEADER */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="compte">Gestion des produits</h3>
            <div className="comte">
               <button 
            type="button"
            onClick={() => navigate("/home")}
            className="submit-reg "
          >
            Retour l'accueil
          </button></div>
             {/* SEARCH BAR */}
        <div className="rech p-6 border-b">
          <input
            type="text"
            placeholder="🔎 Rechercher par 4 derniers chiffres du GTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
          </div>
        </div>

        {/* FORMULAIRE D'ÉDITION */}
        {editingProduct && (
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <h3 className="font-bold mb-4 text-blue-800">Modifier le produit #{editingProduct.id}</h3>
            <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4">
              <input 
                className="p-2 border rounded" 
                value={editingProduct.nom || ""} 
                onChange={e => setEditingProduct({...editingProduct, nom: e.target.value})}
                placeholder="Nom"
              />
              <input 
                className="p-2 border rounded" 
                value={editingProduct.gtin || ""} 
                onChange={e => setEditingProduct({...editingProduct, gtin: e.target.value})}
                placeholder="GTIN"
              />
              <div className="col-span-2 flex gap-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  Sauvegarder
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingProduct(null)} 
                  className="bg-slate-300 px-4 py-2 rounded-lg text-sm"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CONTENT */}
        <div className="p-6">
          {chargement ? (
            <p className="text-center py-10 text-slate-500 animate-pulse">Chargement...</p>
          ) : erreur ? (
            <p className="text-center py-10 text-red-500">{erreur}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-dark text-center">
                <thead>
                  <tr>
                    <th scope="col" className="py-1 px-3 text-[11px] uppercase tracking-wider text-slate-500">Numero du produit</th>
                    <th scope="col" className="py-1 px-3 text-[11px] uppercase tracking-wider text-slate-500">Produit & description</th>
                    <th scope="col" className="py-1 px-3 text-[11px] uppercase tracking-wider text-slate-500">Codice/Ref </th>
                    <th scope="col" className="py-1 px-3 text-[11px] uppercase tracking-wider text-slate-500">Dimensions</th>
                    <th scope="col" className="py-1 px-3 text-right text-[11px] uppercase tracking-wider text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produitsFiltres.map((p) => (
                    <tr key={p.id}>
                      {/* Utilisation de th scope="row" pour l'ID (Rectangle Gris) */}
                      <th scope="row" className="py-1 px-3 font-mono text-[11px] text-center font-normal" style={{ backgroundColor: "#f1f5f9", color: "#64748b", borderRadius: "6px" }}>
                        {p.id}
                      </th>
                      
                      {/* Rectangle Produit (Vert) */}
                      <td className="py-1 px-4" style={{ backgroundColor: "#e6f4ea", borderRadius: "6px" }}>
                        <p className="font-bold text-xs leading-none" style={{ color: "#0f5132" }}>{p.nom}</p>
                        {p.description && (
                          <p className="text-[9px] italic leading-none mt-0.5" style={{ color: "#137333" }}>{p.description}</p>
                        )}
                      </td>
                      
                      {/* Rectangle GTIN (Bleu) */}
                      <td className="py-1 px-4 font-mono text-[11px] font-bold text-center" style={{ backgroundColor: "#e8f0fe", color: "#1a73e8", borderRadius: "6px" }}>
                        {p.gtin}
                      </td>
                      
                      {/* Rectangle Dimensions (Orange/Jaune) */}
                      <td className="py-1 px-4 text-[11px] text-center" style={{ backgroundColor: "#fff4e5", color: "#b06000", borderRadius: "6px" }}>
                        {p.dimensions || "N/A"}
                      </td>
                      
                      {/* Rectangle Actions (Violet) */}
                      <td className="py-1 px-4 text-right" style={{ backgroundColor: "#f3e8ff", borderRadius: "6px" }}>
                        <button 
                          onClick={() => setEditingProduct(p)}
                          className="mr-3 text-[10px] font-bold uppercase hover:underline"
                          style={{ color: "#7c3aed" }}
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="text-[10px] font-bold uppercase hover:underline"
                          style={{ color: "#ef4444" }}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div> 
);

}

export default Produits;
