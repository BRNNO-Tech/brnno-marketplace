'use server'

import { Resend } from 'resend'

export async function submitContactForm(formData: FormData) {
  // 1. Extract Data from FormData
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    interested_plan: formData.get('interested_plan') as string || null,
    message: formData.get('message') as string,
  }

  // 2. Validate essential fields
  if (!data.name || !data.email || !data.message) {
    throw new Error('Missing required fields')
  }

  // 3. Initialize Resend
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

  if (!resend) {
    console.error('RESEND_API_KEY not set.')
    return { success: false, error: 'Email service not configured' }
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const toEmail = process.env.CONTACT_EMAIL || 'support@brnno.com'

  try {
    const result = await resend.emails.send({
      from: `BRNNO Contact <${fromEmail}>`,
      to: toEmail,
      replyTo: data.email,
      subject: `New Contact Form - ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
        ${data.interested_plan ? `<p><strong>Interested in:</strong> ${data.interested_plan}</p>` : ''}
        <hr />
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `
    })

    if (result.error) {
      console.error('Resend API Error:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Server Action Error:', error)
    return { success: false, error: 'Internal server error' }
  }
}