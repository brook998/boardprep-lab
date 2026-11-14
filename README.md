# Vidhyashram BoardPrep Lab — English PYQ + installable web-app update

## Changes in this release

- The old Class 10 source PYQ import labelled 2023 is removed from the source PYQ bank. Existing non-PYQ general practice questions remain in `questions.js`.
- Class 10 Science PYQs in this release use English-medium pages from the supplied 2025 and 2026 CBSE papers only.
- Ordinary Practice, Timed and PYQ tests admit only MCQs and numericals with a usable answer. Descriptive/written and fill-in-the-blank questions are excluded.
- The teacher-checking language and workflow are reserved for Mock Tests only. Ordinary test results are automatically scored.
- Three 2026 Class 10 Science direct-entry resistivity numericals have been added as numeric response questions (papers 31/1/1, 31/1/2 and 31/1/3).
- Question text is normalised as selectable text. Source images are full English paper pages and are displayed with `height:auto` and `object-fit:contain`; they are not cropped.
- Class 10 image data is bundled by year in `pyq-images-class10-2025.js` and `pyq-images-class10-2026.js`; these load lazily when a PYQ is opened.
- The existing Class 12 Physics source bank is preserved.
- Android installable PWA support is included through `manifest.webmanifest`, icons and `sw.js`. Cache version is bumped to v3 so an older service-worker shell is replaced.

## Question bank coverage (important)

- Class 10 PYQs currently in the release: **287** (121 from 2025 and 166 from 2026).
- Of these, **284 are MCQs** and **3 are direct-entry numericals**.
- The MCQ tranche currently covers **21 standard paper codes**: 9 from 2025 series 31/1–31/3, and 12 from 2026 series 31/2–31/5.
- The three numeric items are from 2026 series 31/1, sets 1–3.
- **Not all papers in the two ZIPs are in this release yet.** The remaining scanned 2025 series 31/4–31/6 MCQ sections and the 2026 series 31/1 MCQ sections were not added because their OCR extraction still requires question-by-question verification. I have not guessed those questions or keys. They remain for a follow-up import.
- Class 12 Physics source PYQs preserved: **124**.

See `PYQ-AUDIT.json` for counts and exact included paper codes.

## Upload from Android Chrome

1. Extract this ZIP on your phone.
2. Open `https://github.com/brook998/boardprep-lab` in Chrome and go to the repository's main page (the page that contains `index.html`).
3. Tap **Add file → Upload files**.
4. Select the files from this ZIP and commit them. Replace existing files when asked.
5. Upload the root files; do not place the JavaScript image bundles inside `assets/pyq`.

Replace existing: `index.html`, `exam.html`, `app.js`, `styles.css`, `questions.js`, `source-questions.js`, `mock-papers.js`, `pyq-images-class10-2025.js`, `pyq-images-class10-2026.js`, `pyq-images-class12.js` (keep this file), and `sw.js`.
Add if missing: `manifest.webmanifest`, `pwa-icon-192.png`, `pwa-icon-512.png`, `.nojekyll`, and the `mock-papers/README.md` file/folder.

Do not delete your old `assets/` folder until you confirm the new Class 10 PYQ pages load on the live site. The new source pages use the year bundles at repository root.

## Install BoardPrep Lab as an Android app

After GitHub Pages has published the update:
1. Open `https://brook998.github.io/boardprep-lab/` in Chrome.
2. Tap Chrome's three-dot menu.
3. Choose **Install app** or **Add to Home screen** (the exact wording depends on Chrome version).
4. The site will appear as an app icon on your phone.

This is a **Progressive Web App (PWA)**, not a native APK or Play Store app. It can open in its own app window and cache files after they have been fetched once. Initial use and new downloads still require internet.

## Important limitations

- This remains a static GitHub Pages application. Students' progress is stored locally in the browser; there is no central student database, server-side code or secure proctoring.
- Questions and answer keys are included client-side and can be inspected by a technically skilled visitor.
- Scanned paper sets whose text/key mapping has not been fully verified are omitted, not guessed. They can be added in a later import once verified.
