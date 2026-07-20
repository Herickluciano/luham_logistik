export function calculerCleGTIN(code) {
  let somme = 0;
  let inverse = code.split('').reverse();

  for (let i = 0; i < inverse.length; i++) {
    let chiffre = parseInt(inverse[i]);
    somme += (i % 2 === 0) ? chiffre * 3 : chiffre;
  }

  let reste = somme % 10;
  return (10 - reste) % 10;
}

export function genererGTIN(base) {
  return base + calculerCleGTIN(base);
}