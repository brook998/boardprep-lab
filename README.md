# Vidhyashram · BoardPrep Lab

A static, mobile-friendly test practice site for Classes 10 and 12.

## What's included

- **Practice Test** — builds a question set from the selected class, board, subject and chapter.
- **Timed Test** — the same question-bank flow with a countdown timer.
- **PYQ Test** — uses only questions with a verified `year` field in `questions.js`. It shows the year and paper/set label with the question. The current 79-question app-ready bank does not yet contain verified year metadata, so the PYQ mode will correctly show no available questions until verified PYQs are tagged.
- **Mock Test** — loads the exact teacher-uploaded PDF associated with the student's mock code. It does not shuffle or generate questions. Students can view, open/print or download the PDF. The timer is configured for each paper.
- **One active test** — an unfinished session is saved in local storage, restored after refresh and shared across tabs in the same browser profile. Previous app progress is migrated from the older BoardPrep Lab storage key. A second test cannot start until the active one is submitted or its timer ends.
- **Post-submission review** — correct answers and explanations appear only after submission, never while a test is running.
- **Revision tools** — question navigator, mark-for-review, save-question, retry-mistakes and saved-question revision.
- **Progress** — chapter-level performance, recent sessions and downloadable JPG test report.

## Files

- `index.html` — page structure and academy branding.
- `styles.css` — responsive mobile-first design.
- `app.js` — test flow, timer, active-session lock, result checking and progress.
- `questions.js` — current app-ready question bank.
- `mock-papers.js` — teacher-maintained list of published mock codes and paper metadata.
- `mock-papers/` — place mock-paper PDFs in this folder.

## Publish/update on GitHub Pages

1. Open the repository that currently hosts BoardPrep Lab.
2. Replace `index.html`, `styles.css`, `app.js` and `questions.js` with the matching files from this project.
3. Add `mock-papers.js` at the repository root.
4. Add the `mock-papers/` folder if you have PDF papers to publish.
5. Commit the changes. GitHub Pages will update the site after its deployment finishes.

Keep all file names and lower/upper case exactly as shown. The script order at the bottom of `index.html` must remain: `questions.js`, `mock-papers.js`, then `app.js`.

## Add a verified PYQ

A question appears in PYQ Test only when it has a confirmed year. Add the metadata to that question object in `questions.js`:

```js
{
  id: '10s-pyq-2023-01',
  class: '10',
  board: 'CBSE',
  subject: 'Science',
  chapter: 'Electricity',
  topic: 'Ohm law',
  difficulty: 'Moderate',
  type: 'mcq',
  prompt: 'Question text...',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  answer: 'Option B',
  year: 2023,
  isPYQ: true,
  paperCode: 'Set 1',
  questionNumber: 12,
  marks: 1,
  explanation: 'Verified explanation...'
}
```

Only add `year`, `paperCode`/`set` and `questionNumber` after checking the original paper. The PYQ test will preserve paper/question order rather than randomly shuffling the PYQs.

## Add a Mock Test

1. Put the complete question paper PDF in `mock-papers/`, for example `mock-papers/class10-science-mock01.pdf`.
2. Open `mock-papers.js` and add a new object to `window.MOCK_PAPERS`:

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

3. Add more papers as more objects in that same array. Each code must be unique.
4. Set `durationMinutes` and `maxMarks` according to that exact class/subject paper. The website uses the values you provide; it does not guess the duration.
5. Commit `mock-papers.js` and the PDF. Students enter the matching code under Mock Test, preview the paper details, and can open/print or download the PDF before starting the timer. The timer begins only after they press “Start timer and open test”.

### Important hosting limitation

This site uses GitHub Pages, which is public static hosting. The mock code is a **paper selector**, not secure authentication. The code list and PDF paths can be inspected by anyone who can access the repository/site, and a PDF URL may be shared directly. Do not upload confidential or unreleased examination papers that must be restricted to selected students. A truly private teacher upload portal requires a backend with student authentication and protected file storage.

The timer is enforced by the browser app. It cannot control a PDF after a student has downloaded or printed a copy, nor can local browser storage synchronize test status across devices.

## Local data

Progress, bookmarks, mistake lists and an active session are stored in the student's browser using local storage. Clearing browser data or changing device/browser removes that local record. There is no student account or central teacher dashboard in this static version.


### Answer-key and exam-security limitation

The interface hides correct answers and explanations until submission, as requested. However, the question bank and its answer keys are delivered to the student's browser in `questions.js`; a technically capable user can inspect those files before submitting. For high-stakes examinations with protected answer keys, scoring and papers, use a backend that serves questions securely and checks answers server-side.
