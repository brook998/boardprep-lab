# Vidhyashram BoardPrep Lab — presentation readiness update

## Included
- Restored ordered chapter catalogue for CBSE Classes 10/12 and ISC Class 12.
- Integrated the 270-question original practice expansion (Easy/Moderate/Difficult).
- Added chapter-map.js to assign all 287 existing CBSE Class 10 Science PYQ records to their best-fit textbook chapter. Original PYQ IDs, years, paper codes, prompts, options, images and answer keys are unchanged.
- Chapter dropdown displays the number of automatically gradable questions in each chapter.
- Both setup and exam pages load the catalogue, PYQ mapping and practice expansion before app.js.
- Service worker cache version bumped and app code uses network-first with offline fallback. Saved progress remains separate from website files.

## Upload
Upload these seven files to the repository root, replacing existing files:
- app.js
- index.html
- exam.html
- sw.js
- chapter-catalog.js
- practice-expansion.js
- chapter-map.js (new)

Do NOT replace questions.js or source-questions.js. Do NOT delete existing image bundles/assets.

## Important data note
Chapter mapping is based on the existing question stems/options and manual topic rules. It is a classification pass, not a fresh independent audit of every source paper page. A teacher should review any disputed chapter assignment before using it as an official teaching taxonomy. Existing source answer keys and paper metadata are not modified.

## Local progress vs website updates
localStorage stores student progress and the active test; it does not store HTML/JS website code. Old code can persist through the service-worker cache. This release increments the cache version, removes older app caches on activation, and uses network-first for HTML/JS/CSS while keeping offline fallback. If an old build still appears, close the installed PWA/browser tab, reopen the site online and refresh once.

## Test checklist
1. Open Class 10 CBSE Science PYQ and confirm all 13 chapters appear in textbook order.
2. Select a chapter and verify the question count is non-zero where mapped.
3. Start a new PYQ test and confirm paper year/code and original full-page image load.
4. Start a practice test and test Easy/Moderate/Difficult.
5. Refresh during an active test: it should resume. Submit: results should persist.
6. Check Class 12 Physics PYQ and mock-test preview/timer separately.

## Limits
This is a static GitHub Pages app. Progress is local to one browser/device; it is not synced between students or visible to teachers. Mock codes and question data are not secure authentication or proctoring. Teacher checking remains an offline workflow for mock tests.
