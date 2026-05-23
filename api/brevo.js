const BREVO_SMTP_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendBrevoEmail({ to, subject, html }) {
  const brevoKey = process.env.BREVO_API_KEY;
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || 'noreply@zyflow.eu').trim();

  const res = await fetch(BREVO_SMTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': brevoKey,
    },
    body: JSON.stringify({
      sender: { name: 'Zyflow', email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo ${res.status}: ${errText}`);
  }
}

module.exports = { sendBrevoEmail };
