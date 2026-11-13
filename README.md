# BoardPrep Lab — starter project

A mobile-friendly, static board-exam practice website for:

- Class 10 — CBSE — Mathematics and Science
- Class 12 — CBSE — Physics, Chemistry and Mathematics
- Class 12 — ISC — Physics, Chemistry and Mathematics

## What works in this starter version

- Chapter and difficulty filters
- Practice mode with immediate checking and explanations
- Timed test mode with automatic submission when time runs out
- MCQ, numerical and fill-in-the-blank checking
- Random question selection from the available question bank
- Score, percentage, accuracy and answer review
- Basic topic-level practice insights
- CSV download of a completed test report
- Local progress history in the current browser/device
- No sign-up, database, API key or backend required

## Important limitations

1. The questions in `questions.js` are original demo questions intended to test the software. They are not a complete syllabus, a verified PYQ collection or an official board paper bank.
2. The answer key is delivered to the browser. This is a practice website, not a secure examination system.
3. Progress is saved in local browser storage. It does not sync across devices or browsers and may be lost if browser data is cleared.
4. Descriptive responses are not automatically marked. Use model answers/marking schemes for self-assessment.
5. The first version is deliberately static so it can be hosted free on GitHub Pages.

## Files

- `index.html` — page structure
- `styles.css` — visual design and responsive layout
- `app.js` — test engine, checking, timer, progress and reports
- `questions.js` — editable question bank

## Add or edit questions

Open `questions.js` and add objects to `window.QUESTION_BANK` using the same structure as the examples. Every question needs a unique `id`.

### Multiple choice

```js
{
  id: '10m06',
  class: '10',
  board: 'CBSE',
  subject: 'Mathematics',
  chapter: 'Triangles',
  topic: 'Similarity criteria',
  difficulty: 'Moderate',
  type: 'mcq',
  prompt: 'Which condition is sufficient to establish similarity of two triangles?',
  options: ['AAA', 'Only one equal side', 'Only one equal angle', 'No equal angles'],
  answer: 'AAA',
  marks: 1,
  explanation: 'If corresponding angles are equal, the triangles are similar by the AAA criterion.'
}
```

### Numerical

```js
{
  id: '12cbp05',
  class: '12',
  board: 'CBSE',
  subject: 'Physics',
  chapter: 'Current Electricity',
  topic: 'Ohm’s law',
  difficulty: 'Easy',
  type: 'numeric',
  prompt: 'A 2 Ω resistor carries 3 A. Find the potential difference.',
  answer: 6,
  tolerance: 0.01,
  unit: 'V',
  marks: 2,
  explanation: 'V = IR = 3 × 2 = 6 V.'
}
```

### Fill in the blank

```js
{
  id: '10s06',
  class: '10',
  board: 'CBSE',
  subject: 'Science',
  chapter: 'Chemical Reactions and Equations',
  topic: 'Oxidation',
  difficulty: 'Easy',
  type: 'blank',
  prompt: 'Gain of oxygen is called ______.',
  accepted: ['oxidation'],
  marks: 1,
  explanation: 'Gain of oxygen is oxidation.'
}
```

Allowed values:

- `class`: `'10'` or `'12'`
- `board`: `'CBSE'` or `'ISC'`
- `subject`: use the subject names exactly as shown in the existing bank (`Mathematics`, `Science`, `Physics`, `Chemistry`)
- `difficulty`: `'Easy'`, `'Moderate'` or `'Difficult'`
- `type`: `'mcq'`, `'numeric'` or `'blank'`

For a numerical, `tolerance` is the allowed absolute difference. For a fill-in-the-blank, provide all accepted alternatives in `accepted`.

## Publish free with GitHub Pages

1. Create or sign in to a GitHub account.
2. Create a **public** repository, for example `boardprep-lab`.
3. Upload all four project files (`index.html`, `styles.css`, `app.js`, `questions.js`) and this README. Keep them in the repository's top/root folder.
4. In the repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select branch **main** and folder **/(root)**, then save.
7. Wait for GitHub Pages to publish. The address will be similar to `https://YOUR-USERNAME.github.io/boardprep-lab/`.

GitHub's menus can change. Use the Pages section shown in the repository Settings if the labels differ.

## Before sharing with students

- Test every question and every answer key.
- Open the site on at least one Android phone and one desktop/laptop.
- Try each class/board/subject combination.
- Test timer expiry and CSV download.
- Add a short privacy note for students: progress remains in that browser, and the site does not ask for personal details.
- Do not upload confidential student records or private examination material.
