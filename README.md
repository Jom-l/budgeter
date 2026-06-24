# Budget Computer

A personal budgeting web app. Track income, scheduled bills, savings goals, and daily ad-hoc spending — then get AI-powered tips, warnings, and encouragement from Claude. Includes a payment scheduler with email reminders and monthly reports.

## Features

- **Auth** — signup / login with session handling (Redis / Memurai). Pick your **currency at signup**, change it later in settings.
- **Budget setup** — total income, required payments (food, electricity, internet, …), savings goal, current balance, plan for the surplus.
- **Daily check-in** — log spending that wasn't in the budget.
- **Expense tracking** — daily / weekly / monthly views, split into required vs non-required.
- **AI tips (Claude)** — suggests a budget and adapts tone: encourages a treat when there's surplus, warns gently when tight. Refreshes **every morning** and whenever spending changes.
- **Payment scheduler** — bills due on set days, **user-configurable email reminder lead time**, auto-deduct if unpaid (editable — amounts aren't static, and someone else may have paid).
- **Monthly reset + reports** — budget resets monthly; generate a report of what was spent.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS (JavaScript, ESM) |
| Backend | Node.js + Express (ESM) |
| Database | MongoDB (Mongoose) |
| Sessions / Cache | Redis (Memurai) |
| AI | Claude API (`claude-opus-4-8`) via `@anthropic-ai/sdk` |
| Email | Nodemailer + Outlook SMTP |
| Scheduler | node-cron |

## Project Structure

```
budget-computer/
├── client/    # Vite + React + Tailwind frontend
└── server/    # Express API, models, services, scheduler
```

## Getting Started

> Prerequisites: Node.js, MongoDB, and Memurai (Redis) running locally.

```bash
# Frontend
cd client
npm install
npm run dev

# Backend (once scaffolded)
cd server
npm install
npm run dev
```

Copy `server/.env.example` to `server/.env` and fill in `MONGODB_URI`, `REDIS_URL`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `OUTLOOK_USER`, `OUTLOOK_PASS`.

## Repository

https://github.com/Jom-l/budgeter.git

## License

Private project.
