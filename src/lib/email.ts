import prisma from './prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email provider types
export type EmailProvider = 'console' | 'smtp';

// Email settings interface
export interface EmailConfig {
  provider: EmailProvider;
  fromEmail: string;
  fromName: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpEncryption?: string;
}

// Email data interface
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type?: string;
  userId?: string;
  agencyId?: string;
  data?: Record<string, unknown>;
}

// Generate random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate 6-digit code
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get email settings from database
export async function getEmailSettings(): Promise<EmailConfig | null> {
  try {
    const settings = await prisma.emailSettings.findFirst();
    if (!settings) {
      // Return default console provider settings
      return {
        provider: 'console',
        fromEmail: 'noreply@qrbag.com',
        fromName: 'QRBag',
        smtpEncryption: 'tls',
      };
    }
    return {
      provider: settings.provider as EmailProvider,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpUser: settings.smtpUser,
      smtpPassword: settings.smtpPassword,
      smtpEncryption: settings.smtpEncryption || 'tls',
    };
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return null;
  }
}

// Save email settings to database
export async function saveEmailSettings(config: Partial<EmailConfig>): Promise<EmailConfig | null> {
  try {
    const existing = await prisma.emailSettings.findFirst();
    
    if (existing) {
      const updated = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          provider: config.provider || existing.provider,
          fromEmail: config.fromEmail || existing.fromEmail,
          fromName: config.fromName || existing.fromName,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          smtpEncryption: config.smtpEncryption || existing.smtpEncryption,
        },
      });
      return {
        provider: updated.provider as EmailProvider,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        smtpHost: updated.smtpHost,
        smtpPort: updated.smtpPort,
        smtpUser: updated.smtpUser,
        smtpPassword: updated.smtpPassword,
        smtpEncryption: updated.smtpEncryption || 'tls',
      };
    } else {
      const created = await prisma.emailSettings.create({
        data: {
          provider: config.provider || 'console',
          fromEmail: config.fromEmail || 'noreply@qrbag.com',
          fromName: config.fromName || 'QRBag',
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          smtpEncryption: config.smtpEncryption || 'tls',
        },
      });
      return {
        provider: created.provider as EmailProvider,
        fromEmail: created.fromEmail,
        fromName: created.fromName,
        smtpHost: created.smtpHost,
        smtpPort: created.smtpPort,
        smtpUser: created.smtpUser,
        smtpPassword: created.smtpPassword,
        smtpEncryption: created.smtpEncryption || 'tls',
      };
    }
  } catch (error) {
    console.error('Error saving email settings:', error);
    return null;
  }
}

// Log email to database
async function logEmail(
  to: string,
  subject: string,
  type: string,
  status: 'pending' | 'sent' | 'failed',
  error?: string,
  userId?: string,
  agencyId?: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        type,
        status,
        error,
        userId,
        agencyId,
        data: data ? JSON.stringify(data) : null,
        sentAt: status === 'sent' ? new Date() : null,
      },
    });
  } catch (logError) {
    console.error('Error logging email:', logError);
  }
}

// Update email test status
export async function updateTestStatus(success: boolean, error?: string): Promise<void> {
  try {
    const existing = await prisma.emailSettings.findFirst();
    if (existing) {
      await prisma.emailSettings.update({
        where: { id: existing.id },
        data: {
          lastTestAt: new Date(),
          lastTestStatus: success ? 'success' : 'failed',
          lastTestError: error || null,
        },
      });
    }
  } catch (updateError) {
    console.error('Error updating test status:', updateError);
  }
}

// Send via SMTP using nodemailer
async function sendViaSMTP(config: EmailConfig, emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  if (!config.smtpHost || !config.smtpPort) {
    return { success: false, error: 'Configuration SMTP incomplète (hôte ou port manquant)' };
  }

  if (!config.smtpUser || !config.smtpPassword) {
    return { success: false, error: 'Configuration SMTP incomplète (utilisateur ou mot de passe manquant)' };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      tls: {
        // Do not fail on invalid certs (useful for self-signed certs)
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();

    // Prepare email options
    const toEmail = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
    
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html?.replace(/<[^>]*>/g, ''),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    return { success: true };

  } catch (error) {
    console.error('❌ SMTP Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur SMTP inconnue';
    return { success: false, error: errorMessage };
  }
}

// Main send email function
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  const config = await getEmailSettings();
  
  if (!config) {
    const error = 'Configuration email non trouvée';
    await logEmail(
      Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      emailData.subject,
      emailData.type || 'general',
      'failed',
      error,
      emailData.userId,
      emailData.agencyId,
      emailData.data
    );
    return { success: false, error };
  }

  const toEmail = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to;
  let result: { success: boolean; error?: string };

  switch (config.provider) {
    case 'smtp':
      result = await sendViaSMTP(config, emailData);
      break;
    case 'console':
    default:
      // Console mode - just log the email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL (Console Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`From: ${config.fromName} <${config.fromEmail}>`);
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log(`Type: ${emailData.type || 'general'}`);
      console.log('────────────────────────────────────────────────');
      console.log(emailData.text || emailData.html?.replace(/<[^>]*>/g, ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result = { success: true };
      break;
  }

  // Log the email
  await logEmail(
    toEmail,
    emailData.subject,
    emailData.type || 'general',
    result.success ? 'sent' : 'failed',
    result.error,
    emailData.userId,
    emailData.agencyId,
    emailData.data
  );

  return result;
}

// ============ EMAIL TEMPLATES ============

export function getVerificationEmailTemplate(name: string, verificationUrl: string, code: string): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Vérification de votre email</h2>
          <p style="color: #666;">Bonjour ${name},</p>
          <p style="color: #666;">Merci de vous être inscrit sur QRBag. Vérifiez votre adresse email en utilisant le code ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px solid #ff7f00; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff7f00;">${code}</span>
            </div>
          </div>
          <p style="color: #666; text-align: center;">Ou cliquez sur le bouton suivant :</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="background: #ff7f00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Vérifier mon email</a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Ce code expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Vérification de votre email\n\nBonjour ${name},\n\nMerci de vous être inscrit sur QRBag.\n\nVotre code de vérification : ${code}\n\nOu utilisez ce lien : ${verificationUrl}\n\nCe code expire dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.\n\n© QRBag`,
  };
}

export function getPasswordResetEmailTemplate(name: string, resetUrl: string, code: string): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #666;">Bonjour ${name},</p>
          <p style="color: #666;">Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #fff; border: 2px solid #ff7f00; border-radius: 10px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff7f00;">${code}</span>
            </div>
          </div>
          <p style="color: #666; text-align: center;">Ou cliquez sur le bouton suivant :</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background: #ff7f00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">Ce code expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Réinitialisation de votre mot de passe\n\nBonjour ${name},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nVotre code : ${code}\n\nOu utilisez ce lien : ${resetUrl}\n\nCe code expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.\n\n© QRBag`,
  };
}

export function getTestEmailTemplate(): { html: string; text: string } {
  const now = new Date().toLocaleString('fr-FR');
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Email de test</h2>
          <p style="color: #666;">Ceci est un email de test envoyé depuis le panneau d'administration QRBag.</p>
          <p style="color: #666;">Si vous recevez cet email, votre configuration email fonctionne correctement !</p>
          <div style="background: #e8f5e9; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <p style="color: #2e7d32; margin: 0; font-weight: bold;">✓ Configuration email valide</p>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">Envoyé le ${now}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Email de test\n\nCeci est un email de test envoyé depuis le panneau d'administration QRBag.\n\nSi vous recevez cet email, votre configuration email fonctionne correctement !\n\n✓ Configuration email valide\nEnvoyé le ${now}\n\n© QRBag`,
  };
}

// ============ NEW EMAIL TEMPLATES ============

// Welcome email for new agencies
export function getWelcomeAgencyEmailTemplate(
  agencyName: string, 
  email: string, 
  password: string,
  loginUrl: string
): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Protection intelligente des bagages</p>
        </div>
        <div style="background: linear-gradient(135deg, #ff7f00 0%, #ff9933 100%); border-radius: 10px 10px 0 0; padding: 30px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">🎉 Bienvenue sur QRBag !</h2>
        </div>
        <div style="background: #f9f9f9; border-radius: 0 0 10px 10px; padding: 30px;">
          <p style="color: #666;">Bonjour ${agencyName},</p>
          <p style="color: #666;">Votre agence a été créée avec succès sur QRBag. Vous pouvez maintenant accéder à votre espace dédié pour gérer vos bagages et voyageurs.</p>
          
          <div style="background: white; border: 2px solid #ff7f00; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; text-align: center;">🔐 Vos identifiants de connexion</h3>
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email :</td>
                <td style="padding: 8px 0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Mot de passe :</td>
                <td style="padding: 8px 0; font-family: monospace; background: #f0f0f0; padding: 5px 10px; border-radius: 5px;">${password}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #ff7f00; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Accéder à mon espace</a>
          </div>
          
          <div style="background: #fff3e0; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #e65100; margin: 0; font-weight: bold;">⚠️ Important</p>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
          <p>Protection intelligente des bagages pour voyageurs et pèlerins</p>
        </div>
      </div>
    `,
    text: `QRBag - Bienvenue sur QRBag !\n\nBonjour ${agencyName},\n\nVotre agence a été créée avec succès sur QRBag.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔐 Vos identifiants de connexion\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEmail : ${email}\nMot de passe : ${password}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nConnectez-vous ici : ${loginUrl}\n\n⚠️ Important : Pour votre sécurité, changez votre mot de passe lors de votre première connexion.\n\n© QRBag - Tous droits réservés`,
  };
}

// Baggage found notification
export function getBaggageFoundEmailTemplate(
  ownerName: string,
  baggageReference: string,
  foundLocation: string,
  founderName: string,
  founderPhone: string,
  baggageUrl: string
): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
        </div>
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); border-radius: 10px 10px 0 0; padding: 30px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">✅ Bagage retrouvé !</h2>
        </div>
        <div style="background: #f9f9f9; border-radius: 0 0 10px 10px; padding: 30px;">
          <p style="color: #666;">Bonjour ${ownerName},</p>
          <p style="color: #666;"> Excellente nouvelle ! Votre bagage a été trouvé et signalé via QRBag.</p>
          
          <div style="background: white; border: 2px solid #4CAF50; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; text-align: center;">📦 Détails du bagage</h3>
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Référence :</td>
                <td style="padding: 8px 0; font-family: monospace; color: #ff7f00; font-weight: bold;">${baggageReference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Lieu trouvé :</td>
                <td style="padding: 8px 0;">${foundLocation}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin-top: 0;">👤 Informations du découvreur</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Nom :</strong> ${founderName || 'Non renseigné'}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Téléphone :</strong> <a href="tel:${founderPhone}" style="color: #ff7f00;">${founderPhone}</a></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baggageUrl}" style="background: #ff7f00; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Voir les détails</a>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center;">Contactez rapidement la personne qui a trouvé votre bagage pour organiser sa récupération.</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Bagage retrouvé !\n\nBonjour ${ownerName},\n\nExcellente nouvelle ! Votre bagage a été trouvé.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 Détails du bagage\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nRéférence : ${baggageReference}\nLieu trouvé : ${foundLocation}\n\n👤 Informations du découvreur\nNom : ${founderName || 'Non renseigné'}\nTéléphone : ${founderPhone}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nVoir les détails : ${baggageUrl}\n\nContactez rapidement la personne qui a trouvé votre bagage pour organiser sa récupération.\n\n© QRBag`,
  };
}

// SuperAdmin notification for new message
export function getSuperAdminMessageEmailTemplate(
  messageType: string,
  senderName: string,
  senderEmail: string,
  senderPhone: string,
  subject: string,
  content: string,
  messagesUrl: string
): { html: string; text: string } {
  const typeLabels: Record<string, string> = {
    'contact': 'Formulaire de contact',
    'partenaire': 'Demande de partenariat',
    'commande_agence': 'Commande QR',
    'assistance_agence': 'Demande d\'assistance',
    'message_superadmin': 'Message direct'
  };
  
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Notification SuperAdmin</p>
        </div>
        <div style="background: linear-gradient(135deg, #2196F3 0%, #42A5F5 100%); border-radius: 10px 10px 0 0; padding: 30px; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">📬 Nouveau message reçu</h2>
        </div>
        <div style="background: #f9f9f9; border-radius: 0 0 10px 10px; padding: 30px;">
          <div style="background: white; border: 2px solid #2196F3; border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Type : ${typeLabels[messageType] || messageType}</h3>
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px;">Expéditeur :</td>
                <td style="padding: 8px 0;">${senderName || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email :</td>
                <td style="padding: 8px 0;"><a href="mailto:${senderEmail}" style="color: #ff7f00;">${senderEmail}</a></td>
              </tr>
              ${senderPhone ? `<tr>
                <td style="padding: 8px 0; font-weight: bold;">Téléphone :</td>
                <td style="padding: 8px 0;"><a href="tel:${senderPhone}" style="color: #ff7f00;">${senderPhone}</a></td>
              </tr>` : ''}
            </table>
          </div>
          
          ${subject ? `<div style="background: #e3f2fd; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #1565C0; margin: 0; font-weight: bold;">Sujet :</p>
            <p style="color: #666; margin: 10px 0 0 0;">${subject}</p>
          </div>` : ''}
          
          <div style="background: white; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #ddd;">
            <p style="color: #333; margin: 0; font-weight: bold;">Message :</p>
            <p style="color: #666; margin: 10px 0 0 0; white-space: pre-wrap;">${content}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${messagesUrl}" style="background: #ff7f00; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Voir dans l'admin</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Nouveau message reçu\n\nType : ${typeLabels[messageType] || messageType}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nExpéditeur : ${senderName || 'Non renseigné'}\nEmail : ${senderEmail}\n${senderPhone ? `Téléphone : ${senderPhone}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${subject ? `Sujet : ${subject}\n\n` : ''}Message :\n${content}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nVoir dans l'admin : ${messagesUrl}\n\n© QRBag`,
  };
}

// Invoice email
export function getInvoiceEmailTemplate(
  agencyName: string,
  invoiceNumber: string,
  amount: string,
  dueDate: string,
  invoiceUrl: string
): { html: string; text: string } {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ff7f00; margin: 0;">QRBag</h1>
        </div>
        <div style="background: #f9f9f9; border-radius: 10px; padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">📄 Nouvelle facture</h2>
          <p style="color: #666;">Bonjour ${agencyName},</p>
          <p style="color: #666;">Une nouvelle facture a été générée pour votre agence.</p>
          
          <div style="background: white; border: 2px solid #ff7f00; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">FACTURE</p>
            <p style="color: #ff7f00; margin: 5px 0; font-size: 24px; font-weight: bold;">${invoiceNumber}</p>
            <p style="color: #333; margin: 20px 0 5px 0; font-size: 14px;">Montant à payer</p>
            <p style="color: #ff7f00; margin: 0; font-size: 32px; font-weight: bold;">${amount}</p>
            <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">Échéance : ${dueDate}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="background: #ff7f00; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Voir la facture</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© QRBag - Tous droits réservés</p>
        </div>
      </div>
    `,
    text: `QRBag - Nouvelle facture\n\nBonjour ${agencyName},\n\nUne nouvelle facture a été générée.\n\nFacture : ${invoiceNumber}\nMontant : ${amount}\nÉchéance : ${dueDate}\n\nVoir la facture : ${invoiceUrl}\n\n© QRBag`,
  };
}

// ============ EMAIL TOKEN MANAGEMENT ============

export async function createEmailToken(email: string, type: 'email_verification' | 'password_reset'): Promise<{ token: string; code: string }> {
  const token = generateToken();
  const code = generateCode();
  
  // Set expiration: 24h for verification, 1h for password reset
  const expiresHours = type === 'email_verification' ? 24 : 1;
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
  
  // Delete any existing tokens for this email and type
  await prisma.emailToken.deleteMany({
    where: { email, type }
  });
  
  // Create new token
  await prisma.emailToken.create({
    data: {
      email,
      token,
      code,
      type,
      expiresAt,
    }
  });
  
  return { token, code };
}

export async function verifyEmailToken(token: string, type: 'email_verification' | 'password_reset'): Promise<{ valid: boolean; email?: string; error?: string }> {
  const emailToken = await prisma.emailToken.findFirst({
    where: {
      token,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!emailToken) {
    return { valid: false, error: 'Token invalide ou expiré' };
  }
  
  // Mark as used
  await prisma.emailToken.update({
    where: { id: emailToken.id },
    data: { used: true, usedAt: new Date() }
  });
  
  return { valid: true, email: emailToken.email };
}

export async function verifyEmailCode(code: string, email: string, type: 'email_verification' | 'password_reset'): Promise<{ valid: boolean; error?: string }> {
  const emailToken = await prisma.emailToken.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: { gt: new Date() }
    }
  });
  
  if (!emailToken) {
    return { valid: false, error: 'Code invalide ou expiré' };
  }
  
  // Mark as used
  await prisma.emailToken.update({
    where: { id: emailToken.id },
    data: { used: true, usedAt: new Date() }
  });
  
  return { valid: true };
}
