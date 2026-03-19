# Expandi → Discord Notification Relay

Receives Expandi webhook events and forwards them as formatted Discord embed messages via Discord Webhooks.

## Architecture

```
Expandi fires webhook → Vercel serverless function → Formats to Discord Embed → POSTs to user's Discord Webhook
```

**Zero database.** The user's Discord webhook URL is Base64url-encoded into the endpoint path. The serverless function decodes it, formats the Expandi payload into a rich Discord embed, and POSTs to Discord. Fully stateless.

## Project Structure

```
expandi-discord/
├── api/
│   └── hook/
│       └── [slug].js       ← Serverless function (Vercel route: /api/hook/:slug)
├── lib/
│   └── format.js           ← Discord Embed message formatter (all 27 event types)
├── public/
│   └── index.html           ← Setup page (paste Discord URL → get endpoint)
├── test/
│   └── fixture-reply.json   ← Real Expandi webhook payload (campaign_replied event)
├── package.json
├── vercel.json              ← Vercel routing config
└── README.md
```

## How It Works (User Flow)

1. User creates a Discord Webhook (Server Settings → Integrations → Webhooks → New Webhook → Copy URL)
2. User visits the setup page (`/index.html`)
3. Pastes their Discord webhook URL (e.g., `https://discord.com/api/webhooks/123/abc`)
4. Page generates a unique Expandi webhook endpoint by Base64url-encoding the Discord URL into the path
5. User copies the generated endpoint URL
6. In Expandi: **LinkedIn Settings → Webhooks → Add a webhook** → paste the endpoint URL → select event type
7. Done. Events fire from Expandi → land in Discord.

Reference: https://help.expandi.io/en/articles/5405651-webhook-events

## Supported Events (27 total)

Same event set as the Slack version — see the Slack README for the full list.

## Discord Embed Layout (Reply Event)

```
┌─ blue sidebar ─────────────────────────────────────┐
│ 💬 New Reply                                        │
│                                                      │
│ Darren Donohoe                    [profile photo]   │
│ Commercial Sales Executive at Exclaimer             │
│ Exclaimer · 201-500 employees · Farnborough, GB     │
│                                                      │
│ 💬 Their reply:                                     │
│ > Calls are always king but it helps if an          │
│ > email goes out first...                           │
│                                                      │
│ 📤 You sent:                                        │
│ > doing a bit of research on the side...            │
│                                                      │
│ Steps before reply: 14 · Connected: Mar 16          │
│ · Replied: Mar 17                                   │
│                                                      │
│ 🔗 LinkedIn · 📥 Expandi Inbox · 🔎 Sales Nav      │
│                                                      │
│ Campaign: ABM | Email vs LinkedIn · Sender: Ilija   │
│                                          Mar 17 2026│
└─────────────────────────────────────────────────────┘
```

## URL Encoding Scheme

Same as the Slack version — Base64url (RFC 4648 §5).

```
Discord URL:  https://discord.com/api/webhooks/123/abc
Encoded:      aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTIzL2FiYw
Endpoint:     https://<domain>/api/hook/aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTIzL2FiYw
```

The serverless function validates the decoded URL starts with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`.

## Deploy to Vercel

```bash
cd expandi/tools/expandi-discord
vercel
```

## Tech Stack

| Layer | Tool |
|---|---|
| Hosting | Vercel (serverless) |
| Runtime | Node.js 18+ (single serverless function) |
| Frontend | Static HTML (no framework) |
| Message format | Discord Embeds |
| Database | None |
