# Human ARC through ARC Explainer

Author: Codex
Date: 2026-10-07

## Requested outcome

Make `82deutschmark/human-arc` public and make Human ARC available through ARC Explainer instead of relying on the GPTPlusPro address.

## Completed

- Cloned the full Human ARC repository and inspected deployment, routing, and service configuration.
- Scanned added lines across all fetched Git history for common provider credentials, private keys, and credential assignments. The single candidate was the literal placeholder `INSERT_SECRET_KEY_HERE`. This is a targeted scan, not a guarantee that every possible sensitive datum is absent.
- Changed GitHub visibility to public and verified the API reports `PUBLIC`.

## Proposed integration

1. Publish the existing Human ARC application at `https://arc.markbarney.net/human-arc/`.
2. Keep its code in its own repository. Add a pinned source reference to ARC Explainer using its existing external-project convention, and build Human ARC as a separate frontend during deployment.
3. Make Human ARC support a configurable URL prefix: Vite asset base, Wouter router base, hard navigation, images, favicons, and manifest URLs must agree. Preserve root hosting for the existing deployment.
4. Serve the Human ARC bundle and its page fallback under `/human-arc` before ARC Explainer's catch-all. Missing asset requests must not return a page as though it were JavaScript.
5. Add a visible Human ARC entry to ARC Explainer's existing ARC 1 & 2 menu. Include a return link to ARC Explainer and a source link in the Human ARC experience.
6. Keep the existing PlayFab services and human records; configure model-result requests against ARC Explainer. Do not migrate accounts or data as part of this hosting change.
7. Update repository descriptions, homepage links, README instructions, and changelogs once the new URL is deployed and verified.

## Verification before release

- Build both applications.
- Verify navigation, direct nested page loads, refresh, assets, assessment entry, puzzle loading, and return navigation under the prefix.
- Verify ARC Explainer's existing `/puzzles`, analytics, and ARC-3 pages remain routed to their own app.
- Check actual model-result and PlayFab requests; report any existing service incompatibility rather than substituting example data.
- Verify the deployed URL before advertising it as live. Leave the old working deployment in place during the transition.

## Approval

The user approved hosting under ARC Explainer and instructed implementation on 2026-10-07.
