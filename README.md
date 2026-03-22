# KEK Skincare — static site

Organic skincare storefront UI with hash-based navigation (works on static hosting).

## Host on GitHub Pages

1. Create a new repository on GitHub and push this folder (or make this folder the repo root).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** (or **master**) and folder **`/` (root)**.
5. Save. Your site will be at `https://<username>.github.io/<repository>/`.

This project includes a **`.nojekyll`** file so GitHub does not run Jekyll on your HTML/CSS/JS.

### URLs

- Open `index.html` or the site root. Navigation uses hashes: `#/home`, `#/products`, `#/cart`, etc.
- All asset paths are **relative** (`css/`, `js/`), so they resolve correctly under `username.github.io/repo-name/`.

### Before you go live

- In `js/app.js`, set **`WHATSAPP_NUMBER`** to your real WhatsApp business number (digits only, with country code).
- Replace remote stock URLs with your own product photography when ready.

### Images (free sources)

The site mixes **skincare-specific** photos from:

- **[Shopify Burst](https://burst.shopify.com/)** — `burst.shopifycdn.com` (Burst / Shopify license)
- **[Pexels](https://www.pexels.com/)** — `images.pexels.com` (Pexels license)
- **[Unsplash](https://unsplash.com/)** — used sparingly for one grid tile (`images.unsplash.com`)

Product and Instagram URLs are centralized in **`js/media.js`**. Layout images in **`index.html`** use the same sources. Swap slugs/IDs there and in `media.js` when you change art direction.
