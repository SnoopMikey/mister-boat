# Mister Boat

A whimsical, nautical checklist PWA for casting off and docking up.

## Develop

```
npm install
npm run icons   # one-time: generates PWA icons from the mascot
npm run build   # emits ./dist/
npm run dev     # build + serve on http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, under **Pages**, set **Source → GitHub Actions**.
3. The `.github/workflows/deploy.yml` workflow builds and publishes on every push to `main`.

The site is served from a subpath like `https://<user>.github.io/<repo>/`. Asset paths, the manifest `start_url`, and the service worker are all scope-relative, so no config change is needed for the subpath.

## Install as a PWA

Open the deployed URL on iOS Safari → Share → **Add to Home Screen**. On Android/desktop Chrome, use the install icon in the address bar. The app works offline once the service worker has cached the shell.
