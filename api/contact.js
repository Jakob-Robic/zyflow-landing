const { createClient } = require('@supabase/supabase-js');
const { sendBrevoEmail } = require('./brevo');

if (!process.env.SUPABASE_URL) console.error('Missing SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_KEY) console.error('Missing SUPABASE_SERVICE_KEY');
if (!process.env.BREVO_API_KEY) console.error('Missing BREVO_API_KEY');
if (!process.env.NOTIFICATION_EMAIL) console.error('Missing NOTIFICATION_EMAIL');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    console.error('Contact API: method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, subject, email, message } = req.body || {};

    if (!name || !email || !message) {
      console.error('Contact API: validation failed — missing fields:', {
        name: !!name,
        email: !!email,
        message: !!message,
      });
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

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
      console.error('Contact API: Supabase insert failed:', error);
      return res.status(500).json({ error: 'Failed to save' });
    }

    if (!process.env.NOTIFICATION_EMAIL) {
      console.error('Contact API: skipping email — NOTIFICATION_EMAIL not set');
    } else if (!process.env.BREVO_API_KEY) {
      console.error('Contact API: skipping email — BREVO_API_KEY not set');
    } else {
      try {
        await sendBrevoEmail({
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
        console.error('Contact API: Brevo send failed:', emailError);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact API: unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
