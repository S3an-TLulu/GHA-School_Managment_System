# Deploying the GHA Website to InterServer (Custom Domain)

This folder contains the public website for **Great Highway Academy**:

| File | Purpose |
|---|---|
| `index.html` | The whole website in one self-contained file (no build step, no database, no external libraries) |
| `gha-logo.png` | The school crest, shown in the header, hero, footer and browser tab |

Upload **both files together** — the page loads the logo from the same folder.

A live preview of this exact page is also published with the app at:
`https://s3an-tlulu.github.io/GHA-School_Managment_System/website/`

---

## 1. What you need

- Your **InterServer** hosting account (Standard Web Hosting includes cPanel).
- Your cPanel login (from your InterServer welcome email, or via **my.interserver.net → your hosting service → cPanel**).
- Your custom domain (e.g. `gha-academy.com`).

## 2. Option A — Upload with cPanel File Manager (easiest)

1. Log in to [my.interserver.net](https://my.interserver.net), open your hosting service and click **cPanel**.
2. In cPanel, open **Files → File Manager**.
3. Go into the **`public_html`** folder (this is your website's root — what visitors see at `https://yourdomain.com`).
4. If there is a default placeholder file (`index.html` or `index.php` from InterServer), delete it or rename it to `index.old`.
5. Click **Upload**, then select `index.html` and `gha-logo.png` from this folder (`website/` in the project).
6. Confirm both files sit directly inside `public_html` — i.e. `public_html/index.html` and `public_html/gha-logo.png` (not in a subfolder).
7. Visit your domain in a browser — the site should appear immediately.

## 3. Option B — Upload with FTP (FileZilla)

1. In cPanel, open **Files → FTP Accounts** to see/create your FTP credentials (host is usually your domain or server hostname, port 21; SFTP may also be available — check your welcome email).
2. In FileZilla: **Host** = your domain or server IP, **Username/Password** = your FTP account, **Port** = 21, then Quickconnect.
3. On the right (remote) side, open `public_html`.
4. Drag `index.html` and `gha-logo.png` from the left (local) side into `public_html`.

## 4. Pointing your custom domain at InterServer

**If you registered the domain with InterServer** and it's attached to this hosting account, nothing more is needed — it already points at `public_html`.

**If the domain is registered elsewhere** (e.g. GoDaddy, Namecheap):

- *Simplest:* at your registrar, set the domain's **nameservers** to InterServer's — typically `cdns1.interserver.net`, `cdns2.interserver.net`, `cdns3.interserver.net` (confirm the exact ones in your InterServer welcome email).
- *Alternative:* keep your registrar's DNS and create an **A record** for `@` (and `www`) pointing at your server's IP address (shown in cPanel on the right-hand "General Information" panel).
- DNS changes can take **up to 24–48 hours** to propagate worldwide. You can watch progress at [dnschecker.org](https://dnschecker.org).

**Adding the domain in cPanel:** if the hosting account was created with a different primary domain, add yours under **Domains → Domains → Create a New Domain** and set its document root to `public_html`.

## 5. Enable HTTPS (free SSL)

1. In cPanel, open **Security → SSL/TLS Status**.
2. Tick your domain and click **Run AutoSSL** (free Let's Encrypt certificate). This only works after DNS points at InterServer.
3. Optionally force HTTPS: cPanel **Domains** → toggle **Force HTTPS Redirect** for your domain.

## 6. Update the "Portal Login" link

The website's **Portal Login** buttons currently point at the GitHub Pages copy of the management system:

```
https://s3an-tlulu.github.io/GHA-School_Managment_System/
```

If you ever move the portal (e.g. to `portal.gha-academy.com`), update the link:

1. In cPanel File Manager, right-click `public_html/index.html` → **Edit**.
2. Search for `TODO: replace with your portal URL` — the link appears in a few places (header, mobile menu, hero, portal section, footer).
3. Replace each URL and **Save**.

## 7. Updating the site later

- Edit `website/index.html` in this project (fees, phone numbers, text — the fee table is one clearly marked block).
- Copy the same file over `public/website/index.html` so the GitHub Pages preview stays in sync.
- Re-upload it to `public_html`, overwriting the old file. Changes are live instantly (press Ctrl+F5 to bypass your browser cache).

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Still seeing the InterServer placeholder page | Make sure your `index.html` is directly in `public_html` and any default `index.html`/`index.php` was removed; hard-refresh (Ctrl+F5). |
| **403 Forbidden** | In File Manager, right-click each file → **Permissions** → set to `644`. `public_html` itself should be `755`. |
| Logo not showing | Confirm `gha-logo.png` was uploaded next to `index.html` with exactly that name (lowercase). |
| Domain doesn't load at all | DNS hasn't propagated yet or nameservers/A record are wrong — verify at dnschecker.org. |
| "Not secure" warning | Run AutoSSL (step 5) after DNS points at InterServer, then force HTTPS. |
