import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { code, cartTotal } = await req.json();

        if (!code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

        const formattedCode = code.toUpperCase();

        // 1. Check in normal coupons
        const { data: coupon } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', formattedCode)
            .eq('is_active', true)
            .maybeSingle();

        if (coupon) {
            if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
                return NextResponse.json({ error: 'Ce code a expiré' }, { status: 400 });
            }
            if (cartTotal < coupon.min_purchase) {
                return NextResponse.json({ error: `Minimum requis : ${coupon.min_purchase} CFA` }, { status: 400 });
            }
            if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
                return NextResponse.json({ error: 'Code épuisé' }, { status: 400 });
            }

            return NextResponse.json({
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            });
        }

        // 2. Check in referral codes (Profiles)
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, referral_code')
            .eq('referral_code', formattedCode)
            .maybeSingle();

        if (profile) {
            return NextResponse.json({
                id: profile.id,
                code: profile.referral_code,
                discount_type: 'percentage',
                discount_value: 10, // 10% off for using a referral code
                is_referral: true
            });
        }

        return NextResponse.json({ error: 'Code promo ou parrainage invalide' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
