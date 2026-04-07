import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name     = (formData.get('name')    as string)?.trim()
    const email    = (formData.get('email')   as string)?.trim()
    const subject  = (formData.get('subject') as string)?.trim()
    const message  = (formData.get('message') as string)?.trim()
    const file     = formData.get('screenshot') as File | null

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    // Pull logged-in user info server-side if available
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userLine = user
      ? `Logged-in user: ${user.email} (id: ${user.id})`
      : 'Not logged in'

    // Handle optional screenshot attachment
    const attachments: { filename: string; content: Buffer }[] = []
    if (file && file.size > 0) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'Screenshot must be under 5 MB.' }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      attachments.push({ filename: file.name, content: buffer })
    }

    const { error } = await resend.emails.send({
      from: 'Recipe Multiplier <noreply-recipemultiplier@celiaho.com>',
      to: 'recipemultiplier@celiaho.com',
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        userLine,
        '',
        message,
      ].join('\n'),
      ...(attachments.length > 0 && { attachments }),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact route error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
