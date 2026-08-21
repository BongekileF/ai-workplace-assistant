# AI Workplace Productivity Assistant

An AI-powered dashboard that automates common workplace tasks: email drafting, meeting note summarization, task prioritization, research summarization, and a chatbot — built for the CAPACITI AI Skill Accelerator project.

## Features

- **Smart Email Generator** — tone- and audience-aware email drafting
- **Meeting Notes Summarizer** — key points, decisions, action items with owners/deadlines
- **AI Task Planner** — prioritizes and time-blocks a task list
- **AI Research Assistant** — plain-language insights + a recommendation
- **AI Chatbot** — conversational Q&A interface

Every AI output includes the disclaimer: *"AI-generated content may require human review."*

## Tech stack

React 18 + Vite + Tailwind CSS + lucide-react icons. AI calls go through a small backend proxy to Anthropic's Claude API (see below — this is required, not optional).

## Running locally

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. The buttons won't return AI output yet until you connect the proxy below.

## Connecting the AI (required)

Browsers can't call `api.anthropic.com` directly — there's no CORS support for it, and putting your API key in frontend code would expose it to anyone who opens the page. You need a tiny backend in between. The simplest option is included:

```bash
npm install express cors
export ANTHROPIC_API_KEY=sk-ant-...   # get one at console.anthropic.com
node server/proxy.js
```

This starts a proxy at `http://localhost:8787/api/claude`. Point the frontend at it:

```
# .env
VITE_CLAUDE_PROXY_URL=http://localhost:8787/api/claude
```

Restart `npm run dev` and the five AI features will work end to end.

For a real deployment, deploy `server/proxy.js` (or the equivalent) as a serverless function — e.g. a Vercel/Netlify function, or an AWS Lambda — with `ANTHROPIC_API_KEY` set as a server-side environment variable, and point `VITE_CLAUDE_PROXY_URL` at that deployed URL.

## Building for production

```bash
npm run build
npm run preview
```

## Pushing this project to GitHub

1. **Create a new empty repo on GitHub** (no README/license, so it stays empty) — click "New" at github.com/new, name it e.g. `ai-workplace-assistant`, and don't check any initialize options.

2. **From this project's folder, initialize git and make your first commit:**

```bash
cd ai-workplace-assistant
git init
git add .
git commit -m "Initial commit: AI Workplace Productivity Assistant"
```

3. **Connect it to the GitHub repo you created** (replace with your own URL, shown on the repo's page after creation):

```bash
git remote add origin https://github.com/YOUR-USERNAME/ai-workplace-assistant.git
git branch -M main
git push -u origin main
```

4. **If prompted for a password**, GitHub no longer accepts your account password over HTTPS — use a Personal Access Token instead: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic), tick the `repo` scope, and paste the token in place of your password when asked.

   Alternatively, set up SSH once (`ssh-keygen`, add the public key under GitHub → Settings → SSH and GPG keys) and use the SSH remote URL instead: `git@github.com:YOUR-USERNAME/ai-workplace-assistant.git`.

5. **Never commit your `.env` file or API key.** `.gitignore` already excludes `.env`, `.env.local`, and `node_modules` — double-check `git status` before your first commit shows no `.env` in the list.

After pushing, your repo page will show the full project. If you want it live and demoable (not just code), the easiest free option is deploying the frontend to **Vercel** or **Netlify** (import the GitHub repo directly, they auto-detect Vite) and deploying `server/proxy.js` as that platform's serverless function — both support setting `ANTHROPIC_API_KEY` as a secret environment variable in their dashboard.

## Project structure

```
ai-workplace-assistant/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx        # all 5 features + dashboard shell
│   └── index.css
└── server/
    └── proxy.js        # example Anthropic API proxy
```
