require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function test() {
  console.log(`Tentative de connexion avec : ${process.env.EMAIL_USER}`);
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Configuration Email',
      text: 'Si vous recevez ceci, la configuration fonctionne !'
    });
    console.log('✅ SUCCÈS! Email envoyé:', info.messageId);
  } catch (error) {
    console.error('❌ ERREUR:', error);
  }
}

test();
