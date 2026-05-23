const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, subject, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  // Store in Supabase
  const { error } = await supabase
    .from('contact_submissions')
    .insert({
      name,
      subject: subject || '(no subject)',
      email,
      message,
      submitted_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save' });
  }

  // Email notification
  try {
    await resend.emails.send({
      from: 'Zyflow <noreply@zyflow.eu>',
      to: process.env.NOTIFICATION_EMAIL,
      subject: `📬 New Contact: ${subject || 'No subject'}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || '—'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });
  } catch (emailError) {
    console.error('Email error:', emailError);
  }

  return res.status(200).json({ success: true });
};
