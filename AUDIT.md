# Audit Complet — LollyPOS / Luxya-POS / LollyShop
**Date :** 2026-03-16
**Auditeur :** Claude (claude-sonnet-4-6)
**Branche :** `claude/complete-audit-xYsso`

---

## 1. Structure du Projet

```
lollypos/
├── backend/          NestJS API (port 3005)
├── luxya-pos/        Next.js 16 — App POS interne (admin.lolly.sn)
├── lollyshop/        Next.js — E-commerce public (shop.lolly.sn)
└── supabase/
    └── migrations/   17 migrations SQL
```

**Stack :**
- Backend : NestJS 11, Supabase (anon + service-role), Google Gemini AI, Google Calendar API
- Frontend POS : Next.js 16 + React 19, Tailwind v4, @supabase/ssr
- Frontend Shop : Next.js, Supabase, Stripe (présumé via API orders)
- DB : Supabase (PostgreSQL) avec RLS

---

## 2. Points Positifs ✅

| # | Élément | Détail |
|---|---------|--------|
| 1 | **Validation DTOs** | `class-validator` + `whitelist: true` + `forbidNonWhitelisted: true` sur tous les DTOs. Bonne couverture. |
| 2 | **Rate limiting** | `ThrottlerModule` global (60 req/min), sur `/auth/log-connection` : 5 req/min |
| 3 | **RLS Supabase** | Activé sur toutes les tables critiques avec isolation par `shop_id` |
| 4 | **AuthGuard global** | `APP_GUARD` → toutes les routes protégées par défaut via token JWT Supabase |
| 5 | **CORS strict** | Whitelist explicite des origines + vérification dynamique |
| 6 | **Retry intelligent** | `safeFetch` côté frontend avec backoff exponentiel (3 tentatives) |
| 7 | **Validation couleurs** | Regex `colorPattern` pour prévenir JSON injection dans les variantes |
| 8 | **Sessions IA bornées** | TTL 30 min + cap à 50 sessions simultanées → pas de fuite mémoire |
| 9 | **Helmet installé** | `helmet` présent dans `package.json` |
| 10 | **Embeddings RAG** | Génération d'embeddings 1536-dim à la création/mise à jour produit |

---

## 3. Problèmes de Sécurité 🔴

### 3.1 CRITIQUE — Helmet non activé
**Fichier :** `backend/src/main.ts`
**Problème :** `helmet` est dans `package.json` mais **n'est pas appelé** dans `bootstrap()`. Sans helmet, les headers de sécurité HTTP (CSP, X-Frame-Options, X-Content-Type-Options, etc.) sont absents.

```typescript
// MANQUANT dans main.ts :
import helmet from 'helmet';
app.use(helmet());
```

**Risque :** Clickjacking, MIME sniffing, information disclosure via headers par défaut.

---

### 3.2 CRITIQUE — Architecture Backend bypasse entièrement la RLS Supabase
**Fichiers :** `backend/src/products/products.service.ts:18`, `backend/src/sales/sales.service.ts:13`, `backend/src/expenses/expenses.service.ts:19`, `backend/src/analytics/analytics.service.ts:9`

**Problème :** Tous les services utilisent `getAdminClient()` (service-role key), qui **ignore complètement les Row Level Security policies**. Un utilisateur authentifié peut donc potentiellement accéder à des données d'un autre shop si l'endpoint ne filtre pas correctement par `shop_id`.

**Exemple concret :**
```typescript
// products.service.ts — findAll() sans shopId → retourne TOUS les produits de TOUS les shops
async findAll(shopId?: number) {
    let query = this.supabase.from('products').select('*,...');
    if (shopId) query = query.eq('shop_id', shopId);
    // Si shopId non fourni → fuite cross-tenant
}
```

**Risque :** Fuite de données entre boutiques (violation de confidentialité, cross-tenant data leak).

**Recommandation :** Rendre `shopId` obligatoire côté backend OU utiliser le client Supabase scopé (anon key + token utilisateur) pour bénéficier de la RLS.

---

### 3.3 HAUTE — `/calendar/callback` sans authentification
**Fichier :** `backend/src/calendar/calendar.controller.ts:12`

```typescript
@Post('callback')
async handleCallback(@Body('code') code: string, @Body('userId') userId: string) {
    return this.calendarService.handleCallback(code, userId);
}
```

**Problème :** Cet endpoint est protégé par le `AuthGuard` global (APP_GUARD), mais `userId` provient du **corps de la requête** et non de `req.user.id`. Un attaquant peut envoyer l'`userId` de n'importe quel autre utilisateur et lier le token Google Calendar à son compte.

**Risque :** Usurpation d'identité lors de la liaison Google Calendar.

**Correction :**
```typescript
@Post('callback')
async handleCallback(@Body('code') code: string, @Req() req) {
    return this.calendarService.handleCallback(code, req.user.id); // userId depuis le JWT
}
```

---

### 3.4 HAUTE — Auth endpoint log-connection non sécurisé
**Fichier :** `backend/src/auth/auth.controller.ts`

```typescript
@Public()
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('log-connection')
async log(@Body() body: { userId: string, email: string, device: string, ip: string }) {
    return this.authService.logConnection(body.userId, body.email, body.device, body.ip);
}
```

**Problème :** Endpoint public qui écrit dans `connection_logs`. Aucune validation de l'ownership : n'importe qui peut injecter des faux logs avec un `userId` arbitraire. `ip` provient du corps, non de `request.ip`.

**Risque :** Pollution des logs d'audit, impossibilité de fiabiliser les traces de connexion.

---

### 3.5 HAUTE — Données financières sensibles dans le prompt système IA
**Fichier :** `backend/src/ai/ai.service.ts:89-103`

**Problème :** Le bilan financier complet (CA, dettes, marges, charges direction) est injecté en clair dans le prompt envoyé à l'API Google Gemini. Ces données quittent l'infrastructure et sont traitées par un tiers.

**Risque :** Fuite de données financières confidentielles vers Google. Potentiel problème de conformité RGPD/données d'entreprise.

---

### 3.6 MOYENNE — `dangerouslySetInnerHTML` avec JSON.stringify non sanitisé
**Fichier :** `lollyshop/app/layout.tsx`

```tsx
dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
```

**Analyse :** `JSON.stringify` échappe correctement les guillemets et slashs, mais si `jsonLd` contient des données utilisateur non nettoyées (ex : nom de produit avec `</script>`), cela peut causer une injection XSS. À vérifier selon la source de `jsonLd`.

---

### 3.7 MOYENNE — `alert()` en production (debug non retiré)
**Fichier :** `luxya-pos/app/calendar/page.tsx:52`

```typescript
alert("Tentative de liaison lancée...");
```

**Problème :** Debug artifact en production. Bloque l'UI et révèle des détails d'implémentation internes.

---

### 3.6 CRITIQUE — SSRF via Webhook Proxy non sécurisé
**Fichier :** `luxya-pos/app/api/webhook-proxy/route.ts:5-16`

```typescript
const { webhookUrl, payload } = body
if (!webhookUrl) { return ... }
const response = await fetch(webhookUrl, { method: 'POST', ... })
```

**Problème :** Aucune validation de `webhookUrl`. N'importe quel utilisateur authentifié peut faire pointer ce proxy vers une URL arbitraire, y compris des IPs internes (`http://169.254.169.254`, `http://localhost`, services internes).

**Risque :** Server-Side Request Forgery (SSRF) — accès aux métadonnées cloud, services internes, exfiltration de données.

**Correction :** Valider que `webhookUrl` appartient à un domaine whitelist (ex : `*.n8n.cloud`, domaine n8n propre).

---

### 3.7 HAUTE — `createAdminClient()` dans Next.js (service-role en frontend)
**Fichier :** `lollyshop/utils/supabase/server.ts:29-42`

```typescript
export const createAdminClient = async () => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // clé admin dans du code Next.js
        ...
    );
};
```

**Problème :** La `SUPABASE_SERVICE_ROLE_KEY` est utilisée côté Next.js server. Si des API routes l'utilisent pour des opérations admin, toute faille dans ces routes expose la clé de service (qui bypass la RLS). Elle n'est pas exposée au client, mais le surface d'attaque est plus large qu'avec la RLS.

**Recommandation :** Supprimer `createAdminClient()` des apps Next.js, relayer les opérations admin uniquement via le backend NestJS.

---

### 3.8 HAUTE — Aucune validation du corps sur les routes admin lollyshop
**Fichier :** `lollyshop/app/api/admin/products/route.ts`

```typescript
const { id, ...updates } = await req.json();
await supabaseAdmin.from('products').update(updates).eq('id', id);
```

**Problème :** Les champs envoyés dans `updates` ne sont pas filtrés ni validés. Un admin peut écrire n'importe quelle colonne (y compris `shop_id`, `embedding`, `is_featured`) sans contrôle.

---

## 4. Problèmes de Qualité de Code 🟡

### 4.0 Méthodes stub jamais implémentées dans l'IA
**Fichier :** `backend/src/ai/ai.service.ts:193,210`

```typescript
async generatePromoBanner() { return { slogan: "OFFRES EXCLUSIVES ✨" }; }
async suggestProductPhoto(p: string) { return { urls: [] }; }
```

Des endpoints (`POST /ai/generate-banner`, `POST /ai/suggest-photo`) existent et sont exposés mais retournent des valeurs hardcodées. Trompeur pour le frontend.

---

### 4.1 Module Inventory vide
**Fichiers :** `backend/src/inventory/inventory.controller.ts`, `backend/src/inventory/inventory.service.ts`

```typescript
// inventory.controller.ts
@Controller('inventory') export class InventoryController {}

// inventory.service.ts
@Injectable() export class InventoryService {}
```

Le module est déclaré mais complètement vide. La logique d'inventaire est dispersée dans `products.service.ts`. À consolider ou supprimer.

---

### 4.2 `findOne()` dans SalesService non implémenté
**Fichier :** `backend/src/sales/sales.service.ts:77`

```typescript
findOne(id: number) {
    return `This action returns a #${id} sale`; // Placeholder jamais implémenté
}
```

Retourne un string hardcodé. Si un endpoint l'appelle, il obtiendra une chaîne au lieu d'un objet.

---

### 4.3 `(this.supabaseService as any).getAdminClient()` — cast type non sécurisé
**Plusieurs fichiers :** `products.service.ts`, `sales.service.ts`, `expenses.service.ts`, `analytics.service.ts`

Le cast `as any` pour appeler `getAdminClient()` est un anti-pattern. `getAdminClient()` est une méthode publique de `SupabaseService` — aucune raison de caster.

---

### 4.4 `update()` dans SalesService accepte `any` au lieu d'un DTO typé
**Fichier :** `backend/src/sales/sales.service.ts:82`

```typescript
async update(id: string, updateSaleDto: any) { // 'any' → pas de validation
```

Le controller passe `UpdateSaleDto` mais le service accepte `any`, contournant toute validation.

---

### 4.5 Duplication de logique analytique
**Fichier :** `backend/src/analytics/analytics.service.ts`

La logique de calcul des coûts récurrents (déduplication, calcul par fréquence, BFR) est dupliquée à l'identique entre `getAnalytics()` et `getHistory()`. Environ 40 lignes copiées-collées.

---

### 4.6 `console.log` restants dans le code de production
**Fichiers :**
- `luxya-pos/app/calendar/page.tsx:53,56`
- `luxya-pos/app/inventory/actions.ts:347,359`
- `luxya-pos/context/UserContext.tsx:41,47`

Ces logs sont acceptables en dev mais révèlent des URLs internes et des détails d'implémentation dans la console du navigateur en production.

---

### 4.7 `getForecast()` — bug silencieux dans la requête conditionnelle
**Fichier :** `backend/src/ai/ai.service.ts:130`

```typescript
.eq(shopId ? 'shop_id' : '', shopId || '')
```

Quand `shopId` est undefined, cela produit `.eq('', '')` — filtre invalide qui peut retourner des résultats inattendus ou une erreur silencieuse absorbée par le catch.

---

### 4.8 Fichiers DTO dupliqués sans extension
**Fichiers :**
- `backend/src/expenses/dto/create-expense.dto` (sans `.ts`)
- `backend/src/expenses/dto/update-expense.dto` (sans `.ts`)
- `backend/src/sales/dto/create-sale.dto` (sans `.ts`)
- `backend/src/sales/dto/update-sale.dto` (sans `.ts`)

Des fichiers sans extension `.ts` coexistent avec leurs versions `.ts`. Risque de confusion.

---

## 5. Problèmes de Performance 🟠

### 5.1 N+1 queries dans `bulkUpdateStock()`
**Fichier :** `backend/src/products/products.service.ts:203`

```typescript
for (const update of updates) {
    await this.supabase.from('products').update(...).eq('id', update.id);
}
```

Une requête DB par produit. Pour 100 produits → 100 requêtes séquentielles. À remplacer par un `upsert` en batch.

---

### 5.2 N+1 queries dans `updateColor()` et `deleteColor()`
**Fichier :** `backend/src/products/products.service.ts:147,175`

Même pattern : fetch all → loop update. Pour des catalogues importants, c'est bloquant.

---

### 5.3 Analytics charge toutes les données en mémoire
**Fichier :** `backend/src/analytics/analytics.service.ts`

`getAnalytics()` et `getHistory()` chargent **toutes** les ventes, dépenses et sale_items (sans pagination) pour les calculer en mémoire JS. Sur un volume important (>10 000 ventes), la mémoire et les performances vont dégrader.

**Recommandation :** Déplacer les agrégations en SQL (`GROUP BY`, `SUM`, window functions).

---

### 5.4 Embeddings en série dans `create()`
**Fichier :** `backend/src/products/products.service.ts:31`

La génération d'embedding bloque la création du produit (~200-500ms de latency externe). Pour `bulkCreate`, c'est en parallèle (bien), mais pour `create` individuel, c'est synchrone dans le chemin de la requête HTTP.

---

## 6. Tests 🔴

| Module | État |
|--------|------|
| `ai/ai.service.spec.ts` | Existe (contenu non vérifié) |
| `ai/ai.controller.spec.ts` | Existe |
| `auth/auth.service.spec.ts` | Existe |
| `auth/auth.controller.spec.ts` | Existe |
| `products/products.service.spec.ts` | Existe |
| `products/products.controller.spec.ts` | Existe |
| `sales/sales.service.spec.ts` | Existe |
| `sales/sales.controller.spec.ts` | Existe |
| `inventory/inventory.service.spec.ts` | Existe |
| `inventory/inventory.controller.spec.ts` | Trivial (juste `isDefined`) |
| `expenses` | **Aucun spec** |
| `analytics` | **Aucun spec** |
| `calendar` | **Aucun spec** |
| Frontend (luxya-pos) | **Aucun test** |
| Frontend (lollyshop) | **Aucun test** |

Les specs existantes semblent être les squelettes générés par NestJS CLI — leur couverture réelle est à vérifier.

---

## 7. Configuration & DevOps ⚙️

### 7.1 Variables d'environnement requises non documentées
Aucun `.env.example` trouvé dans le projet. Les variables requises sont :

**Backend :**
- `SUPABASE_URL`
- `SUPABASE_KEY` (anon)
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ critique
- `GOOGLE_GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `PORT`

**Frontend (luxya-pos) :**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 7.2 CORS trop permissif sur Vercel/Render
**Fichier :** `backend/src/main.ts:16-19`

```typescript
const isVercel = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
const isRender = origin && (origin.endsWith('.onrender.com'));
```

Tout sous-domaine Vercel ou Render est autorisé. N'importe quel projet Vercel/Render déployé par n'importe qui peut appeler l'API.

### 7.3 Fichiers de test/debug à la racine
- `test-ai.mjs`
- `test-live-ai.mjs`
- `test_ai.json`
- `convert_to_avif.js`

Scripts de dev à la racine du repo — à déplacer dans un dossier `scripts/` ou `.gitignore`.

---

## 8. Récapitulatif des Priorités

| Priorité | Problème | Effort |
|----------|----------|--------|
| 🔴 P0 | Activer Helmet dans `main.ts` | 2 min |
| 🔴 P0 | Corriger `calendar/callback` → utiliser `req.user.id` | 5 min |
| 🔴 P0 | **SSRF** : valider `webhookUrl` dans `webhook-proxy/route.ts` | 15 min |
| 🔴 P1 | Implémenter isolation shop dans les services (ne pas retourner tous les shops sans auth) | Moyen |
| 🔴 P1 | Supprimer `alert()` de `calendar/page.tsx` | 1 min |
| 🔴 P1 | Filtrer les champs dans les routes admin lollyshop (`products`, `orders`) | 30 min |
| 🟡 P2 | Supprimer `createAdminClient()` des apps Next.js ou restreindre son usage | Moyen |
| 🟡 P2 | Typer `updateSaleDto: UpdateSaleDto` (pas `any`) | 5 min |
| 🟡 P2 | Implémenter `findOne()` dans SalesService | 15 min |
| 🟡 P2 | Corriger le bug `.eq('', '')` dans `getForecast()` | 5 min |
| 🟡 P2 | Supprimer les fichiers DTO sans extension `.ts` | 2 min |
| 🟡 P2 | Enlever les `console.log` de production | 10 min |
| 🟡 P2 | Implémenter ou supprimer les méthodes stub IA | 30 min |
| 🟠 P3 | Remplacer N+1 par batch dans `bulkUpdateStock` | 1h |
| 🟠 P3 | Déplacer agrégations analytics en SQL | 2-4h |
| 🟠 P3 | Créer `.env.example` | 15 min |
| 🟠 P3 | Restreindre CORS Vercel/Render | 15 min |
| ⚪ P4 | Tests pour `expenses`, `analytics`, `calendar` | 4-8h |
| ⚪ P4 | Consolider ou supprimer le module `inventory` vide | 30 min |
| ⚪ P4 | Déplacer scripts de dev hors de la racine | 5 min |

---

*Fin de l'audit — 16 mars 2026*
