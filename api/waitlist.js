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

  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  // Store in Supabase
  const { error } = await supabase
    .from('waitlist')
    .insert({ email, signed_up_at: new Date().toISOString() });

  if (error && error.code !== '23505') { // ignore duplicate email errors
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save' });
  }

  // Email notification
  try {
    await resend.emails.send({
      from: 'Zyflow <noreply@zyflow.eu>',
      to: process.env.NOTIFICATION_EMAIL,
      subject: '🚀 New Waitlist Signup',
      html: `<p>New waitlist signup:</p><p><strong>${email}</strong></p>`,
    });
  } catch (emailError) {
    console.error('Email error:', emailError);
    // Don't fail the request if email fails
  }

  return res.status(200).json({ success: true });
};
