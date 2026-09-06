# AVC — Adyar Variety Choice, online catalogue

A no-build, static shopping catalogue for AVC: browse 39 brands and 500+
styles, get a suggested size in under a minute, and send an order straight
to WhatsApp. Built to host for free on GitHub Pages — there's no server,
database, or account system; it's plain HTML/CSS/JS reading one JSON file.

## What's in here

```
index.html              the whole site (catalogue, size guide, cart, chat)
assets/css/style.css     all styling
assets/js/app.js         all behaviour (filtering, cart, calculators, chat)
data/products.json       the 504 products, exported from your Excel sheet
images/                  put product photos here, named by Product ID
tools/export_products.py regenerates data/products.json from a fresh .xlsx
```

## 1. Publish it on GitHub Pages

1. Create a new **public** GitHub repository (e.g. `avc-catalogue`).
2. Upload everything in this folder to that repository (drag-and-drop on
   github.com works fine, or `git push` if you're comfortable with git).
3. In the repo, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**,
   branch **main**, folder **/ (root)**. Save.
5. GitHub gives you a URL like `https://yourusername.github.io/avc-catalogue/`
   within a minute or two. That's the link to share with customers.

Any time you push new files to the repo, the live site updates automatically
within a minute — no rebuild step.

## 2. Add product photos

See `images/README.md` — short version: name each photo after its Product ID
(`AVC-0002.jpg`) and drop it in the `images/` folder. Products without a
matching photo just show a neat monogram instead of a broken image.

## 3. Set your WhatsApp number

Already set to AVC's number. To change it, open `assets/js/app.js` and edit
the line near the top:

```js
const WHATSAPP_NUMBER = "918248138571"; // digits only, country code first
```

## 4. Update the catalogue later

When your spreadsheet changes (new products, prices, stock), regenerate
`data/products.json` rather than editing it by hand:

```bash
pip install openpyxl
python3 tools/export_products.py "path/to/AVC AI Product Master - Enriched v2.xlsx"
```

This overwrites `data/products.json`. Commit and push it — the live site
picks it up immediately.

Notes on the data:
- Products missing a **Selling Price**/MRP show "Ask on WhatsApp" instead of
  a price, since about a third of the catalogue doesn't have a confirmed
  price yet. Fill in the **Selling Price** column in the spreadsheet and
  re-run the export whenever you confirm one.
- The customer never sees your internal research/QA columns (source notes,
  confidence, verification status) — only fields useful for shopping.

## 5. How ordering works

There's no payment or account system by design — customers add items to a
cart (saved in their browser, so it survives a page refresh), then tap
**Place order on WhatsApp**. That opens WhatsApp with a pre-filled message
listing each Product ID, brand, style, size range and quantity, so you can
look each one up instantly and confirm price, size and stock in chat — the
same way you already work.

## 6. The size calculator

Under "Find my size", customers enter simple measurements (band/bust for
bras, hip for bottoms, waist for menswear, age for kids) and get an
estimated size plus a one-line note that sizing varies slightly by brand.
It's meant to build confidence and reduce back-and-forth, not to replace
your judgement on a borderline fit — the copy says so.

## 7. The "Need help?" chat

This is not an AI chatbot and calls no external service — it's a small
keyword matcher over the same `products.json` the catalogue uses. Typing a
brand ("Jockey"), a category ("nighty"), or a feature word ("padded",
"strapless", "feeding", "shapewear") filters instantly and shows a few
matching cards with a link to see all results in the catalogue. Because it
runs entirely in the browser, it costs nothing to run and works offline
once the page has loaded.

## Customising the look

Colours, type and spacing are all defined as CSS custom properties at the
top of `assets/css/style.css` (the `:root` block) — change a value there and
it updates everywhere it's used.
