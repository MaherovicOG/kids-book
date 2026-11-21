# Little Hero Books storefront

A separate Next.js storefront for the existing book creation tools. Customers request a **5 € or 5 USDT digital PDF**; the admin confirms each order on WhatsApp and delivers the PDF manually by email or WhatsApp within three hours after confirmation. The form does not generate prompts or charge payments.

## Local use

```sh
npm ci
cp .env.example .env.local
# Fill the server-only values. Existing configured installations already have this file.
npm run db:setup
npm run dev
```

Open `http://localhost:3001/en`, `/fr`, or `/ar`. The root URL redirects to English. Arabic uses a right-to-left document layout. Admin login is at `/admin/login`; use the admin account configured in the database. The admin password is stored as a salted scrypt hash. To configure a different password, run `node scripts/hash-password.mjs`, enter it through hidden stdin, and put the resulting hash in `ADMIN_PASSWORD_HASH` before running database setup again. Real configuration is in the ignored `.env.local`, never committed or sent to the browser.

## Supabase

The supplied Postgres pooler is used server-side. The app verifies its TLS certificate with the bundled Supabase CA. `npm run db:setup` creates only the `lp_` tables and configures the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`. All four tables have RLS enabled and no permissions for anonymous/authenticated Supabase API roles. Child photos are private database binary data, served only after admin session authentication.

The public form includes child name, age, boy/girl choice, book language, website language, currency, favorites, adventure, matching hero image cards, reference photo, parent name, email, WhatsApp number, delivery preference, notes, and guardian consent. Uploads are resized in the browser. The server validates the image signature, all fields, country-code phone numbers, and hero compatibility. Writes require same origin; database-backed rate limits cover submissions and login. Duplicate submission retries use the same random request ID.

## Admin workflow

1. Sign in at `/admin` and open an order.
2. Review details and download the reference photo.
3. Use **Open WhatsApp** to agree details and payment with the customer. Buttons never send messages automatically.
4. Save **Confirmed** only when confirmation is complete. This records the first confirmation time and a three-hour deadline; saving again does not extend it.
5. Prepare the PDF using your existing book tools, send it manually via the selected channel, and then mark **Delivered**.

## Vercel deployment

Deploy this directory (`storefront`) as the Next.js project root. The existing plain-JavaScript tools remain in the parent directory and are not deployed with this app.

Set these Vercel environment variables from your ignored local configuration:

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `IP_HASH_SECRET`

No browser Supabase key is needed. The database schema/admin must be initialized before accepting orders. The public offer is fixed at 5 € (EUR) or 5 USDT; these are separate fixed prices, not a live exchange rate. The customer selects the currency in the form. Vercel handles HTTPS and sets the secure session cookie in production. Do not upload `.env.local` as source.

With an authenticated Vercel CLI, use `vercel link`, add the server variables using `vercel env add NAME production` through stdin, then run `vercel --prod`. Alternatively, connect the directory to Vercel and set the same variables in Project Settings. No payment gateway or automatic email/WhatsApp delivery is configured.

## Checks

```sh
npm test
npm run build
```

`scripts/verify-storefront.mjs` runs desktop/mobile Chrome and real Supabase integration checks against a local server at port 3001. It reads the admin password from hidden stdin, creates one clearly labeled test order, and removes that specific fixture afterward. It does not send WhatsApp messages or emails.

## Website and book languages

The public storefront, form, validation messages, consent, success screen, metadata, and FAQs are localized in English, French, and Arabic. The website-language selector navigates between `/en`, `/fr`, and `/ar`. The private admin workspace remains English and displays each customer’s saved website language, book language, and currency. WhatsApp drafts use the customer’s website language.

Book-language requests support English, French, Arabic, Spanish, German, Italian, Portuguese, Dutch, and Turkish. Book language is independent of the website language. Adventure labels follow the website language while the selected book language controls the request sent to the admin. Preparing and delivering the requested book remains a manual admin step; this storefront does not generate story text.

The schema upgrade preserves existing dollar-priced orders as historical USD records, defaults new database rows to EUR, and permits new form submissions in EUR or USDT only. Run `npm run db:setup` to apply the expanded language constraint and add the currency/site-language columns. The three-hour deadline still starts only on admin confirmation.

Operational date labels and overdue flags are sent by the server with each admin order snapshot/update. This keeps the dashboard and WhatsApp deadlines consistent even if a browser has outdated Morocco timezone data. Refresh the order list to update the overdue state.
