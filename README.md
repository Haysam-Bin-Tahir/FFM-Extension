# FFM Tracker - Shopify App

A Shopify app that automatically tracks FFM (Feature.fm) conversions by detecting the `ffm` query parameter, storing it, and sending conversion data when orders are completed.

## Features

- **Automatic FFM Detection**: Captures `ffm` query parameter from any page URL
- **Persistent Storage**: Stores FFM hash in both localStorage and Shopify cart attributes
- **Automatic Conversion Tracking**: Sends conversion data to FFM API when orders are paid
- **Per Line Item Tracking**: Each line item in an order generates a separate conversion
- **Zero Configuration**: Theme App Extension auto-enables when app is installed

## How It Works

1. **Detection**: When a visitor arrives with `?ffm=abc123`, the script captures it
2. **Storage**: The FFM hash is stored in:
   - Browser localStorage (persists across sessions)
   - Shopify cart attributes (survives checkout)
3. **Conversion**: When order payment is confirmed, the webhook sends to `https://api.ffm.to/conversion/sale`:

```json
{
  "reference": "<line_item_id>",
  "name": "<product_title>",
  "operation": "sale",
  "value": "<line_item_amount>",
  "currency": "<currency_code>",
  "ffmHash": "<ffm_cookie_value>"
}
```

## Quick Start

### Prerequisites

- Node.js 20+
- Shopify Partner account
- Shopify CLI (`npm install -g @shopify/cli`)

### Installation

1. **Clone and install dependencies:**

```bash
cd ffm
npm install
```

2. **Set up the database:**

```bash
npx prisma generate
npx prisma db push
```

3. **Configure environment:**

Copy `env-example.txt` to `.env` and fill in your Shopify app credentials:

```bash
cp env-example.txt .env
```

4. **Start development:**

```bash
npm run dev
```

The Shopify CLI will:
- Start a local tunnel
- Create/update your app in the Partners dashboard
- Open the app installation page

### Deploy to Production

1. **Build the app:**

```bash
npm run build
```

2. **Deploy to your hosting provider** (Heroku, Railway, Render, Fly.io, etc.)

3. **Update environment variables** on your hosting provider

4. **Update `shopify.app.toml`** with your production URL

5. **Deploy extensions:**

```bash
shopify app deploy
```

## Project Structure

```
ffm/
├── app/
│   ├── routes/
│   │   ├── _index.tsx          # Redirect to app
│   │   ├── app.tsx             # App layout with auth
│   │   ├── app._index.tsx      # Dashboard
│   │   ├── app.settings.tsx    # Settings page
│   │   ├── auth.$.tsx          # Auth catch-all
│   │   ├── auth.login/         # Login page
│   │   └── webhooks.tsx        # Webhook handler
│   ├── root.tsx                # Root layout
│   └── shopify.server.ts       # Shopify configuration
├── extensions/
│   └── ffm-tracker/            # Theme App Extension
│       ├── blocks/
│       │   └── ffm-tracker.liquid  # Tracking script
│       ├── locales/
│       └── shopify.extension.toml
├── prisma/
│   └── schema.prisma           # Database schema
├── shopify.app.toml            # App configuration
├── package.json
└── README.md
```

## Theme App Extension

The tracking script is automatically injected into all store pages via a Theme App Extension. When the app is installed:

1. The extension is automatically deployed
2. The app embed block is enabled by default
3. No manual theme editing required

### Manual Verification

To verify the extension is active:
1. Go to Online Store > Themes > Customize
2. Click "App embeds" in the left sidebar
3. Ensure "FFM Tracker Script" is enabled

## Webhook Events

The app listens for the `orders/paid` webhook and processes each line item, sending a conversion request for items that have an associated FFM hash.

## Database

Uses SQLite by default for development. For production, update `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## API Reference

### FFM Conversion API

**Endpoint:** `POST https://api.ffm.to/conversion/sale`

**Payload:**
```json
{
  "reference": "string",
  "name": "string",
  "operation": "sale",
  "value": "string",
  "currency": "string",
  "ffmHash": "string"
}
```

## Frontend API

The tracking script exposes a global `FFMTracker` object:

```javascript
// Get current FFM hash
FFMTracker.getHash()

// Manually set FFM hash
FFMTracker.setHash('abc123')

// Re-run initialization
FFMTracker.refresh()
```

## Troubleshooting

### FFM not being captured
- Check browser console for `[FFM Tracker]` logs
- Verify the app embed is enabled in theme settings
- Ensure URL has proper `?ffm=value` parameter

### Conversions not sending
- Check webhook logs in Shopify Partners dashboard
- Verify the order has FFM attribute in note_attributes
- Check conversion logs in the app dashboard

### Cart attribute not updating
- Check for JavaScript errors in console
- Verify `/cart/update.js` endpoint is accessible
- Try adding items to cart after FFM is captured

## License

MIT

