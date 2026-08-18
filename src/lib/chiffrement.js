import crypto from 'crypto';

const ALGORITHME = 'aes-256-gcm';

function getCle() {
  const cle = process.env.CLE_CHIFFREMENT;
  if (!cle) {
    throw new Error('CLE_CHIFFREMENT is not defined');
  }
  return Buffer.from(cle, 'hex');
}

export function chiffrerCode(texte) {
  const CLE = getCle();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHME, CLE, iv);
  const chiffre = Buffer.concat([cipher.update(texte, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, chiffre]).toString('base64');
}

export function dechiffrerCode(texteChiffre) {
  const CLE = getCle();
  const donnees = Buffer.from(texteChiffre, 'base64');
  const iv = donnees.subarray(0, 12);
  const tag = donnees.subarray(12, 28);
  const chiffre = donnees.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHME, CLE, iv);
  decipher.setAuthTag(tag);
  const dechiffre = Buffer.concat([decipher.update(chiffre), decipher.final()]);
  return dechiffre.toString('utf8');
}