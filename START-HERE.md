# START HERE — Vidhyashram BoardPrep Lab CBT update

This is a complete website update, not a single-file patch. Extract the ZIP and upload the complete project contents to the root of your existing GitHub Pages repository. Keep all folder paths and file names unchanged.

## Files and folders that must be present

- `index.html` (home and test setup)
- `exam.html` (separate test-taking screen)
- `styles.css`
- `app.js`
- `questions.js`
- `source-questions.js`
- `mock-papers.js`
- `assets/pyq/` (all 749 original question-image crops)
- `mock-papers/`
- `.nojekyll`

Also keep the included README files. Do not upload only the HTML and JS files while omitting the `assets/pyq/` folder; the imported source questions use those images.

## What students will see

They choose Board, Class, Subject, Chapter/topic, test type and number of questions on the home page. When they press Start, the test opens on a different page. The exam hall has a timer, question palette, answer status colours, Previous, Clear Response, Mark for Review, Mark & Next, Save & Next, Submit, and optional full-screen mode. While a test is active, the setup page redirects to the exam hall.

## Imported source bank

The ZIP contains 624 Class 10 CBSE Science source questions (2023 paper collection) and 125 Class 12 CBSE Physics source questions (2026 paper collection), 749 in total. Their chapter, paper/set code, question number and original question image are preserved. Source answer keys are not auto-graded until teacher verification; written and case-based questions are saved for manual checking.

## Publish

1. Extract the ZIP.
2. Upload all files and folders to the root of the repository, replacing the matching older versions. Preserve `assets/pyq/` and `mock-papers/`.
3. Commit the changes to the GitHub Pages branch.
4. After deployment, open the live site and test the setup page, then start a small practice test to confirm it opens on the separate exam page. Refresh during a test to confirm it resumes.

GitHub Pages is static. This app provides an exam-style workflow and browser navigation guard, but it cannot provide secure kiosk mode or protected answer keys. Read `README.md` for the full limitations and mock-paper setup.
