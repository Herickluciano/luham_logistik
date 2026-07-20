const bcrypt = require('bcrypt');
const email = "contact@exemple.com";
const passwordClair = "luhamcode1122";


bcrypt.hash(passwordClair, 10, (err, hash) => {
    console.log("Voici ton mot de passe haché à copier :");
    console.log(hash); 
});
