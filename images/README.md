# Product photos go here

The site looks for an image named after each product's **Product ID** — the
same ID shown on every product card and in the WhatsApp order message
(e.g. `AVC-0002`).

## Option A — keep photos in this repo (recommended)

This is the most reliable option on GitHub Pages: Google Drive links can be
slow, get rate-limited, or stop working if sharing settings change.

1. Export/download your ~400 photos from Google Drive.
2. Rename each one to match its Product ID exactly, e.g.:
   ```
   AVC-0002.jpg
   AVC-0145.jpg
   AVC-0398.png
   ```
   (Case matters. `.jpg`, `.jpeg`, `.png` and `.webp` are all supported —
   the site tries each extension automatically, so you don't need to tell
   it which one you used.)
3. Drop all the files straight into this `images/` folder.
4. Commit and push. GitHub Pages serves them automatically — no code changes
   needed.

If a product has no matching image file, its card falls back to a simple
monogram (its brand initials) instead of a broken image — nothing looks broken.

## Option B — link to Google Drive instead

If you'd rather not duplicate ~400 images into the repo:

1. In Drive, select the images folder → **Share** → "Anyone with the link".
2. For each image, get its file ID from the share link
   (`https://drive.google.com/file/d/`**`FILE_ID`**`/view`).
3. Build a small `images-map.json` file in the project root that maps
   Product ID → a direct Drive image URL:
   ```json
   {
     "AVC-0002": "https://lh3.googleusercontent.com/d/FILE_ID",
     "AVC-0145": "https://lh3.googleusercontent.com/d/FILE_ID"
   }
   ```
4. Tell your developer (or ask Claude) to wire `images-map.json` into
   `assets/js/app.js` as a lookup that runs before the local-file check.

Option A needs no extra plumbing and won't break later, so start there —
you can always layer Option B in afterwards for new products.
