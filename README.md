# Amboras Storefront Template

Next.js storefront that connects to the shared Medusa Backend Orchestrator.

## Setup

```bash
cd storefront
cp .env.template .env.local
npm install
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_STORE_ID=your-store-environment-id
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxx
```

These are injected automatically by the dev orchestrator during store provisioning.

## How It Works

The storefront sends `X-Store-Environment-ID` header on every Medusa API call via the JS SDK's `globalHeaders`. The Medusa Backend Orchestrator routes queries to the correct store database.
