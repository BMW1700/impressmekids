## Situation

The publish dialog says **Published / Up to date**, but the live HTML still references the same main bundle hash as before:

```text
/assets/index-B9czO7nj.js
/assets/index-DPDZk2Du.css
```

That means one of two hard facts is true:

1. The production deploy did not rebuild from the patched source, or
2. The custom domain/CDN is still serving an older cached artifact.

My first direct chunk download attempt hit a 403 on the JS asset, so the next audit needs to use browser-grade requests and/or the Lovable published URL as a second source of truth.

## Plan

1. **Verify both production origins**
   - Check `https://nabulearn.com`
   - Check `https://nabulearn.lovable.app`
   - Compare their HTML, main JS hash, CSS hash, and asset accessibility.

2. **Download production JS with browser headers**
   - Fetch all JS chunks using realistic request headers.
   - If direct `curl` still gets 403, use Playwright/Chromium network capture because the browser can load what users load.

3. **Prove whether the patched code is live**
   - Search production chunks for:
     - `cdn.nabulearn.com`
     - `getCdnUrl`
     - `campaign-assets`
     - `avatars`
     - `prek-level-videos`
   - Specifically inspect the production chunks for:
     - `PreKLevelBuilder`
     - `StudentDashboard` / `AccountSection`
     - `CampaignModeEntry`
     - `CampaignVideoGate`
     - `CampaignAssetUploader`

4. **If production is still stale, force a frontend rebuild**
   - Make the smallest safe source change whose only purpose is to change the build output hash.
   - Do not change product behavior.
   - Then publish again.

5. **Post-publish verification**
   - Confirm the main bundle hash changed from `index-B9czO7nj.js`.
   - Confirm CDN references appear in the expected production chunks.
   - Confirm no public storage requests remain for migrated public buckets:
     - `avatars`
     - `campaign-assets`
     - `prek-level-videos`

6. **Cost conclusion**
   - Report only what production proves.
   - Separate confirmed R2/CDN traffic from remaining backend-storage egress.
   - Give scale costs only for traffic paths that are actually live, not assumed from source code.

## Success criteria

Production is only considered fixed when:

```text
main JS hash != index-B9czO7nj.js
cdn.nabulearn.com appears in the patched feature chunks
0 production browser requests hit public backend storage for avatars/campaign-assets/prek-level-videos
```

Until those are true, the honest status is: **not proven fixed**.