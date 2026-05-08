import { Resend } from 'resend';

const NOTIFY_TO = process.env.RESEND_TO_EMAIL || 'sammy@mcmarketing.dk';
const FROM_RAW = process.env.RESEND_FROM_EMAIL || 'noreply@mcmarketing.dk';
const FROM_ADDRESS = FROM_RAW.includes('<') ? FROM_RAW : `McKenna Marketing <${FROM_RAW}>`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY env var is missing');
    return res.status(500).json({ error: 'Server misconfigured: RESEND_API_KEY missing' });
  }

  const { name, email, phone, business, website, topic, message, source } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Source:</strong> ${source || 'Website'}</p>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
    ${business ? `<p><strong>Business:</strong> ${business}</p>` : ''}
    ${website ? `<p><strong>Website:</strong> ${website}</p>` : ''}
    ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}
    ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
  `;

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: NOTIFY_TO,
      reply_to: email,
      subject: `New enquiry from ${name}`,
      html,
    });

    if (result.error) {
      console.error('[contact] Resend returned error:', JSON.stringify(result.error));
      return res.status(502).json({
        error: 'Email provider rejected the request',
        detail: result.error,
      });
    }

    console.log('[contact] Sent OK, id:', result.data?.id);
    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('[contact] Unexpected error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      detail: error?.message || String(error),
    });
  }
}
