// backend/config/email.js
const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou utilisez un autre service (Outlook, Yahoo, etc.)
  auth: {
    user: process.env.EMAIL_USER, // Votre email
    pass: process.env.EMAIL_PASS  // Votre mot de passe ou "App Password"
  }
});

// Fonction pour envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Gestion Stagiaire" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return false;
  }
};

// Email de confirmation d'approbation
const sendApprovalEmail = async (user) => {
  const subject = '✅ Votre compte Gestion Stagiaire a été approuvé';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5;">Gestion Stagiaire</h1>
      </div>
      
      <h2 style="color: #333;">Bonjour ${user.firstName} ${user.lastName},</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Nous avons le plaisir de vous informer que votre compte a été <strong style="color: #10b981;">approuvé</strong> par l'administrateur.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Informations de connexion</h3>
        <p style="color: #666; margin: 5px 0;">
          <strong>Email:</strong> ${user.email}
        </p>
        <p style="color: #666; margin: 5px 0;">
          <strong>Lien de connexion:</strong> 
          <a href="http://localhost:5173/login" style="color: #4f46e5;">Cliquez ici</a>
        </p>
      </div>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Vous pouvez dès à présent vous connecter à votre espace personnel pour :
      </p>
      
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>✅ Consulter vos tâches</li>
        <li>📊 Voir votre tableau de bord</li>
        <li>📅 Suivre vos échéances</li>
      </ul>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>&copy; ${new Date().getFullYear()} Gestion Stagiaire. Tous droits réservés.</p>
      </div>
    </div>
  `;

  return await sendEmail(user.email, subject, html);
};

// Email de notification à l'admin pour nouvelle inscription
const sendNewRegistrationEmail = async (adminEmail, newUser) => {
  const subject = '🔔 Nouvelle demande d\'inscription en attente';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5;">Gestion Stagiaire</h1>
      </div>
      
      <h2 style="color: #333;">Nouvelle inscription !</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Un nouveau stagiaire vient de s'inscrire et attend votre approbation.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Détails du demandeur</h3>
        <p style="color: #666; margin: 5px 0;">
          <strong>Nom:</strong> ${newUser.firstName} ${newUser.lastName}
        </p>
        <p style="color: #666; margin: 5px 0;">
          <strong>Email:</strong> ${newUser.email}
        </p>
        <p style="color: #666; margin: 5px 0;">
          <strong>Téléphone:</strong> ${newUser.phone || 'Non renseigné'}
        </p>
        <p style="color: #666; margin: 5px 0;">
          <strong>Date d'inscription:</strong> ${new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:5173/approvals" 
           style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          👉 Voir la demande
        </a>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
        <p>Connectez-vous pour approuver ou refuser cette demande.</p>
      </div>
    </div>
  `;

  return await sendEmail(adminEmail, subject, html);
};

// Email de rejet
const sendRejectionEmail = async (user) => {
  const subject = 'ℹ️ Statut de votre demande Gestion Stagiaire';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5;">Gestion Stagiaire</h1>
      </div>
      
      <h2 style="color: #333;">Bonjour ${user.firstName} ${user.lastName},</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Nous avons bien reçu votre demande d'inscription à Gestion Stagiaire.
      </p>
      
      <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <p style="color: #b91c1c; margin: 0; font-size: 16px;">
          Malheureusement, votre demande n'a pas pu être approuvée pour le moment.
        </p>
      </div>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Raisons possibles :
      </p>
      
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>📋 Informations incomplètes</li>
        <li>🔒 Critères d'éligibilité non remplis</li>
        <li>📧 Email déjà utilisé</li>
      </ul>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        Vous pouvez réessayer en vous inscrivant à nouveau avec des informations correctes.
      </p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="http://localhost:5173/register" 
           style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          📝 Nouvelle inscription
        </a>
      </div>
      
      <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 20px; text-align: center; color: #999; font-size: 14px;">
        <p>Pour toute question, contactez l'administrateur.</p>
      </div>
    </div>
  `;

  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendNewRegistrationEmail
};