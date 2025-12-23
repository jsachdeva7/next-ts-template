# Supabase Setup Guide

This guide walks you through setting up Supabase for this template, including
project creation, environment variables, database schema, and required
configuration.

---

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:

- **Authentication** - User management with email/password, OAuth, and more
- **Database** - PostgreSQL database with real-time subscriptions
- **Realtime** - WebSocket-based pub/sub for live updates
- **Storage** - File storage (not used in this template)

This template uses Supabase for:

- User authentication (email/password)
- User profile data storage
- Realtime channels for live features

---

## Environment Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Find these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Set Environment Variables

Create a `.env.local` file in your project root (or add to existing):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

**Important:**

- These are safe to expose in client code (they're public keys)
- Never commit `.env.local` to git (it should be in `.gitignore`)
- For production, set these in your hosting platform's environment variables

### 4. Verify Setup

Start your dev server:

```bash
pnpm dev
```

Check the console for any environment variable errors. The app should start
without Supabase connection errors (though auth won't work until tables are set
up).

---

## Database Tables and RLS Policies

This template requires one custom table for user profiles. Supabase Auth
provides the `auth.users` table automatically.

### Profiles Table

The `profiles` table stores additional user information linked to Supabase Auth
users.

#### Create the Table

Run this SQL in your Supabase SQL Editor (**SQL Editor** → **New Query**):

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
```

#### RLS Policies

Add these policies to secure the profiles table:

```sql
-- Policy: Users can view their own profile
create policy "profile: read own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Policy: Users can update their own profile
create policy "profile: update own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
```

#### Triggers

Run these in the SQL editor.

1. Unique email in `profiles` table

```sql
create unique index profiles_email_unique_not_null
on public.profiles (lower(email))
where email is not null;
```

2. Sync `profiles` table with `auth.users`

```sql
-- Trigger: Sync profiles table with auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(excluded.first_name, public.profiles.first_name),
        last_name  = coalesce(excluded.last_name,  public.profiles.last_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
```

## Supabase Settings Changes

### 1. Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (default: enabled)
3. Configure email templates if needed (under **Email Templates**)

### 2. Configure Redirect URLs

For local development:

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/**` (for local dev)
   - `http://localhost:3000/auth/callback` (if using OAuth)

For production, add your production domain:

- `https://yourdomain.com/**`
- `https://yourdomain.com/auth/callback`

### 3. Enable Realtime (if using realtime features)

1. Go to **Database** → **Replication**
2. For the `profiles` table (if you want database-backed realtime):
   - Toggle **Enable Replication** ON
   - This allows realtime subscriptions to table changes

**Note:** This template primarily uses channel-based realtime (not
database-backed), so this step is optional unless you plan to use database
replication.

### 4. Configure CORS (if needed)

If you're making direct API calls from the browser:

1. Go to **Settings** → **API**
2. Under **CORS**, add your frontend URL:
   - `http://localhost:3000` (for local dev)
   - `https://yourdomain.com` (for production)

**Note:** This template uses Next.js server-side clients, so CORS is typically
not needed unless you're using direct browser clients.

---

## Verification Checklist

After setup, verify everything works:

- [ ] Environment variables are set in `.env.local`
- [ ] `profiles` table exists with correct schema
- [ ] RLS policies are enabled and configured
- [ ] Email authentication is enabled in Supabase
- [ ] Redirect URLs are configured
- [ ] Dev server starts without Supabase errors
- [ ] Can sign up a new user
- [ ] Can sign in with existing user
- [ ] Profile data loads after sign-in
- [ ] Realtime features work (if using)

---

## Troubleshooting

### "Invalid API key" errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  are correct
- Check for extra spaces or quotes in `.env.local`
- Restart your dev server after changing env vars

### "Row Level Security policy violation"

- Verify RLS policies are created and enabled
- Check that `auth.uid()` matches the profile `id`
- Ensure user is authenticated (check `auth.users` table)

### "User not found" after sign-up

- Check if profile trigger is working (if using auto-create)
- Manually verify profile exists:
  `select * from public.profiles where id = '<user_id>'`
- Check browser console for errors during sign-up

### Realtime not connecting

- Verify Realtime is enabled in Supabase dashboard
- Check browser console for WebSocket errors
- Ensure user is authenticated (private channels require auth)
- Verify channel names match the naming convention (see `docs/realtime.md`)

---

## Next Steps

Once Supabase is set up:

1. Read `docs/auth.md` for authentication patterns
2. Read `docs/realtime.md` for realtime features
3. Start building features using the established patterns

For more Supabase documentation, see
[supabase.com/docs](https://supabase.com/docs).
