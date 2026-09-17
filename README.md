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

1. Start on **Check a guest** and paste an Airbnb profile link or numeric profile ID.
2. See an exact account match, including separate account-match and completed-stay provenance.
3. Try a valid profile ID with no reports, or an invalid link, to see the safe fallback states.
4. Submit a stay-backed review and watch the account history update in-browser.
5. Select a high-severity concern to exercise the evidence gate.
6. Open **Alerts** and demonstrate the fictional guest-correction process.
7. Use **Reset demo** in the top banner before the next conversation.

## What is intentionally simulated

- Host identity and business verification
- Reservation/PMS verification
- Exact Airbnb account-ID matching
- Evidence upload and encrypted storage
- Guest notification, access, correction, and dispute workflows
- Abuse/fraud detection

No real guest data should be entered into this prototype.

## Publish for feedback

The included GitHub Actions workflow deploys the repository as a static GitHub Pages site whenever `main` is updated. After the repository is created in the `Rate-a-Guest` organization:

1. Push this folder to the repository's `main` branch.
2. In **Settings → Pages**, choose **GitHub Actions** as the source.
3. Run **Deploy prototype to GitHub Pages** or push another commit.

The prototype is intentionally static: no guest data is sent to a backend, and refreshing the page resets changes.

## Safari extension handoff

The iPhone Safari extension opens an exact account lookup through a URL fragment so the profile ID is not sent to GitHub Pages in the HTTP request:

```text
https://rate-a-guest.github.io/rateaguest-prototype/#guest=https%3A%2F%2Fwww.airbnb.com%2Fusers%2Fprofile%2F900000000000010001
```

## Smoke test

With the local server running, execute this from the workspace root:

```bash
node projects/rateaguest-prototype/smoke-test.mjs
```

The script exercises exact account lookup, invalid and no-history states, review submission with high-severity evidence, the correction workflow, and a mobile lookup/profile flow. It saves screenshots under `projects/rateaguest-prototype/artifacts/`.
