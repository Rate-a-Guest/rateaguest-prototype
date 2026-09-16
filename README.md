# RateAGuest interactive prototype

A dependency-free, clickable product prototype for feedback sessions. It uses fictional guests, stays, and reviews.

## Run it

From this folder:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

It also works by opening `index.html` directly, though a local server gives more predictable browser behavior.

## Suggested demo path

1. Start on **Dashboard** and use the private guest search.
2. Search `jordan.m@example.com` for a mixed-history profile.
3. Search `maya.r@example.com` for a strong profile.
4. Search `devon.k@example.com` for a profile with multiple stay concerns.
5. Click **Review this guest**, complete the three-step flow, and submit it.
6. Open **Alerts** and demonstrate the fictional guest-correction process.
7. Use **Reset demo** in the top banner before the next conversation.

## What is intentionally simulated

- Host identity and business verification
- Reservation/PMS verification
- Exact guest identity matching
- Evidence upload and encrypted storage
- Guest notification, access, correction, and dispute workflows
- Score calculation and abuse/fraud detection

No real guest data should be entered into this prototype.

## Publish for feedback

The included GitHub Actions workflow deploys the repository as a static GitHub Pages site whenever `main` is updated. After the repository is created in the `Rate-a-Guest` organization:

1. Push this folder to the repository's `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run **Deploy prototype to GitHub Pages** or push another commit.

The prototype is intentionally static: no guest data is sent to a backend, and refreshing the page resets changes.

## Smoke test

With the local server running, execute this from the workspace root:

```bash
node projects/rateaguest-prototype/smoke-test.mjs
```

The script exercises desktop search and review submission, the correction workflow, and a mobile search/profile flow. It saves screenshots under `projects/rateaguest-prototype/artifacts/`.
