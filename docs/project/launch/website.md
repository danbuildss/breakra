# breakra.dev on Vercel (owner steps)

The site is static: `site/` (HTML, CSS, a few lines of JS for copy buttons, self-hosted Geist fonts). No build step, no framework, no analytics. Security headers live in `site/vercel.json`. Tests in `tests/site.test.ts` keep the page's numbers and example in sync with the code.

## 1. Create the Vercel project (about 3 minutes)
1. Go to **vercel.com** → **Sign up / Log in with GitHub** (Hobby plan, free).
2. **Add New… → Project** → find **danbuildss/breakra** → **Import**. If the repo isn't listed: **Adjust GitHub App Permissions** → allow `breakra`.
3. On the configure screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** `site` (click *Edit*, pick the `site` folder)
   - **Build Command:** leave empty / override to empty. **Output Directory:** leave default (`.`)
4. **Deploy**. You get a preview URL like `breakra-xxxx.vercel.app`. Open it and check the page.

From now on every merge to `main` redeploys the site automatically; PRs get preview links.

## 2. Connect breakra.dev
1. Vercel → the project → **Settings → Domains** → add `breakra.dev`, then add `www.breakra.dev` and choose **redirect to breakra.dev**.
2. Vercel shows the DNS records it wants. Typically:
   - `breakra.dev` → **A** record, host `@`, value `76.76.21.21`
   - `www.breakra.dev` → **CNAME**, host `www`, value `cname.vercel-dns.com`
   **Use exactly what Vercel shows** if it differs.
3. Namecheap → **Domain List → breakra.dev → Manage → Advanced DNS**:
   - Delete the default **URL Redirect** / **parking CNAME** records for `@` and `www` if present.
   - **Add New Record** → `A Record`, Host `@`, Value from Vercel, TTL Automatic.
   - **Add New Record** → `CNAME Record`, Host `www`, Value from Vercel, TTL Automatic.
4. Wait 5–30 minutes. Vercel shows **Valid Configuration** and issues the HTTPS certificate automatically (`.dev` requires HTTPS; nothing to do).

## 3. Check
- `https://breakra.dev` loads; `https://www.breakra.dev` redirects to it.
- Tell Claude: it then switches the README, GitHub "Website" field text and launch posts to breakra.dev.

## Security (Namecheap)
- **Domain lock:** on. **WHOIS privacy:** on. **2FA:** on. Don't add other DNS records you don't need.
