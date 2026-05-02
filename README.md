# LOLLY POS

Monorepo applicatif pour le POS et l'e-commerce multi-shops LOLLY.

## Packages

| Dossier      | Role                                                   | Port local conseille |
| ------------ | ------------------------------------------------------ | -------------------- |
| `backend/`   | API NestJS, Supabase service-role, securite multi-shop | `3005`               |
| `luxya-pos/` | Interface admin/POS Next.js                            | `3000`               |
| `lollyshop/` | Front e-commerce Next.js multi-shops                   | `3001`               |

## Demarrage local rapide

1. Installer les dependances dans chaque package :

```bash
cd backend && npm install
cd ../luxya-pos && npm install
cd ../lollyshop && npm install
```

2. Creer les fichiers d'environnement depuis les exemples :

```bash
cp backend/.env.example backend/.env
cp luxya-pos/.env.example luxya-pos/.env.local
cp lollyshop/.env.example lollyshop/.env.local
```

3. Renseigner les vraies valeurs Supabase / Google / Gemini localement. Ne jamais commiter de secrets.

4. Lancer les services dans trois terminaux :

```bash
cd backend && npm run start:dev
cd luxya-pos && npm run dev -- -p 3000
cd lollyshop && npm run dev -- -p 3001
```

## Commandes de verification utiles

```bash
cd backend && npm run build
cd backend && npm test -- --runInBand src/supabase.service.spec.ts
cd backend && npm test -- --runInBand src/products/products.controller.spec.ts src/sales/sales.controller.spec.ts src/expenses/expenses.controller.spec.ts
cd luxya-pos && npm run build
cd lollyshop && npm run build
```

## Regle securite multi-shop

Le backend utilise parfois le client Supabase service-role. Toute route backend qui accepte un `shopId` client doit verifier l'acces applicatif avec `assertShopAccess(userId, shopId)` avant de lire ou modifier des donnees. La vue globale `shopId=all` est reservee au super admin via `assertGlobalShopAccess(userId)`.

Aucun merge main ni deploiement production sans validation OUDAMA explicite.
