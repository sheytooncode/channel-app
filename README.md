# CHANNEL — Setup & Deployment Guide

> *Carve your channel.*

A full-featured accountability web app built on Next.js + Supabase + Vercel.
Each user gets their own login, goals, weekly task data, AI planning, and daily email nudges.

---

## Stack (mostly free)

| Tool | Purpose | Free tier |
|------|---------|-----------|
| [Next.js](https://nextjs.org) | Web framework | Open source |
| [Supabase](https://supabase.com) | Auth + database | 500MB, 50k users |
| [Vercel](https://vercel.com) | Hosting + cron jobs | Unlimited hobby projects |
| [Anthropic](https://console.anthropic.com) | AI planning + breakdown | Pay-per-use (optional) |
| [Resend](https://resend.com) | Email nudges | 3,000 emails/month free |

---

## Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (pick any region, set a strong database password)
3. Once the project is ready, go to **SQL Editor → New query**
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — only for server)
6. In **Authentication → URL Configuration**, add your Vercel URL to **Site URL** (come back after Step 3)

---

## Step 2 — Get optional API keys

**For AI features** (weekly planning + auto task breakdown):
- Sign up at [console.anthropic.com](https://console.anthropic.com)
- Create an API key → `ANTHROPIC_API_KEY`

**For email nudges** (morning + evening summaries on weekdays):
- Sign up at [resend.com](https://resend.com)
- Create an API key → `RESEND_API_KEY`
- Add your sending domain or use Resend's sandbox for testing
- Choose a from-address → `EMAIL_FROM` (e.g. `Channel <nudge@yourdomain.com>`)

Both are optional — the app works fully without them.

---

## Step 3 — Push to GitHub

1. Create a new repository on [github.com](https://github.com)
2. Upload all the files from this folder into the repository
   - Easiest way: drag and drop the folder into the GitHub web UI
   - Or: `git init && git add . && git commit -m "init" && git push`

---

## Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** and import your GitHub repository
3. In the **Environment Variables** section, add your values:

```
# Required
NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = your-anon-key

# Required for cron email fan-out (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY       = your-service-role-key

# Protects cron endpoints from public access — any random string
CRON_SECRET                     = any-random-secret-string

# Optional — AI features
ANTHROPIC_API_KEY               = sk-ant-...
NEXT_PUBLIC_AI_ENABLED          = true

# Optional — email nudges
RESEND_API_KEY                  = re_...
EMAIL_FROM                      = Channel <nudge@yourdomain.com>
```

4. Click **Deploy** — Vercel builds and hosts automatically (~60 seconds)
5. Copy your Vercel URL (e.g. `https://channel-yourname.vercel.app`)
6. Go back to Supabase → **Authentication → URL Configuration** and paste the URL into **Site URL**

---

## Step 5 — Share with friends

Send them the Vercel URL. They sign up with their email, confirm it, and they're in — completely separate data from everyone else.

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## File structure

```
channel-app/
├── app/
│   ├── layout.jsx                   # Root HTML layout + global styles
│   ├── page.jsx                     # Redirects to /login
│   ├── login/page.jsx               # Sign in page
│   ├── signup/page.jsx              # Create account page
│   ├── dashboard/page.jsx           # Server component — fetches data, renders Dashboard
│   └── api/
│       ├── tasks/route.js           # Task CRUD
│       ├── goals/route.js           # Goal CRUD
│       ├── carry-forward/route.js   # Auto-move stale tasks + AI breakdown
│       ├── ai/
│       │   ├── plan/route.js        # AI weekly planning (Claude Haiku)
│       │   └── breakdown/route.js   # AI subtask breakdown
│       └── cron/
│           ├── morning/route.js     # 7:30am email fan-out (weekdays)
│           └── evening/route.js     # 7:30pm email fan-out (weekdays)
├── components/
│   ├── Dashboard.jsx                # Full Channel UI (client component)
│   └── WeeklyPlanner.jsx            # AI planning modal overlay
├── lib/
│   ├── email.js                     # Morning + evening email templates (Resend)
│   └── supabase/
│       ├── client.js                # Browser Supabase client
│       ├── server.js                # Server Supabase client
│       └── utils.js                 # Helpers: week start, day index, goal colours
├── middleware.js                    # Auth routing (redirect if not logged in)
├── vercel.json                      # Cron schedule: 7:30am + 7:30pm weekdays
├── supabase-schema.sql              # Run this in Supabase SQL Editor
├── next.config.js
├── package.json
└── .env.local.example
```

---

## What's included

**Core**
- Email/password sign up and login — per-user, fully isolated data
- Goal-setting onboarding (first login prompts for 3 goals)
- Today's focus view — add tasks, mark done, delete
- Week view — see and manage all 5 days at once
- Goals view — per-goal completion progress bars
- Channel Depth meter — visual weekly progress gauge in sidebar
- Automatic week rollover — tasks tied to `week_start` date, fresh slate every Monday

**AI features** *(requires Anthropic API key)*
- **AI weekly planning** — brain dump your tasks, get a structured Mon–Fri plan back
- **Automatic carry-forward** — incomplete tasks silently move to today on login
- **Auto task breakdown** — tasks pushed 2+ times get split into smaller subtasks automatically, zero prompts

**Email nudges** **(requires Resend API key)**
- **Morning email** (7:30am weekdays) — today's task list with goal breakdown
- **Evening email** (7:30pm weekdays) — completion summary + any carried tasks

---

*The channel deepens.*
