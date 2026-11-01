const nodemailer = require("nodemailer"); // npm install nodemailer

// =====================================================================
// ENVOI DES EMAILS
//
// Les paramètres viennent du fichier .env :
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_EXPEDITEUR, URL_FRONTEND
//
// Si SMTP_USER est vide, on est en "mode test" : l'email n'est pas envoyé,
// il est seulement affiché dans le terminal du backend.
// =====================================================================

const MODE_TEST = !process.env.SMTP_USER;

const transporteur = MODE_TEST
  ? null
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT || 465) === 465, // 465 = connexion chiffrée directe
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

const EXPEDITEUR = process.env.EMAIL_EXPEDITEUR || `E-TaxeColis <${process.env.SMTP_USER || "no-reply@etaxecolis.mg"}>`;
const URL_FRONTEND = process.env.URL_FRONTEND || "http://localhost:5173";

const LIBELLES_ROLES = {
  admin: "Administrateur",
  taxateur: "Taxateur",
  directeur: "Directeur",
  "chef de division": "Chef de division",
};

// Envoie un email. Retourne true si l'email est parti (ou affiché en mode test).
async function envoyerEmail({ destinataire, sujet, texte, html }) {
  if (MODE_TEST) {
    console.log("\n===== EMAIL (mode test : non envoyé) =====");
    console.log(`À     : ${destinataire}`);
    console.log(`Sujet : ${sujet}\n`);
    console.log(texte);
    console.log("==========================================\n");
    return true;
  }

  await transporteur.sendMail({ from: EXPEDITEUR, to: destinataire, subject: sujet, text: texte, html });
  return true;
}

// Email envoyé quand l'administrateur approuve (active) un compte
async function envoyerEmailActivation(utilisateur) {
  const role = LIBELLES_ROLES[utilisateur.typeutilisateur] || utilisateur.typeutilisateur;
  const lienConnexion = `${URL_FRONTEND}/authentification`;
  const sujet = "E-TaxeColis – Confirmation de l'activation de votre compte";

  // Version texte (pour les messageries qui n'affichent pas le HTML)
  const texte = `Madame, Monsieur ${utilisateur.nomutilisateur},

Nous avons l'honneur de vous informer que votre demande de création de compte sur la plateforme E-TaxeColis a été examinée et approuvée par l'administrateur.

Votre compte est désormais actif, avec le profil : ${role}.

Vous pouvez dès à présent accéder à l'application à l'adresse suivante :
${lienConnexion}

Identifiant de connexion : ${utilisateur.emailutilisateur}
Mot de passe : celui que vous avez défini lors de votre inscription.

Par mesure de sécurité, nous vous recommandons de ne jamais communiquer votre mot de passe à un tiers.

Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

L'Administration E-TaxeColis

---
Ce message vous est adressé automatiquement. Merci de ne pas y répondre.`;

  // Version HTML (affichée par Gmail, Outlook, ...)
  const html = `
  <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: auto; line-height: 1.6;">
    <h2 style="color: #0A6CC9; border-bottom: 2px solid #0A84F5; padding-bottom: 8px;">E-TaxeColis</h2>
    <p>Madame, Monsieur <strong>${utilisateur.nomutilisateur}</strong>,</p>
    <p>
      Nous avons l'honneur de vous informer que votre demande de création de compte sur la plateforme
      <strong>E-TaxeColis</strong> a été examinée et approuvée par l'administrateur.
    </p>
    <p>Votre compte est désormais <strong>actif</strong>, avec le profil : <strong>${role}</strong>.</p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${lienConnexion}"
         style="background-color: #0A84F5; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none;">
        Accéder à l'application
      </a>
    </p>
    <table style="background-color: #EAF1F8; padding: 12px 16px; border-radius: 6px; width: 100%;">
      <tr><td><strong>Identifiant de connexion :</strong> ${utilisateur.emailutilisateur}</td></tr>
      <tr><td><strong>Mot de passe :</strong> celui que vous avez défini lors de votre inscription.</td></tr>
    </table>
    <p>Par mesure de sécurité, nous vous recommandons de ne jamais communiquer votre mot de passe à un tiers.</p>
    <p>Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>
    <p><strong>L'Administration E-TaxeColis</strong></p>
    <hr style="border: none; border-top: 1px solid #dbe3ec;" />
    <p style="font-size: 12px; color: #6b7280;">Ce message vous est adressé automatiquement. Merci de ne pas y répondre.</p>
  </div>`;

  return envoyerEmail({ destinataire: utilisateur.emailutilisateur, sujet, texte, html });
}

module.exports = { envoyerEmail, envoyerEmailActivation, MODE_TEST };
