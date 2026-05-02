# LOLLY POS backend

API NestJS du POS LOLLY. Elle centralise les operations privilegiees, notamment celles qui utilisent Supabase avec la cle service-role.

## Environnement

Copier l'exemple puis remplir les vraies valeurs localement :

```bash
cp .env.example .env
```

Variables principales : Supabase URL/anon key/service-role key, origines CORS, Google Calendar OAuth, Gemini API key.

## Commandes

```bash
npm install
npm run start:dev
npm run build
npm test
```

L'API ecoute par defaut sur `http://127.0.0.1:3005`.

## Securite multi-shop

- `SupabaseService.assertShopAccess(userId, shopId)` verifie qu'un utilisateur peut acceder a une boutique.
- `SupabaseService.assertGlobalShopAccess(userId)` reserve les vues globales au super admin.
- Les routes backend qui acceptent un `shopId` depuis query/body doivent appeler ces gardes avant le service metier.
- Helmet est active dans `src/main.ts`.

Tests cibles utiles :

```bash
npm test -- --runInBand src/supabase.service.spec.ts
npm test -- --runInBand src/products/products.controller.spec.ts src/sales/sales.controller.spec.ts src/expenses/expenses.controller.spec.ts
```
