# Production Deployment & Cloud Integration Guide

## 1. Production Architecture Overview

In production, the application transitions from local SQLite to a scalable cloud architecture with:
- **Frontend**: Hosted on Vercel, Netlify, or AWS CloudFront (static single-page application).
- **Backend API**: Containerized FastAPI service hosted on Render, Railway, AWS ECS, or Google Cloud Run.
- **Production Database**: Supabase PostgreSQL with connection pooling (PgBouncer) or AWS RDS PostgreSQL.
- **Authentication**: Supabase Auth or secure stateless JWT with rotated secrets.

## 2. Supabase Integration Checklist

1. Create a Supabase project at `https://supabase.com`.
2. Retrieve project connection parameters from **Project Settings -> Database**:
   - Connection string (URI)
   - Project URL (`https://xyz.supabase.co`)
   - Anon public key and Service Role key
3. Configure environment variables in production:
   ```env
   APP_ENV=production
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   SUPABASE_URL=https://xyz.supabase.co
   SUPABASE_KEY=[ANON_KEY]
   JWT_SECRET=[SECURE_RANDOM_256_BIT_SECRET]
   ```
4. Execute initial table migrations:
   SQLAlchemy automatically handles schema creation on application boot when connected to PostgreSQL.

## 3. Production Environment Variables Reference

| Variable | Required | Production Value / Description |
| :--- | :---: | :--- |
| `APP_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection URI |
| `JWT_SECRET` | Yes | Cryptographically random string (min 32 chars) |
| `SUPABASE_URL` | Optional | Supabase project URL |
| `SUPABASE_KEY` | Optional | Supabase service/anon key |
| `OPENAI_API_KEY`| Optional | Secret API key for OpenAI GPT models |
| `SMTP_SERVER` | Optional | Institutional SMTP hostname (e.g. smtp.sendgrid.net) |
| `SMTP_PORT` | Optional | 587 or 465 |
| `SMTP_USERNAME` | Optional | SMTP authentication username |
| `SMTP_PASSWORD` | Optional | SMTP authentication password |
