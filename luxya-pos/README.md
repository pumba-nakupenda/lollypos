# LOLLY POS admin

Interface admin/POS Next.js pour la gestion des ventes, produits, depenses, calendrier, analytics et caisse.

## Environnement

```bash
cp .env.example .env.local
```

Variables principales : Supabase public URL/anon key, service-role key pour routes serveur admin, URL backend, URL site, numero WhatsApp.

## Commandes

```bash
npm install
npm run dev -- -p 3000
npm run build
npm run lint
```

URL locale conseillee : `http://localhost:3000`.

## Notes multi-shop

Le front admin doit transmettre le `shopId` actif au backend. Les verifications d'autorisation restent cote backend via `assertShopAccess`; ne pas considerer un filtre UI comme une barriere de securite.
