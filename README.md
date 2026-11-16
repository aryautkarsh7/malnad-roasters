# Malnad Roasters

A mobile-first direct-to-consumer storefront for a small coffee roaster, with an authenticated admin panel for managing products and orders. Built for the Saral Karo full stack developer intern assessment.

The brand, products and prices are tailored for a specialty coffee roaster from the Western Ghats (Karnataka). Payments are simulated and no real products are shipped.

## Quick Start (Run in One Go)

Run the entire application (both FastAPI backend on port 8000 and Next.js frontend on port 3000) with a single command:

```bash
./run.sh
```

Then open **http://localhost:3000** in your browser.

> **Zero Setup / Standalone Local Mode**: The application is configured to run out-of-the-box locally without needing external database accounts. When Supabase environment variables are left empty, it runs with a local standalone SQLite database pre-seeded with 9 authentic coffee products, and local demo accounts:
> - **Admin**: `admin@malnad.com` (password: `admin123`)
> - **Customer**: `customer@malnad.com` (password: `customer123`)
>
> When you provide real Supabase credentials, the backend and frontend seamlessly switch to live Supabase Postgres and Supabase Auth.

---

## Stack

| Layer | Choice |
| --- | --- |
| Storefront and admin UI | Next.js 14 (App Router), React 18, plain CSS |
| API | Python 3.12, FastAPI, httpx |
| Database | Supabase Postgres (with local SQLite standalone fallback) |
| Authentication | Supabase Auth (email and password, with local demo session fallback) |
| Local storage | IndexedDB for the catalog cache and the cart |
| Hosting | Vercel (frontend), Render (API) |

## Architecture

```
Browser (Next.js on Vercel)
   |  sign up / sign in                      -> Supabase Auth
   |  read catalog, place order, admin calls -> FastAPI (Render)
                                                  |
                                                  | service role key (server only)
                                                  v
                                             Supabase Postgres
```

- The browser signs in with Supabase Auth and sends the access token to the API as a bearer token.
- The API checks the token with Supabase, loads the user's role from the `profiles` table, and rejects the request if the endpoint needs a role the user does not have. Every `/admin/*` route requires the `admin` role.
- The browser never writes to the database directly. Row level security is enabled on every table and only has read policies, so the public anon key can read products and a customer's own orders and nothing else.
- Orders are created by a Postgres function (`place_order`) that locks the product rows, checks stock, decrements it and writes the order in one transaction. Prices are read from the database, not from the request, so a customer cannot change what they pay. Only the service role may call that function.
- The admin panel lives under `/admin` in the same Next.js app. Access is enforced by the API, and the pages also hide themselves from non-admin users.

### IndexedDB

Two things are stored in IndexedDB (`malnad` database, `kv` store):

- `cart`: the cart lines, so the cart survives reloads and browser restarts.
- `catalog:v1`: the product list. It follows a stale-while-revalidate strategy. Saved products are shown immediately, the API is always queried in the background, and the screen and cache are replaced when the response arrives. If the request fails, the saved catalog stays on screen with a notice. There is a manual refresh button on the shop page, and admin product edits clear the cache. When the cart page loads, saved cart lines are reconciled with the latest catalog (price, stock, removed products).

## Project structure

```
backend/
  app/
    main.py          app setup, CORS, error handler
    config.py        environment variables and mode detection
    db.py            Supabase REST client & local standalone DB engine
    auth.py          token check, current user, admin guard
    schemas.py       request validation
    routers/         public.py, orders.py, admin.py
  requirements.txt
  .env.example
frontend/
  app/               pages (shop, product, cart, checkout, payment, orders, login, signup, admin)
  components/        header, product card, forms, loaders, skeletons
  lib/               api client, auth, cart, catalog cache, IndexedDB helper, validation
  public/products/   product images (SVG)
supabase/
  schema.sql         tables, trigger, place_order function, row level security
  seed.sql           nine sample products
render.yaml          Render service definition for the API
run.sh               one-command runner for local development
```

## Environment variables

Backend (`backend/.env`):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS` comma separated list of frontend origins, for example `http://localhost:3000`
- `ALLOWED_ORIGIN_REGEX` optional, for example `https://.*\.vercel\.app` to allow preview deployments

Frontend (`frontend/.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` base URL of the API, for example `http://localhost:8000`

The service role key must only be set on the backend. Do not put it in the frontend or commit it.

## Manual Setup & Development

### 1. Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional: add Supabase keys if connecting to cloud
uvicorn app.main:app --reload --port 8000
```

The API docs are served at http://localhost:8000/docs.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # optional: add Supabase keys if connecting to cloud
npm run dev
```

Open http://localhost:3000.

### 3. Production Supabase Setup

When deploying or using Supabase Cloud:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor, run `supabase/schema.sql`, then run `supabase/seed.sql`.
3. Under Authentication -> Providers -> Email, turn off "Confirm email" for testing.
4. Copy the project URL, anon key, and service role key into `backend/.env` and `frontend/.env.local`.
5. To promote a user to admin in Supabase:
   ```sql
   update public.profiles set role = 'admin' where email = 'your-admin-email@example.com';
   ```

## Deployment

### API on Render

1. Create a new Web Service from this repository. `render.yaml` sets the root directory, build and start commands.
2. Add the backend environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`).

### Frontend on Vercel

1. Import the repository and set the root directory to `frontend`.
2. Add the frontend environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` pointing to the Render URL).

## Sample test flow

1. Open http://localhost:3000 on a phone-sized screen or responsive view. Search for "coorg" and filter by category ("Single origin", "Blend", "Brewing kit").
2. Open a product, change the quantity and add it to the cart. Try the sold out product (Baba Budangiri Peaberry) and note that it cannot be added.
3. Reload the page. The cart is still there (persisted in IndexedDB).
4. Go to checkout. You are prompted to sign in, then returned directly to checkout.
5. In Demo mode, click "Fill Customer" or sign in with your email.
6. Submit the checkout form empty to see the validation messages, then fill it in.
7. On the payment screen choose the failed payment option. Note that cart items remain intact.
8. Choose the successful payment option. You land on "My orders" with the new order listed.
9. Sign in as Admin (`admin@malnad.com` / `admin123` or click "Fill Admin").
10. Open the Admin dashboard at `/admin`. Check the products, orders, and simulated revenue counts.
11. Under Products, add, edit, and delete a product.
12. Under Orders, change the order status to Processing, then Shipped.
13. Sign back in as a customer and confirm order status updated. Attempting to visit `/admin` as a customer displays access denied and API returns 403.

## Known limitations

- Prices are whole rupees. There is no tax, delivery charge or coupon logic.
- Cancelling an order does not return stock to the product.
- Admin statistics are computed in the API by reading all products and orders. That is fine at this size but should become SQL aggregates for a larger store.
- There is no rate limiting on the API.
- Product images are links or paths. There is no file upload.
- Search matches the name and description on the client using the cached catalog.
