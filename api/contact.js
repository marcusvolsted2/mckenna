import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, business, website, message, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const notification = await resend.emails.send({
      from: 'McKenna Marketing <onboarding@resend.dev>',
      to: 'mcc@mcmarketing.dk',
      reply_to: email,
      subject: `New enquiry from ${name}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Source:</strong> ${source || 'Website'}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${business ? `<p><strong>Business:</strong> ${business}</p>` : ''}
        ${website ? `<p><strong>Website:</strong> ${website}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      `,
    });

    if (notification.error) {
      console.error('Notification email failed:', notification.error);
      return res.status(500).json({ error: 'Failed to send email', detail: notification.error });
    }

    try {
      await resend.emails.send({
        from: 'McKenna Marketing <onboarding@resend.dev>',
        to: email,
        subject: 'We received your message — McKenna Marketing',
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for reaching out! We've received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>McKenna Marketing</p>
        `,
      });
    } catch (confirmErr) {
      console.error('Confirmation email failed (non-blocking):', confirmErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
