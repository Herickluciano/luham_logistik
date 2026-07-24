const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// Variables de configuration dynamiques pour la production
const SECRET = process.env.JWT_SECRET || "LUHAMCODE_SECRET_KEY_99";
const PORT = process.env.PORT || 3000; 

app.use(express.json());

/* ======================
   CONFIGURATION CORS CORRIGÉE
====================== */
const allowedOrigins = [
  'https://luhamcode.com', 
  'https://luhamcode.com', 
  'https://onrender.com',  
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (comme Postman ou les requêtes serveur à serveur)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Origine bloquée par CORS :", origin);
      callback(new Error('Bloqué par la politique CORS de LUHAMCODE'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false // CORRIGÉ : Gère automatiquement et directement les requêtes de pré-vérification OPTIONS
}));

// CORRIGÉ : La ligne app.options(...) qui provoquait le crash a été complètement supprimée d'ici.

// 1. Préparation de la configuration MySQL dynamique
const dbConfig = process.env.DATABASE_URL || {
  host: "localhost",
  user: "root",
  password: "",
  database: "db-logistique"
};

// 2. Création du Pool de connexions
const pool = mysql.createPool({
  ...(typeof dbConfig === 'string' ? { uri: dbConfig } : dbConfig),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 3. Wrapper pour maintenir la compatibilité
const db = {
  query: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    pool.query(sql, params, callback);
  }
};

console.log("Pool de connexions MySQL configuré avec succès !");

/* ======================
   AUTH : REGISTER
====================== */
app.post("/register", async (req, res) => {
  const { name, gln, email, password, user_id } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur BDD Recherche" });
    if (result.length > 0) return res.status(400).json({ error: "Email déjà utilisé" });

    try {
      const hash = await bcrypt.hash(password, 10);
      
      db.query("INSERT INTO companies (name, gln, user_id) VALUES (?, ?, ?)", [name, gln, user_id], (err2, companyResult) => {
        if (err2) {
            console.error(err2); 
            return res.status(500).json({ error: "Erreur création entreprise dans MySQL" });
        }
        
        const companyId = companyResult.insertId;
        const sqlUser = "INSERT INTO users (email, password, company_id, company_name) VALUES (?, ?, ?, ?)";
        
        db.query(sqlUser, [email, hash, companyId, name], (err3) => {
          if (err3) {
              console.error(err3);
              return res.status(500).json({ error: "Erreur création utilisateur" });
          }
          res.json({ message: "Compte créé avec succès", company_id: companyId });
        });
      });
    } catch (e) { 
      res.status(500).json({ error: "Erreur lors du hachage du mot de passe" }); 
    }
  });
});

/* ======================
   AUTH : LOGIN
====================== */
app.post("/", (req, res) => {
  const { email, password } = req.body;
  
  const sql = `
    SELECT users.*, companies.name as real_company_name 
    FROM users 
    JOIN companies ON users.company_id = companies.id 
    WHERE users.email = ?`;

  db.query(sql, [email], async (err, result) => {
    if (err || result.length === 0) return res.status(401).json({ error: "Utilisateur introuvable" });
    
    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user.id, company_id: user.company_id }, SECRET, { expiresIn: "24h" });

    res.json({ 
      token, 
      company_id: user.company_id, 
      company_name: user.real_company_name 
    });
  });
});

/* ======================
   PRODUITS : CRUD
====================== */
app.post("/produits", (req, res) => {
  const { nom, gtin, description, poids_net, dimensions, gtin_groupage, palettisation, company_id } = req.body;
  db.query(
    "INSERT INTO produits (nom, gtin, description, poids_net, dimensions, gtin_groupage, palettisation, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [nom, gtin, description, poids_net, dimensions, gtin_groupage, palettisation, company_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Produit ajouté", id: result.insertId });
    }
  );
});

app.get("/produits", (req, res) => {
  const { company_id } = req.query;
  db.query(
    "SELECT * FROM produits WHERE company_id = ? ORDER BY id DESC",
    [company_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(result);
    }
  );
});

app.get("/produits/:id", (req, res) => {
  db.query("SELECT * FROM produits WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur serveur" });
    if (result.length === 0) return res.status(404).json({ error: "Produit non trouvé" });
    res.json(result[0]);
  });
});

app.put("/produits/:id", (req, res) => {
  const { id } = req.params;
  const { nom, gtin, description, dimensions, poids_net } = req.body;
  db.query(
    "UPDATE produits SET nom=?, gtin=?, description=?, dimensions=?, poids_net=? WHERE id=?",
    [nom, gtin, description, dimensions, poids_net, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Erreur SQL Update" });
      res.json({ message: "Produit mis à jour" });
    }
  );
});

app.delete("/produits/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM produits WHERE id = ?", [id], (err, result) => {
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
    if (err) return res.status(500).json({ error: "Erreur récup colis" });
    res.json(result);
  });
});

app.put("/colis/:id", (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  db.query("UPDATE colis SET statut = ? WHERE id = ?", [statut, id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur modification statut" });
    res.json({ message: "Statut mis à jour" });
  });
});

app.delete("/colis/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM colis WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Erreur SQL Delete" });
    res.json({ message: "Colis supprimé" });
  });
});

// ÉCOUTE DU SERVEUR
app.listen(PORT, () => {
  console.log(`Serveur démarré avec succès sur le port ${PORT}`);
});
