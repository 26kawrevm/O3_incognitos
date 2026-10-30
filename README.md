# O3_incognitos — beginner setup guide

A React + Vite student community starter with Supabase authentication, profiles, events, clubs, club applications and a classmates directory. The UI includes demo content so you can preview the design, but real account and database features require Supabase setup.

## What you need
- A computer with internet access
- Node.js LTS installed: https://nodejs.org/
- A free Supabase project: https://supabase.com/
- A code editor such as VS Code: https://code.visualstudio.com/

## Step 1 — Open the project
1. Extract the ZIP.
2. Open the extracted `O3_incognitos` folder in VS Code.
3. In VS Code, choose Terminal → New Terminal.

## Step 2 — Install the app
Run:
```bash
npm install
```

## Step 3 — Create your Supabase database
1. Create a Supabase project.
2. Open **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this project, copy all of it into the SQL Editor and run it.
4. In the SQL Editor, add your own email to the approved roster (replace the sample email):
```sql
insert into public.class_members(email, approved)
values ('YOUR_COLLEGE_EMAIL@example.com', true)
on conflict (email) do update set approved = excluded.approved;
```
5. Add each classmate's approved college email using the same query. Only add people who should have access.
6. Open **Project Settings → API** (or **Connect**) and copy the Project URL and the publishable/anon client key. Never use a service-role/secret key in a browser app.

## Step 4 — Configure environment variables
1. Copy `.env.example` to a new file named `.env` in the project root.
2. Replace the placeholder Supabase URL and publishable/anon key.
3. Replace `VITE_CLASS_INVITE_CODE` with a long random invitation code and share it privately with classmates.
4. Save the file.

Important: the invite code in `.env` improves the signup experience but is visible in the browser bundle. The database's `class_members` allowlist and RLS policies are the actual access gate. The allowlist must be populated before those users sign up.

## Step 5 — Run locally
```bash
npm run dev
```
Open the local URL shown in the terminal, usually `http://localhost:5173`.

## Step 6 — Create your first account and make yourself admin
1. Use **Create account** with the same email you added to `class_members`.
2. Confirm your email if Supabase asks you to.
3. Sign in.
4. In Supabase SQL Editor, run this with your actual email:
```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('YOUR_COLLEGE_EMAIL@example.com');
```
5. Sign out and sign back in. Admins can publish events and create clubs from the Events and Clubs pages.

## Step 7 — Publish it online with Vercel
1. Create a GitHub account if you don't have one: https://github.com/
2. Upload this project to a **private** GitHub repository.
3. Sign in to Vercel: https://vercel.com/ and import the repository.
4. Set build command `npm run build` and output directory `dist` (Vite is normally auto-detected).
5. Add the same environment variables from `.env` in Vercel Project Settings → Environment Variables.
6. Deploy.
7. In Supabase Authentication URL Configuration, add your deployed URL to **Site URL** and **Redirect URLs**.

## What works
- Email/password sign-up and sign-in through Supabase Auth
- Approved class email roster checked by a database trigger
- Student profiles and skills
- Events list and event registration records
- Club directory and unique club applications
- Classmate directory
- Admin-only event/club creation when your account role is admin
- Responsive dark futuristic UI

## Important notes before real use
- Demo cards are sample content, not real registrations. Once the database has rows, the app loads them from Supabase.
- The included class roster is intentionally not readable from the browser.
- Supabase email confirmation settings depend on your project configuration.
- This starter has a shared invite code for convenience. Do not treat it as authentication or confidentiality; the email allowlist is the real gate.
- Do not collect unnecessary sensitive data. Only show classmates information they expect to share.
- Before a public or college-wide launch, ask a knowledgeable developer to review RLS policies and signup flows. This is a starter, not a security audit.
- Admin application review UI, password reset UI, email notifications, club membership approval automation and detailed analytics are future improvements.
