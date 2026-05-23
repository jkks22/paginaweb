# CVwise — Setup Guide

## 1. Variables de entorno

Copia `.env.local.example` a `.env.local` y rellena los valores:

```bash
cp .env.local.example .env.local
```

### Supabase
1. Ve a [supabase.com](https://supabase.com) → New Project
2. En **Project Settings > API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Anthropic (Claude API)
1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Pégala en `ANTHROPIC_API_KEY`

---

## 2. Base de datos (Supabase)

En el dashboard de Supabase ve a **SQL Editor** y pega el contenido de `src/lib/supabase/schema.sql`.

### Storage bucket
En Supabase → **Storage** → New bucket:
- Name: `cvs`
- Public: `false`

Agrega esta política de RLS para el bucket:
```sql
CREATE POLICY "Users can upload own CVs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own CVs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 3. Auth (Google OAuth)

En Supabase → **Authentication > Providers > Google**:
1. Habilita Google
2. Ve a [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client ID
3. Authorized redirect URIs: `https://[tu-proyecto].supabase.co/auth/v1/callback`
4. Pega Client ID y Secret en Supabase

---

## 4. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 5. Deploy en Vercel

```bash
npm i -g vercel
vercel
```

O conecta el repo en [vercel.com](https://vercel.com) y agrega las variables de entorno en el dashboard de Vercel.

---

## 6. Dominio propio

1. Compra `cvwise.app` en Namecheap (~$12/año)
2. En Vercel → Project Settings → Domains → Add `cvwise.app`
3. Agrega los DNS records que Vercel te indique en Namecheap
4. SSL automático en ~5 minutos
