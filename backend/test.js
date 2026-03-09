// test-env.js
require('dotenv').config();

console.log('=== Vérification des variables d\'environnement ===\n');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Défini' : '❌ Non défini');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE);
console.log('MAX_FILE_SIZE:', process.env.MAX_FILE_SIZE);
console.log('ALLOWED_FILE_TYPES:', process.env.ALLOWED_FILE_TYPES);

// Afficher un extrait de l'URI MongoDB (sécurisé)
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/:[^:]*@/, ':****@');
  console.log('\nMONGODB_URI (masqué):', maskedUri);
}