'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/utils/supabase'
import { createClient } from '@/utils/supabase/server'
import { API_URL } from '@/utils/api'

export async function createProduct(formData: FormData) {
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) return { error: 'Non authentifié' }

    // Fetch user profile to check restrictions
    const { data: profile } = await supabaseServer
        .from('profiles')
        .select('role, shop_id')
        .eq('id', user.id)
        .single()

    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price'))
    const cost_price = Number(formData.get('cost_price'))
    const promo_price = formData.get('promo_price') ? Number(formData.get('promo_price')) : null
    const stock = Number(formData.get('stock'))
    const min_stock = Number(formData.get('minStock')) || 2
    const category = formData.get('category') as string
    const type = (formData.get('type') as string) || 'product'
    const expiry_date = formData.get('expiry_date') as string | null
    const video_url = formData.get('video_url') as string | null
    const show_on_pos = formData.get('show_on_pos') === 'true'
    const show_on_website = formData.get('show_on_website') === 'true'
    const variants = formData.get('variants') ? JSON.parse(formData.get('variants') as string) : []

    // SECURITY: Force shopId from profile if restricted, otherwise take from form
    let shopId = Number(formData.get('shopId')) || 1
    if (profile?.shop_id) {
        shopId = profile.shop_id
    }

    const imageFile = formData.get('image') as File | null
    const aiImageUrl = formData.get('ai_image_url') as string | null
    const galleryFiles = formData.getAll('gallery') as File[]

    let imageUrl = aiImageUrl || ''
    let galleryUrls: string[] = []

    // Handle Main Image Upload (overrides AI suggestion if user picked a file)
    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).slice(2, 11)}_${Date.now()}.${fileExt}`
        const { data, error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile)

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
            imageUrl = publicUrl
        }
    }

    // Handle Gallery Uploads
    for (const file of galleryFiles) {
        if (file && file.size > 0 && typeof file !== 'string') {
            const fileExt = file.name.split('.').pop()
            const fileName = `gallery_${Math.random().toString(36).slice(2, 11)}_${Date.now()}.${fileExt}`
            const { data, error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, file)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                galleryUrls.push(publicUrl)
            }
        }
    }

    const rawData: any = {
        name,
        brand,
        description,
        price,
        cost_price,
        promo_price,
        stock,
        min_stock,
        category,
        shop_id: shopId,
        created_by: user.id,
        image: imageUrl || (galleryUrls.length > 0 ? galleryUrls[0] : ''),
        images: galleryUrls,
        type,
        expiry_date: expiry_date || null,
        video_url,
        show_on_pos,
        show_on_website,
        variants,
    }

    // Handle Variant Images Upload
    const parsedVariants = [...variants]
    for (let i = 0; i < parsedVariants.length; i++) {
        const variant = parsedVariants[i]
        const vFile = formData.get(`variant_image_${variant.id}`) as File | null

        if (vFile && vFile.size > 0 && typeof vFile !== 'string') {
            const fileExt = vFile.name.split('.').pop()
            const fileName = `variant_${variant.id}_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, vFile)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                parsedVariants[i].image = publicUrl
            }
        }
    }
    rawData.variants = parsedVariants

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rawData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            return { error: errorData.message || 'Failed to create product' }
        }

        revalidatePath('/inventory')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to connect to backend' }
    }
}

export async function updateProduct(productId: number, formData: FormData) {
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const description = formData.get('description') as string
    const price = Number(formData.get('price'))
    const cost_price = Number(formData.get('cost_price'))
    const promo_price = formData.get('promo_price') ? Number(formData.get('promo_price')) : null
    const stock = Number(formData.get('stock'))
    const min_stock = Number(formData.get('minStock')) || 2
    const category = formData.get('category') as string
    const type = (formData.get('type') as string) || 'product'
    const expiry_date = formData.get('expiry_date') as string | null
    const video_url = formData.get('video_url') as string | null
    const show_on_pos = formData.get('show_on_pos') === 'true'
    const show_on_website = formData.get('show_on_website') === 'true'
    const variants = formData.get('variants') ? JSON.parse(formData.get('variants') as string) : []
    const imageFile = formData.get('image') as File | null
    const aiImageUrl = formData.get('ai_image_url') as string | null
    const galleryFiles = formData.getAll('gallery') as File[]
    const currentImageUrl = formData.get('currentImageUrl') as string
    const existingGallery = formData.get('existingGallery') ? JSON.parse(formData.get('existingGallery') as string) : []

    let imageUrl = aiImageUrl || currentImageUrl || ''
    let galleryUrls: string[] = [...existingGallery]

    // Handle Main Image Upload
    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).slice(2, 11)}_${Date.now()}.${fileExt}`
        const { data, error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, imageFile)

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
            imageUrl = publicUrl
        }
    }

    // Handle New Gallery Uploads
    for (const file of galleryFiles) {
        if (file && file.size > 0 && typeof file !== 'string') {
            const fileExt = file.name.split('.').pop()
            const fileName = `gallery_${Math.random().toString(36).slice(2, 11)}_${Date.now()}.${fileExt}`
            const { data, error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, file)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                galleryUrls.push(publicUrl)
            }
        }
    }

    const updateData: any = {
        name,
        brand,
        description,
        price,
        cost_price,
        promo_price,
        stock,
        min_stock,
        category,
        image: imageUrl,
        images: galleryUrls,
        type,
        expiry_date: expiry_date || null,
        video_url,
        show_on_pos,
        show_on_website,
        variants,
        is_featured: formData.get('is_featured') === 'true'
    }

    // Handle Variant Images Upload
    const parsedVariants = [...variants]
    for (let i = 0; i < parsedVariants.length; i++) {
        const variant = parsedVariants[i]
        const vFile = formData.get(`variant_image_${variant.id}`) as File | null

        if (vFile && vFile.size > 0 && typeof vFile !== 'string') {
            const fileExt = vFile.name.split('.').pop()
            const fileName = `variant_${variant.id}_${Date.now()}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, vFile)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                parsedVariants[i].image = publicUrl
            }
        }
    }
    updateData.variants = parsedVariants

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        })

        if (!response.ok) return { error: 'Erreur lors de la mise à jour' }

        revalidatePath('/inventory')
        return { success: true }
    } catch (error) {
        return { error: 'Erreur de connexion' }
    }
}

export async function bulkCreateProducts(products: any[]) {
    const supabaseServer = await createClient()
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: profile } = await supabaseServer
        .from('profiles')
        .select('role, shop_id')
        .eq('id', user.id)
        .single()

    const productsWithMeta = products.map(p => ({
        ...p,
        shop_id: profile?.shop_id || p.shop_id || 1,
        created_by: user.id
    }))

    try {
        console.log(`[BULK] Attempting bulk creation of ${products.length} products on ${API_URL}`);
        const response = await fetch(`${API_URL}/products/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productsWithMeta),
        })

        if (response.ok) {
            revalidatePath('/inventory')
            return { success: true }
        }

        // FALLBACK: If bulk fails (e.g. 404 not deployed, or 504 timeout), try one by one
        console.warn(`[BULK] Bulk endpoint failed (${response.status}). Falling back to individual creation.`);

        let successCount = 0;
        let errors = [];

        for (const product of productsWithMeta) {
            try {
                const singleRes = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product),
                });
                if (singleRes.ok) successCount++;
                else {
                    const errData = await singleRes.json().catch(() => ({}));
                    errors.push(`${product.name}: ${errData.message || 'Error'}`);
                }
            } catch (e) {
                errors.push(`${product.name}: Connection error`);
            }
        }

        if (successCount > 0) {
            revalidatePath('/inventory')
            return {
                success: true,
                message: `${successCount} produits importés. ${errors.length > 0 ? `(${errors.length} échecs)` : ''}`
            }
        }

        return { error: errors[0] || 'Échec de l\'importation' }
    } catch (error) {
        console.error('[BULK] Connection error:', error);
        return { error: 'Erreur de connexion au serveur Render' }
    }
}
