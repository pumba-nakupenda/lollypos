# LOLLY Shop e-commerce

Front e-commerce Next.js multi-shops pour LOLLYSHOP, LUXYA, HOMETEK et futurs univers.

## Environnement

```bash
cp .env.example .env.local
```

Variables principales : Supabase public URL/anon key, service-role key pour routes serveur admin, URL backend, URL site, et `SHOP_HOST_MAP` pour mapper des hostnames vers des slugs boutique.

## Commandes

```bash
npm install
npm run dev -- -p 3001
npm run build
npm run lint
```

URL locale conseillee : `http://localhost:3001`.

## Resolution boutique

Le helper `lib/resolve-shop.ts` resout la boutique par ordre de priorite :

1. query `shopId` ou `shop` ;
2. hostname / sous-domaine / `SHOP_HOST_MAP` ;
3. fallback explicite seulement quand il est fourni par le code appelant.

Eviter tout retour implicite vers `shop_id: 1`.
