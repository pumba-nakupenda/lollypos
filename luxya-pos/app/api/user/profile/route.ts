import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()

        if (profileError) {
            console.error('[API/Profile] DB Error:', profileError)
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        if (!profile) {
            return NextResponse.json(null)
        }

        return NextResponse.json(profile)
    } catch (err: any) {
        console.error('[API/Profile] Unexpected Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
