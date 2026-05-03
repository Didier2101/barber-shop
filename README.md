# BarberShop (kavvo.store)

Aplicacion de barberia construida con Next.js 15 + Supabase.

## Requisitos

- Node.js 20+
- Cuenta de Supabase
- Cuenta de GitHub
- Cuenta de Vercel
- Dominio en Hostinger (`kavvo.store`)

## Variables de entorno

1. Copia `.env.example` a `.env.local`.
2. Completa valores reales:

```bash
NEXT_PUBLIC_SITE_URL=https://kavvo.store
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de validacion

Antes de subir a GitHub:

```bash
npm run build
```

## Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **Add New Project** > selecciona el repo.
3. Framework detectado: **Next.js**.
4. En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SITE_URL=https://kavvo.store`
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
5. Deploy.

## Conectar dominio `kavvo.store` (Hostinger -> Vercel)

En Vercel > Project > **Settings** > **Domains**:

1. Agrega:
   - `kavvo.store`
   - `www.kavvo.store`
2. Vercel mostrara los DNS records requeridos.

En Hostinger (DNS Zone) crea/ajusta:

- `A` record:
  - Host: `@`
  - Value: `76.76.21.21`
- `CNAME` record:
  - Host: `www`
  - Value: `cname.vercel-dns.com`

Luego vuelve a Vercel y verifica dominio.

## SEO tecnico ya preparado

- Metadata global (`title template`, Open Graph, Twitter, canonical base).
- `robots.txt` dinamico en `src/app/robots.ts`.
- `sitemap.xml` dinamico en `src/app/sitemap.ts`.
- Estructura de encabezados cuidada por pagina (1 `h1` por vista).

## Checklist de salida a produccion

- [ ] Variables en Vercel configuradas para Production / Preview / Development.
- [ ] Build local sin errores (`npm run build`).
- [ ] Dominio validado en Vercel.
- [ ] HTTPS activo en `kavvo.store`.
- [ ] Prueba de rutas publicas: `/`, `/servicios`, `/barberos`, `/nosotros`, `/contacto`.
- [ ] Prueba de auth: `/login`, `/register`, `/dashboard`.
