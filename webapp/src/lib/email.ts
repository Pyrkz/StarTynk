// Email service for sending invitations
// This is a placeholder implementation - in production, you would use a service like SendGrid, Mailgun, etc.

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
      preview: options.text?.substring(0, 100) + '...',
    })
    return
  }

  // TODO: Implement actual email sending
  // Example with Nodemailer:
  // const transporter = nodemailer.createTransport({...})
  // await transporter.sendMail(options)
  
  // Example with SendGrid:
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // await sgMail.send({
  //   to: options.to,
  //   from: process.env.EMAIL_FROM,
  //   subject: options.subject,
  //   text: options.text,
  //   html: options.html,
  // })
}

export async function sendInvitationEmail(
  email: string,
  code: string,
  inviterName?: string,
  customMessage?: string
): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const loginUrl = `${appUrl}/login?invitation=${code}`

  const subject = 'Zaproszenie do systemu Startynk'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .code { background-color: #fff; padding: 15px; border: 2px dashed #4F46E5; text-align: center; margin: 20px 0; }
          .code strong { font-size: 24px; letter-spacing: 2px; color: #4F46E5; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Witamy w systemie Startynk!</h1>
          </div>
          <div class="content">
            <p>Cześć,</p>
            <p>${inviterName ? `${inviterName} zaprasza Cię` : 'Zostałeś zaproszony'} do dołączenia do systemu zarządzania Startynk.</p>
            
            ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
            
            <p>Aby utworzyć konto, użyj poniższego kodu zaproszenia podczas rejestracji:</p>
            
            <div class="code">
              <strong>${code}</strong>
            </div>
            
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Przejdź do rejestracji</a>
            </p>
            
            <p><small>Lub skopiuj ten link: ${loginUrl}</small></p>
            
            <p>Zaproszenie jest ważne przez 7 dni.</p>
            
            <p>Pozdrawiamy,<br>Zespół Startynk</p>
          </div>
          <div class="footer">
            <p>Ta wiadomość została wysłana automatycznie. Prosimy nie odpowiadać na tego e-maila.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Witamy w systemie Startynk!

${inviterName ? `${inviterName} zaprasza Cię` : 'Zostałeś zaproszony'} do dołączenia do systemu zarządzania Startynk.

${customMessage ? customMessage + '\n\n' : ''}

Aby utworzyć konto, użyj poniższego kodu zaproszenia podczas rejestracji:

${code}

Możesz też kliknąć w ten link: ${loginUrl}

Zaproszenie jest ważne przez 7 dni.

Pozdrawiamy,
Zespół Startynk
  `.trim()

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  const subject = 'Resetowanie hasła - Startynk'
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Resetowanie hasła</h1>
          </div>
          <div class="content">
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
            
            <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Resetuj hasło</a>
            </p>
            
            <p><small>Lub skopiuj ten link: ${resetUrl}</small></p>
            
            <p>Link jest ważny przez 1 godzinę.</p>
            
            <p>Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.</p>
            
            <p>Pozdrawiamy,<br>Zespół Startynk</p>
          </div>
          <div class="footer">
            <p>Ta wiadomość została wysłana automatycznie. Prosimy nie odpowiadać na tego e-maila.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Resetowanie hasła

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.

Kliknij w poniższy link, aby ustawić nowe hasło:
${resetUrl}

Link jest ważny przez 1 godzinę.

Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół Startynk
  `.trim()

  await sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}