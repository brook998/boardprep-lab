# Vidhyashram · BoardPrep Lab

A mobile-friendly CBSE/ISC practice and PYQ platform with a separate computer-based test screen inspired by the NTA/JEE question-palette workflow. This is an educational interface inspired by common CBT patterns, not an official NTA product or a secure proctoring client.

## Student flow

1. **Test setup (`index.html`)** — select Board, Class, Subject, Chapter/topic, test type, question count and (for timed tests) duration.
2. **Exam hall (`exam.html`)** — a separate screen with timer, question palette, question status colours, answer controls, mark-for-review, clear response, save-and-next and optional full-screen mode. The palette allows direct navigation among questions.
3. **Submission and review** — students see the submission summary, automatic score where a verified auto-gradable bank item exists, and imported source questions awaiting teacher checking. Answers are not shown before submission.

An active test is saved locally and resumes after refresh. Opening the setup page while a test is active redirects to the exam hall. The browser Back action is guarded while the session is active. This is an app-level navigation guard, not an operating-system kiosk lock.

## Question bank included

- **79 existing app-ready questions** in `questions.js`, with their existing automatic marking behaviour.
- **624 Class 10 CBSE Science source questions** across 13 chapters, tagged to the 2023 paper collection.
- **125 Class 12 CBSE Physics source questions** across 8 chapters, tagged to the 2026 paper collection.
- **749 imported source questions total**, with chapter, year, paper/set code, source question number and a cropped original question image. The image is shown in each imported question so students can check diagrams, symbols and options against the original.
- Source MCQs use A/B/C/D response controls. Written and case-based questions use a saved text response for manual teacher checking.

### Important source-question grading note

Imported PYQ answer keys are **not used for automatic marking yet**. The Science source transcription has 240 objective answer letters from matching 2023 marking schemes and 80 objective items without a confirmed key. The Physics archive contains 125 answer letters copied from its chapter key tables, but these have not been independently verified. OCR can misread mathematical symbols, diagrams and option order. The answer key and OCR text should be checked against the supplied original question image before enabling automatic grading. Written/case-based questions are not auto-marked. This is deliberate to avoid incorrect student results.

## Project files

- `index.html` — home and test setup page.
- `exam.html` — dedicated test-taking page.
- `styles.css` — responsive home and NTA/JEE-inspired exam interface.
- `app.js` — test selection, timer, exam navigation guard, response persistence and results.
- `questions.js` — the original 79 app-ready questions.
- `source-questions.js` — the imported 749-question source bank.
- `assets/pyq/` — original question images, one WebP per imported source question. Preserve the folder path.
- `mock-papers.js` and `mock-papers/` — teacher-managed mock paper codes and PDFs.

## Publish/update on GitHub Pages

Upload the **complete contents** of this project ZIP to the repository root, preserving the `assets/pyq/` folder and the `mock-papers/` folder. Replace matching files and add new ones. In particular, do not omit `exam.html`, `source-questions.js`, or any files under `assets/pyq/`. Then commit the changes to the GitHub Pages branch.

The script order in both `index.html` and `exam.html` must remain:

1. `questions.js`
2. `source-questions.js`
3. `mock-papers.js`
4. `app.js`

## Add a Mock Test

1. Put the complete teacher-approved PDF in `mock-papers/`.
2. Register its code in `mock-papers.js`, for example:

```js
window.MOCK_PAPERS = [
  {
    code: 'VID10SCI-M01',
    title: 'Class 10 Science · Full Syllabus Mock 1',
    class: '10',
    board: 'CBSE',
    subject: 'Science',
    durationMinutes: 180,
    maxMarks: 80,
    pdf: 'mock-papers/class10-science-mock01.pdf',
    instructions: 'Read all instructions printed on the paper.'
  }
];
```

3. Use a unique code and set the duration and marks for that exact paper.
4. Commit the JS file and PDF. Students enter the code, review the paper details, and can open/print or download the paper before starting the timer. The full paper is displayed in the separate exam hall. Mock papers are manually checked by the teacher, as requested.

## Static-hosting limitations

GitHub Pages is public static hosting. Mock codes are paper selectors, not secure authentication. A published PDF can be opened directly, and the JavaScript question bank and answer keys can be inspected by a technically capable user. The browser cannot prevent developer tools, downloads, a second device or clearing local storage. The active-test guard applies within the same browser profile/device; it is not a cross-device lock or proctoring system. Full-screen mode is optional and browser-controlled.

For confidential papers, protected answer keys, centralized student accounts, server-side scoring and true exam controls, the site would need a backend with authentication and protected storage.

## Local data

Progress, bookmarks, mistakes and active tests are stored in the student's browser. Clearing browser data or changing device/browser removes that local record. There is no central teacher dashboard or account system in this static version.
