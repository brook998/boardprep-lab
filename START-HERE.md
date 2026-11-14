VIDHYASHRAM BOARDPREP LAB — ANDROID UPDATE GUIDE

1. Extract this ZIP on your Android phone.
2. Open your GitHub repository main page: https://github.com/brook998/boardprep-lab
3. Tap Add file → Upload files.
4. Select the root files from this extracted release, replace existing files when asked, then Commit changes.
5. Keep the three `pyq-images-...js` files in the repository root. Do not move them into `assets/pyq`.
6. Do not delete the old `assets` folder until we confirm the new full-page images load.
7. After commit, wait for GitHub Pages to publish, then refresh Chrome and start a NEW test. The active-test storage key and service-worker cache were versioned so stale sessions/cache are not reused.

Normal Practice, Timed and PYQ tests now include only automatically gradable MCQs and numericals. Teacher checking is reserved for Mock Tests.

Install on Android: Chrome menu (⋮) → Install app / Add to Home screen. This installs a PWA shortcut/app window, not a native Play Store APK.

Coverage note: the current Class 10 bank is an English-only verified tranche, not all 33 standard paper sets from the two supplied ZIPs. See PYQ-AUDIT.json and README.md for the exact coverage and the scanned sets still awaiting verification.
