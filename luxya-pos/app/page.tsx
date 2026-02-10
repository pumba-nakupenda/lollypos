import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardContent from '@/components/DashboardContent'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // ERP/POS Separation: Cashiers go straight to POS
  if (profile?.role === 'cashier') {
    redirect('/sales')
  }

  return <DashboardContent user={user} />
}
