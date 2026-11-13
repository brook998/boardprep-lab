/*
  VIDHYASHRAM MOCK PAPER REGISTRY

  To publish a mock paper:
  1. Add its PDF inside the mock-papers/ folder.
  2. Add one object to window.MOCK_PAPERS below.
  3. Use a unique code and enter the correct class, board, subject, duration and marks.
  4. Commit mock-papers.js and the PDF to the website repository.

  Example (remove the leading // from each line when you are ready to use it):

  {
    code: 'VID10SCI-M01',
    title: 'Class 10 Science · Full Syllabus Mock 1',
    class: '10',
    board: 'CBSE',
    subject: 'Science',
    durationMinutes: 180,
    maxMarks: 80,
    pdf: 'mock-papers/class10-science-mock01.pdf',
    instructions: 'Read all instructions on the paper before beginning.'
  }

  IMPORTANT:
  GitHub Pages is public static hosting. Codes in this file and PDF URLs are not secret;
  a code is a paper selector, not secure authentication. Do not upload confidential papers
  that must be restricted to a particular student group. A private paper portal requires
  a backend with authentication and protected file storage.
*/
window.MOCK_PAPERS = [
  // Add your published mock papers here.
];
