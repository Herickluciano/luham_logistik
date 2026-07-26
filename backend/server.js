const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

const SECRET = process.env.JWT_SECRET || "LUHAMCODE_SECRET_KEY_99";
const PORT = process.env.PORT || 3000; 

app.use(express.json());

// 1. CONFIGURATION GLOBAL CORS COMPATIBLE EXPRESS 5
app.use(cors());

// CORRECTION CRUCIALE : Express 5 exige '{*splat}' au lieu de '*'
app.options('{*splat}', cors()); 

// 2. CONFIGURATION BASE DE DONNÉES
const dbConfig = process.env.DATABASE_URL || {
  host: "localhost",
  user: "root",
  password: "",  
  database: "db-logistique"
};

const pool = mysql.createPool({
  ...(typeof dbConfig === 'string' ? { uri: dbConfig } : dbConfig),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

const db = {
  query: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params, callback);
  }
};

console.log("Pool de connexions MySQL prêt.");

/* ======================
   AUTH : REGISTER
====================== */
app.post("/register", async (req, res) => {
  const { name, gln, email, password, user_id } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) {
      console.error("Erreur Register:", err);
      return res.status(500).json({ error: "Erreur interne de la base de données." });
    }
    if (result.length > 0) return res.status(400).json({ error: "Email déjà utilisé" });

    try {
      const hash = await bcrypt.hash(password, 10);
      
      db.query("INSERT INTO companies (name, gln, user_id) VALUES (?, ?, ?)", [name, gln, user_id], (err2, companyResult) => {
        if (err2) {
            console.error("Erreur création entreprise:", err2); 
            return res.status(500).json({ error: "Erreur entreprise." });
        }
        
        const companyId = companyResult.insertId;
        const sqlUser = "INSERT INTO users (email, password, company_id, company_name) VALUES (?, ?, ?, ?)";
        
        db.query(sqlUser, [email, hash, companyId, name], (err3) => {
          if (err3) {
              console.error("Erreur création utilisateur:", err3);
              return res.status(500).json({ error: "Erreur utilisateur." });
          }
          res.json({ message: "Compte créé", company_id: companyId });
        });
      });
    } catch (e) { 
      res.status(500).json({ error: "Erreur hachage." }); 
    }
  });
});

/* ======================
   AUTH : LOGIN
====================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  const sql = `
    SELECT users.*, companies.name as real_company_name 
    FROM users 
    JOIN companies ON users.company_id = companies.id 
    WHERE users.email = ?`;

  db.query(sql, [email], async (err, result) => {
    if (err) {
      console.error("Erreur BDD Login:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    if (!result || result.length === 0) return res.status(401).json({ error: "Utilisateur introuvable" });
    
    // CORRECTION : Récupération correcte du premier utilisateur du tableau
    const user = result[0]; 
    
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

      const token = jwt.sign({ id: user.id, company_id: user.company_id }, SECRET, { expiresIn: "24h" });

      res.json({ 
        token, 
        company_id: user.company_id, 
        company_name: user.real_company_name 
      });
    } catch (e) {
      res.status(500).json({ error: "Erreur décryptage connexion." });
    }
  });
});

/* ======================
   PRODUITS : CRUD
====================== */
app.post("/produits", (req, res) => {
  const { nom, gtin, description, poids_net, dimensions, gtin_groupage, palettisation, company_id } = req.body;

  if (!nom || !gtin || !company_id) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  db.query(
    "INSERT INTO produits (nom, gtin, description, poids_net, dimensions, gtin_groupage, palettisation, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [nom, gtin, description || "", poids_net || "", dimensions || "", gtin_groupage || "", palettisation || "", company_id],
    (err, result) => {
      if (err) {
        console.error("CRASH INTERCEPTÉ - SQL PRODUIT :", err);
        return res.status(500).json({ error: "Erreur SQL Base de données : " + err.message });
      }
      res.json({ message: "Produit ajouté", id: result.insertId });
    }
  );
});

app.get("/produits", (req, res) => {
  const { company_id } = req.query;
  if (!company_id) return res.status(400).json({ error: "company_id manquant." });

  db.query("SELECT * FROM produits WHERE company_id = ? ORDER BY id DESC", [company_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

app.get("/produits/:id", (req, res) => {
  db.query("SELECT * FROM produits WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    if (!result || result.length === 0) return res.status(404).json({ error: "Non trouvé" });
    res.json(result[0]);
  });
});

app.put("/produits/:id", (req, res) => {
  const { nom, gtin, description, dimensions, poids_net } = req.body;
  db.query(
    "UPDATE produits SET nom=?, gtin=?, description=?, dimensions=?, poids_net=? WHERE id=?",
    [nom, gtin, description, dimensions, poids_net, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Erreur SQL Update" });
      res.json({ message: "Produit mis à jour" });
    }
  );
});

app.delete("/produits/:id", (req, res) => {
  db.query("DELETE FROM produits WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur SQL Delete" });
    res.json({ message: "Produit supprimé" });
  });
});

/* ======================
   COLIS : CRUD
====================== */
app.post("/colis", (req, res) => {
  const { produit_id, destinataire_nom, destinataire_adresse, destinataire_gln, destinataire_gtin } = req.body;
  db.query(
    "INSERT INTO colis (produit_id, statut, destinataire_nom, destinataire_adresse, destinataire_gln, destinataire_gtin) VALUES (?, 'En attente', ?, ?, ?, ?)",
    [produit_id, destinataire_nom, destinataire_adresse, destinataire_gln, destinataire_gtin],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, message: "Colis créé" });
    }
  );
});

app.get("/colis", (req, res) => {
  db.query("SELECT * FROM colis ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur" });
    res.json(result);
  });
});

/* ======================
   HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Le serveur fonctionne !" });
});

// ROUTE DE SECOURS GLOBAL
app.use((req, res) => {
  res.status(404).json({ error: `La route ${req.originalUrl} n'existe pas.` });
});

app.listen(PORT, () => {
  console.log(`Serveur opérationnel sur le port ${PORT}`);
});
