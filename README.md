# Senim Consulting — AI Sales Assistant (MVP)

Simple local web chat to test the Senim Consulting AI sales assistant.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- MongoDB Atlas + Mongoose
- OpenAI API

## What it does

- `/` — chat page where you talk to the bot as a client (Russian by default, understands Kazakh).
- The bot answers as a Senim Consulting sales assistant and guides the client to a consultation.
- After every message, lead data is extracted (name, city, phone, age, IP/TOO, credit history, business type, requested service, consultation format, consultation booked) and saved/updated in MongoDB.
- `/admin` — simple table of all saved leads.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
MONGODB_URI="your-mongodb-atlas-connection-string"
OPENAI_API_KEY="your-openai-api-key"
# optional
OPENAI_MODEL="gpt-4o-mini"
```

3. Run the dev server:

```bash
npm run dev
```

4. Open:
   - Chat: http://localhost:3000
   - Admin: http://localhost:3000/admin

## Notes

- Each browser gets a `sessionId` (stored in localStorage) which is the lead key. Clear localStorage to start a fresh lead.
- The bot never promises loan approval or guarantees financing; every case is "analyzed individually."
