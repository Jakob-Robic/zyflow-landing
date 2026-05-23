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
    console.error('Waitlist API: method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};

    if (!email || !email.includes('@')) {
      console.error('Waitlist API: validation failed — invalid email:', email);
      return res.status(400).json({ error: 'Valid email required' });
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email, signed_up_at: new Date().toISOString() });

    if (error && error.code !== '23505') {
      console.error('Waitlist API: Supabase insert failed:', error);
      return res.status(500).json({ error: 'Failed to save' });
    }

    if (!process.env.NOTIFICATION_EMAIL) {
      console.error('Waitlist API: skipping email — NOTIFICATION_EMAIL not set');
    } else if (!process.env.BREVO_API_KEY) {
      console.error('Waitlist API: skipping email — BREVO_API_KEY not set');
    } else {
      try {
        await sendBrevoEmail({
          to: process.env.NOTIFICATION_EMAIL,
          subject: '🚀 New Waitlist Signup',
          html: `<p>New waitlist signup:</p><p><strong>${email}</strong></p>`,
        });
      } catch (emailError) {
        console.error('Waitlist API: Brevo send failed:', emailError);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Waitlist API: unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
