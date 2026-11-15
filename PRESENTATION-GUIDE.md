# Vidhyashram BoardPrep Lab — presentation guide

## Suggested 7-minute teacher demonstration

1. Open the home page and introduce the supported courses: CBSE Classes 10 and 12, and ISC Class 12. ICSE Class 10 is intentionally not included.
2. Select CBSE Class 10 → Science → a chapter. Point out that the chapter list follows the textbook sequence and now shows question counts.
3. Start a Practice Test. Show Easy, Moderate and Difficult selection, question navigation, marking for review, and the report after submission.
4. Open PYQ mode. Show the year, paper/set code, chapter filter, and original full-page paper reference.
5. Show the separate exam screen, timer, question palette and submit confirmation.
6. Show the Mock Test preview. Explain that the mock paper is fixed, not randomly assembled, and subjective marking is done by the teacher offline.
7. Show the result JPG and local progress/revision features.

## Suggested 5-minute student demonstration

- Choose class, board, subject, chapter and difficulty.
- Choose Practice for learning or Timed/PYQ for exam-style practice.
- Answer, navigate, mark for review and submit.
- Review score and explanations after submission.
- Use saved questions/mistakes for revision.

## What the current site can and cannot do

- It is an installable Progressive Web App (PWA) hosted as a static GitHub Pages site.
- Test progress and active sessions are saved in the same browser/device using localStorage.
- Progress is not automatically shared with teachers or synced to another phone.
- A static mock code is a paper selector, not secure login. The app is not a proctoring system.
- The teacher checks mock-test descriptive answers offline; ordinary practice/PYQ tests are auto-graded only when a verified answer is present.
- Students can inspect static JavaScript and question data. Do not treat this as a secure high-stakes exam platform.

## Recommended next phase before a full coaching rollout

1. Add student accounts or unique student IDs with a backend database so teachers can see results across devices.
2. Build a teacher dashboard: create/assign mock papers, publish answer keys, view class/chapter accuracy and export reports.
3. Add a question-import workflow with validation for chapter, question type, answer key, year, paper code and image references.
4. Add an admin review state for unverified answer keys and ambiguous chapter assignments.
5. Run a supervised pilot with a small student group on Android and desktop; collect usability feedback before wider release.
6. Keep backups/versioned releases so the coaching can roll back if a deployment introduces a problem.

## Important release note

The 287 Class 10 Science PYQs are assigned to their best-fit chapter using question text/options and targeted topic rules. Their original question IDs, year, paper code, question text, options, image references and answer keys are unchanged. Treat the chapter mapping as an audited first pass; a subject teacher should review disputed placements before using chapter analytics as formal academic evidence.
