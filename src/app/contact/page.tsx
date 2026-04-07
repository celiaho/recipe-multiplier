import { createClient } from '@/lib/supabase/server'
import { ContactForm } from './ContactForm'
import { Navbar } from '@/components/Navbar'

export const metadata = { title: 'Contact—Recipe Multiplier' }

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prefill = { name: '', email: '' }
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    prefill = { name: fullName, email: user.email ?? '' }
  }

  return (
    <>
      <Navbar />
      <ContactForm prefillName={prefill.name} prefillEmail={prefill.email} />
    </>
  )
}
