import { MetadataRoute } from 'next'
import { API_URL } from '@/utils/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://lolly.sn'

  // Fetch products to include them in sitemap if possible
  // Even if we use modals, listing them helps search engines discover them
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/products`)
    if (res.ok) {
        const products = await res.json()
        productEntries = products
            .filter((p: any) => p.show_on_website !== false)
            .map((p: any) => ({
                url: `${baseUrl}/?product=${p.id}`, // We can use query params as pseudo-URLs
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.7,
            }))
    }
  } catch (e) {
    console.error("Sitemap product fetch failed", e)
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...productEntries
  ]
}
