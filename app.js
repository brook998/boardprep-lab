(() => {
  'use strict';

  const bank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
  const mockPapers = Array.isArray(window.MOCK_PAPERS) ? window.MOCK_PAPERS : [];
  const STORAGE_KEY = 'vidhyashram-boardprep-progress-v2';
  const LEGACY_STORAGE_KEY = 'boardprep-lab-progress-v1';
  const ACTIVE_KEY = 'vidhyashram-boardprep-active-v3';
  const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const $ = (id) => document.getElementById(id);
  const isExamPage = document.body.classList.contains('exam-page');

  const els = {
    setupForm: $('setupForm'), questionModeFields: $('questionModeFields'), mockConfigWrap: $('mockConfigWrap'),
    classSelect: $('classSelect'), boardSelect: $('boardSelect'), subjectSelect: $('subjectSelect'),
    chapterSelect: $('chapterSelect'), difficultySelect: $('difficultySelect'), modeSelect: $('modeSelect'),
    countSelect: $('countSelect'), pyqYearWrap: $('pyqYearWrap'), pyqYearSelect: $('pyqYearSelect'),
    durationWrap: $('durationWrap'), durationInput: $('durationInput'), mockCodeInput: $('mockCodeInput'),
    mockPreviewCard: $('mockPreviewCard'), mockPreviewTitle: $('mockPreviewTitle'), mockPreviewMeta: $('mockPreviewMeta'),
    mockPreviewOpenLink: $('mockPreviewOpenLink'), mockPreviewDownloadLink: $('mockPreviewDownloadLink'), confirmMockStartBtn: $('confirmMockStartBtn'),
    availableCount: $('availableCount'), formMessage: $('formMessage'), startBtn: $('startBtn'),
    welcomePanel: $('welcomePanel'), sessionPanel: $('sessionPanel'), resultPanel: $('resultPanel'),
    mockCompletePanel: $('mockCompletePanel'), mockCompleteDetails: $('mockCompleteDetails'), mockBackBtn: $('mockBackBtn'),
    sessionMeta: $('sessionMeta'), sessionTitle: $('sessionTitle'), timerBox: $('timerBox'), timerText: $('timerText'),
    testProgressArea: $('testProgressArea'), questionCounter: $('questionCounter'), answeredCounter: $('answeredCounter'),
    progressFill: $('progressFill'), questionNavigator: $('questionNavigator'), questionArea: $('questionArea'),
    questionNav: $('questionNav'), fullscreenBtn: $('fullscreenBtn'), prevBtn: $('prevBtn'), nextBtn: $('nextBtn'), markReviewBtn: $('markReviewBtn'),
    bookmarkBtn: $('bookmarkBtn'), clearResponseBtn: $('clearResponseBtn'), markNextBtn: $('markNextBtn'), finishBtn: $('finishBtn'), exitSessionBtn: $('exitSessionBtn'), sessionHint: $('sessionHint'),
    submitDialog: $('submitDialog'), submitSummary: $('submitSummary'), cancelSubmitBtn: $('cancelSubmitBtn'), keepTestingBtn: $('keepTestingBtn'), confirmSubmitBtn: $('confirmSubmitBtn'),
    activeLockNotice: $('activeLockNotice'), savedRevisionBtn: $('savedRevisionBtn'), mistakeRevisionBtn: $('mistakeRevisionBtn'),
    savedCount: $('savedCount'), mistakeCount: $('mistakeCount'), resultScore: $('resultScore'), resultPercent: $('resultPercent'),
    resultAccuracy: $('resultAccuracy'), resultAttempted: $('resultAttempted'), resultCorrect: $('resultCorrect'),
    resultWrong: $('resultWrong'), resultInsight: $('resultInsight'), reviewCount: $('reviewCount'), reviewList: $('reviewList'),
    resultChapterBreakdown: $('resultChapterBreakdown'), tryAgainBtn: $('tryAgainBtn'), downloadResultBtn: $('downloadResultBtn'),
    statAttempts: $('statAttempts'), statAverage: $('statAverage'), statBest: $('statBest'), statTried: $('statTried'),
    chapterPerformance: $('chapterPerformance'), recentSessions: $('recentSessions'), resetProgressBtn: $('resetProgressBtn'),
    howDialog: $('howDialog'), howItWorksBtn: $('howItWorksBtn'), closeDialogBtn: $('closeDialogBtn'), gotItBtn: $('gotItBtn')
  };

  let session = null;
  let timerInterval = null;
  let latestResult = null;
  let pendingMockPaper = null;
  let progress = loadProgress();

  function loadProgress() {
    const empty = { attempts: [], bookmarks: [], mistakes: [], mockAttempts: [] };
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const legacy = current ? null : localStorage.getItem(LEGACY_STORAGE_KEY);
      const data = JSON.parse(current || legacy || '{}');
      return {
        attempts: Array.isArray(data.attempts) ? data.attempts : [],
        bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
        mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
        mockAttempts: Array.isArray(data.mockAttempts) ? data.mockAttempts : []
      };
    } catch (error) {
      return empty;
    }
  }

  function persistProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Could not save progress in this browser.', error);
    }
    updateRevisionCounts();
  }

  function readActiveSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
      if (!saved || !Array.isArray(saved.questions) || !saved.mode || !saved.id) return null;
      return saved;
    } catch (error) {
      return null;
    }
  }

  function persistActiveSession() {
    if (!session) return;
    session.updatedAt = Date.now();
    session.updatedBy = TAB_ID;
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
    } catch (error) {
      console.warn('Could not save the active test in this browser.', error);
    }
  }

  function clearActiveSession() {
    try { localStorage.removeItem(ACTIVE_KEY); } catch (error) { /* Storage may be unavailable. */ }
  }

  function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function setSelectOptions(select, values, firstLabel, firstValue) {
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = firstValue;
    first.textContent = firstLabel;
    select.append(first);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value);
      select.append(option);
    });
    select.value = values.map(String).includes(previous) ? previous : firstValue;
  }

  function isRegularEligibleQuestion(q) {
    // Standard Practice, Timed and PYQ tests contain only gradable MCQs and numericals.
    // Descriptive/written and fill-in-the-blank questions are excluded; manual review is for Mock Tests only.
    const allowed = ['mcq', 'source-mcq', 'numeric'].includes(q.type);
    const keyedSource = q.type !== 'source-mcq' || (q.gradingStatus === 'verified' && /^[ABCD]$/.test(String(q.answerKeyLetter || '')));
    const keyedNumeric = q.type !== 'numeric' || Number.isFinite(Number(q.answer));
    const keyedMcq = q.type !== 'mcq' || (q.answer !== undefined && q.answer !== null && String(q.answer).trim() !== '');
    return allowed && keyedSource && keyedNumeric && keyedMcq;
  }

  function currentScopeQuestions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subject = els.subjectSelect.value;
    const chapter = els.chapterSelect.value;
    const difficulty = els.difficultySelect.value;
    // Ordinary Practice, Timed and PYQ tests contain only automatically gradable MCQs and numericals.
    // Descriptive/written and fill-in-the-blank items are reserved out of the regular test flow.
    return bank.filter((q) => isRegularEligibleQuestion(q) && q.class === cls && q.board === board && q.subject === subject &&
      (chapter === 'all' || q.chapter === chapter) &&
      (difficulty === 'all' || q.difficulty === difficulty));
  }

  function isVerifiedPyq(question) {
    const year = Number(question.year);
    return Number.isInteger(year) && year >= 2000 && year <= new Date().getFullYear() && question.isPYQ !== false;
  }

  function refreshBoardOptions() {
    const cls = els.classSelect.value;
    const boards = uniqueSorted(bank.filter((q) => isRegularEligibleQuestion(q) && q.class === cls).map((q) => q.board));
    const previous = els.boardSelect.value;
    setSelectOptions(els.boardSelect, boards, 'Choose a board', '');
    els.boardSelect.value = boards.includes(previous) ? previous : (boards[0] || '');
    refreshSubjectOptions();
  }

  function refreshSubjectOptions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subjects = uniqueSorted(bank.filter((q) => isRegularEligibleQuestion(q) && q.class === cls && q.board === board).map((q) => q.subject));
    const previous = els.subjectSelect.value;
    setSelectOptions(els.subjectSelect, subjects, 'Choose a subject', '');
    const preferred = cls === '10' && board === 'CBSE' ? 'Science' : (cls === '12' && board === 'CBSE' ? 'Physics' : '');
    els.subjectSelect.value = subjects.includes(previous) ? previous : (subjects.includes(preferred) ? preferred : (subjects[0] || ''));
    refreshChapterOptions();
  }

  function refreshChapterOptions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subject = els.subjectSelect.value;
    const chapters = uniqueSorted(bank.filter((q) => isRegularEligibleQuestion(q) && q.class === cls && q.board === board && q.subject === subject).map((q) => q.chapter));
    const previous = els.chapterSelect.value;
    setSelectOptions(els.chapterSelect, chapters, 'All available chapters', 'all');
    if (chapters.includes(previous)) els.chapterSelect.value = previous;
    refreshPyqYears();
    updateAvailableCount();
  }

  function refreshPyqYears() {
    const pool = currentScopeQuestions().filter(isVerifiedPyq);
    const years = [...new Set(pool.map((q) => String(q.year)))].sort((a, b) => Number(b) - Number(a));
    const previous = els.pyqYearSelect.value;
    setSelectOptions(els.pyqYearSelect, years, years.length ? 'All verified years' : 'No verified years yet', 'all');
    if (years.includes(previous)) els.pyqYearSelect.value = previous;
    els.pyqYearSelect.disabled = years.length === 0;
  }

  function updateAvailableCount() {
    if (els.modeSelect.value === 'mock') {
      els.availableCount.textContent = mockPapers.length ? `${mockPapers.length} mock paper(s) published` : 'No mock papers published yet';
      return;
    }
    const pool = currentScopeQuestions();
    if (els.modeSelect.value === 'pyq') {
      const pyqs = pool.filter(isVerifiedPyq);
      const year = els.pyqYearSelect.value;
      const count = year && year !== 'all' ? pyqs.filter((q) => String(q.year) === year).length : pyqs.length;
      els.availableCount.textContent = `${count} verified PYQ${count === 1 ? '' : 's'} available`;
      return;
    }
    els.availableCount.textContent = `${pool.length} question${pool.length === 1 ? '' : 's'} available`;
  }

  function updateModeVisibility() {
    const mode = els.modeSelect.value;
    const mock = mode === 'mock';
    els.questionModeFields.classList.toggle('hidden', mock);
    els.mockConfigWrap.classList.toggle('hidden', !mock);
    els.pyqYearWrap.classList.toggle('hidden', mode !== 'pyq');
    els.durationWrap.classList.toggle('hidden', !['timed', 'pyq'].includes(mode));
    if (mock) {
      els.startBtn.innerHTML = 'Find mock paper <span aria-hidden="true">→</span>';
      pendingMockPaper = null;
      els.mockPreviewCard.classList.add('hidden');
    } else if (mode === 'pyq') {
      els.startBtn.innerHTML = 'Start PYQ test <span aria-hidden="true">→</span>';
    } else if (mode === 'timed') {
      els.startBtn.innerHTML = 'Start timed test <span aria-hidden="true">→</span>';
    } else {
      els.startBtn.innerHTML = 'Start practice test <span aria-hidden="true">→</span>';
    }
    if (mode === 'pyq') refreshPyqYears();
    updateAvailableCount();
    applyActiveLock();
  }

  function applyActiveLock() {
    const locked = Boolean(session);
    els.setupForm.querySelectorAll('input, select, button').forEach((control) => { control.disabled = locked; });
    els.savedRevisionBtn.disabled = locked || progress.bookmarks.length === 0;
    els.mistakeRevisionBtn.disabled = locked || progress.mistakes.length === 0;
    els.activeLockNotice.classList.toggle('hidden', !locked);
    if (locked) {
      els.startBtn.disabled = true;
      els.formMessage.textContent = 'Finish the current test before starting another one.';
    } else {
      els.formMessage.textContent = '';
      els.startBtn.disabled = false;
    }
  }

  function modeLabel(mode) {
    if (mode === 'practice') return 'PRACTICE TEST';
    if (mode === 'timed') return 'TIMED TEST';
    if (mode === 'pyq') return 'PREVIOUS-YEAR QUESTION TEST';
    if (mode === 'mock') return 'VIDHYASHRAM MOCK TEST';
    if (mode === 'revision') return 'REVISION SESSION';
    return 'TEST';
  }

  function createSession(questions, mode, scope, durationMinutes, extras = {}) {
    const now = Date.now();
    const durationSeconds = durationMinutes ? Math.max(60, Math.min(14400, Number(durationMinutes) * 60)) : 0;
    session = {
      id: `${now}-${Math.random().toString(36).slice(2)}`,
      mode,
      questions,
      answers: {},
      marked: {},
      visited: {},
      index: 0,
      startedAt: now,
      durationSeconds,
      endsAt: durationSeconds ? now + durationSeconds * 1000 : null,
      scope: scope || {},
      title: extras.title || '',
      mockPaper: extras.mockPaper || null,
      saved: false,
      updatedAt: now,
      updatedBy: TAB_ID
    };
    latestResult = null;
    beginActiveSession();
  }

  function startSession(event) {
    event.preventDefault();
    els.formMessage.textContent = '';
    if (session) {
      els.formMessage.textContent = 'A test is already active. Submit it before starting another.';
      return;
    }
    const stored = readActiveSession();
    if (stored) {
      session = stored;
      renderActiveSession(true);
      return;
    }

    if (els.modeSelect.value === 'mock') {
      startMockSession();
      return;
    }

    let pool = currentScopeQuestions();
    const mode = els.modeSelect.value;
    if (mode === 'pyq') {
      pool = pool.filter(isVerifiedPyq);
      const year = els.pyqYearSelect.value;
      if (year && year !== 'all') pool = pool.filter((q) => String(q.year) === year);
      pool = [...pool].sort(comparePyqOrder);
    }
    if (!pool.length) {
      els.formMessage.textContent = mode === 'pyq'
        ? 'No verified PYQs match this selection yet. A question must have a confirmed year in questions.js before it appears here.'
        : 'There are no questions for this selection yet.';
      return;
    }
    const requestedValue = els.countSelect.value;
    const requested = requestedValue === 'all' ? pool.length : (Number(requestedValue) || 10);
    const chosen = mode === 'pyq' ? pool.slice(0, Math.min(requested, pool.length)) : shuffle(pool).slice(0, Math.min(requested, pool.length));
    const duration = ['timed', 'pyq'].includes(mode) ? Math.max(1, Math.min(240, Number(els.durationInput.value) || 45)) : 0;
    const scope = { class: els.classSelect.value, board: els.boardSelect.value, subject: els.subjectSelect.value };
    const title = `${scope.subject} · ${chosen.length} questions`;
    createSession(chosen, mode, scope, duration, { title });
  }

  function comparePyqOrder(a, b) {
    const paperA = String(a.paperCode || a.paper || a.set || '');
    const paperB = String(b.paperCode || b.paper || b.set || '');
    const paperCompare = paperA.localeCompare(paperB);
    if (paperCompare !== 0) return paperCompare;
    const numberA = Number(a.questionNumber);
    const numberB = Number(b.questionNumber);
    if (Number.isFinite(numberA) && Number.isFinite(numberB)) return numberA - numberB;
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function lookupMockPaper() {
    const code = String(els.mockCodeInput.value || '').trim().toUpperCase();
    pendingMockPaper = null;
    els.mockPreviewCard.classList.add('hidden');
    if (!code) {
      els.formMessage.textContent = 'Enter the mock paper code shared by Vidhyashram.';
      return;
    }
    const paper = mockPapers.find((item) => String(item.code || '').trim().toUpperCase() === code);
    if (!paper) {
      els.formMessage.textContent = mockPapers.length
        ? 'That code was not found. Check the code and try again.'
        : 'No mock papers have been published yet. The academy will share a code when a paper is uploaded.';
      return;
    }
    if (!paper.pdf || !Number.isFinite(Number(paper.durationMinutes)) || Number(paper.durationMinutes) <= 0) {
      els.formMessage.textContent = 'This mock paper is not fully configured. Please contact Vidhyashram.';
      return;
    }
    pendingMockPaper = {
      code: String(paper.code),
      title: String(paper.title || 'Vidhyashram Mock Test'),
      class: String(paper.class || ''),
      board: String(paper.board || ''),
      subject: String(paper.subject || ''),
      durationMinutes: Number(paper.durationMinutes),
      maxMarks: Number(paper.maxMarks || 0),
      pdf: String(paper.pdf),
      instructions: String(paper.instructions || '')
    };
    els.mockPreviewTitle.textContent = pendingMockPaper.title;
    els.mockPreviewMeta.textContent = `Code ${pendingMockPaper.code} · Class ${pendingMockPaper.class} ${pendingMockPaper.board} · ${pendingMockPaper.subject} · ${pendingMockPaper.durationMinutes} minutes · ${pendingMockPaper.maxMarks || 'Marks as printed'} marks`;
    els.mockPreviewOpenLink.href = pendingMockPaper.pdf;
    els.mockPreviewDownloadLink.href = pendingMockPaper.pdf;
    els.mockPreviewCard.classList.remove('hidden');
    els.formMessage.textContent = '';
  }

  function startMockSession() {
    if (!pendingMockPaper) {
      lookupMockPaper();
      return;
    }
    const metadata = pendingMockPaper;
    const scope = { class: metadata.class, board: metadata.board, subject: metadata.subject };
    pendingMockPaper = null;
    els.mockPreviewCard.classList.add('hidden');
    createSession([], 'mock', scope, metadata.durationMinutes, { title: metadata.title, mockPaper: metadata });
  }

  function beginActiveSession() {
    persistActiveSession();
    if (!isExamPage) {
      window.location.assign('exam.html');
      return;
    }
    renderActiveSession(true);
    lockExamNavigation();
  }

  function renderActiveSession(startClock) {
    if (!session) return;
    latestResult = null;
    const setupMode = session.mode === 'revision' ? 'practice' : session.mode;
    if (els.modeSelect.value !== setupMode) {
      els.modeSelect.value = setupMode;
      updateModeVisibility();
    }
    if (session.mode !== 'mock' && session.scope.class) {
      if ([...els.classSelect.options].some((option) => option.value === String(session.scope.class))) {
        els.classSelect.value = String(session.scope.class);
        refreshBoardOptions();
        if ([...els.boardSelect.options].some((option) => option.value === String(session.scope.board))) {
          els.boardSelect.value = String(session.scope.board);
          refreshSubjectOptions();
        }
        if ([...els.subjectSelect.options].some((option) => option.value === String(session.scope.subject))) {
          els.subjectSelect.value = String(session.scope.subject);
          refreshChapterOptions();
        }
      }
    } else if (session.mode === 'mock' && session.mockPaper) {
      els.mockCodeInput.value = session.mockPaper.code;
    }
    els.welcomePanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    els.mockCompletePanel.classList.add('hidden');
    els.sessionPanel.classList.remove('hidden');
    els.sessionPanel.classList.toggle('mock-session-active', session.mode === 'mock');
    els.sessionMeta.textContent = modeLabel(session.mode);
    els.sessionTitle.textContent = session.title || `${session.scope.subject || 'Test'} · ${session.questions.length} questions`;
    const timed = Boolean(session.endsAt);
    els.timerBox.classList.toggle('hidden', !timed);
    els.testProgressArea.classList.toggle('hidden', session.mode === 'mock');
    els.questionNav.classList.toggle('hidden', session.mode === 'mock');
    if (session.mode === 'mock') {
      els.questionArea.replaceChildren();
      renderMockPaper();
      els.sessionHint.textContent = 'Write your answers offline. This mock paper is checked by the teacher, not by the tool.';
      els.finishBtn.textContent = 'Submit mock test';
      els.exitSessionBtn.textContent = 'Submit & end mock';
    } else {
      els.finishBtn.textContent = 'Submit test';
      els.exitSessionBtn.textContent = 'Submit & end session';
      els.sessionHint.textContent = 'Answers and explanations are hidden until submission.';
      renderQuestion();
    }
    applyActiveLock();
    stopTimer();
    if (timed) {
      updateTimer();
      if (session && session.endsAt && session.endsAt > Date.now()) timerInterval = window.setInterval(updateTimer, 1000);
    } else {
      els.timerBox.classList.add('hidden');
    }
    if (startClock) els.sessionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderMockPaper() {
    const paper = session && session.mockPaper;
    if (!paper) return;
    els.questionArea.replaceChildren();
    const meta = makeElement('div', 'mock-paper-meta');
    meta.append(makeElement('span', '', `CODE · ${paper.code}`));
    meta.append(makeElement('span', '', `CLASS ${paper.class} · ${paper.board}`));
    meta.append(makeElement('span', '', `${paper.subject} · ${paper.maxMarks || 'Marks as printed'}`));
    els.questionArea.append(meta);
    if (paper.instructions) els.questionArea.append(makeElement('p', 'mock-instructions', paper.instructions));
    const note = makeElement('div', 'mock-session-note', 'The exact teacher-uploaded question paper is shown below. Use the paper’s printed instructions and write answers offline.');
    els.questionArea.append(note);

    const toolbar = makeElement('div', 'mock-toolbar');
    const openButton = makeElement('button', 'button button-outline', 'Open / print PDF');
    openButton.type = 'button';
    openButton.addEventListener('click', () => window.open(paper.pdf, '_blank', 'noopener'));
    const downloadLink = makeElement('a', 'button button-primary', 'Download paper ↓');
    downloadLink.href = paper.pdf;
    downloadLink.download = '';
    toolbar.append(openButton, downloadLink);
    els.questionArea.append(toolbar);

    const frameWrap = makeElement('div', 'pdf-frame-wrap');
    const frame = document.createElement('iframe');
    frame.className = 'pdf-frame';
    frame.title = `${paper.title} question paper`;
    frame.src = paper.pdf;
    frame.loading = 'eager';
    frameWrap.append(frame);
    els.questionArea.append(frameWrap);
    els.sessionHint.textContent = 'Timer is running. The PDF can be viewed here or opened for printing / download.';
  }

  function updateFullscreenButton() {
    if (!els.fullscreenBtn) return;
    els.fullscreenBtn.textContent = document.fullscreenElement ? 'Exit full screen' : 'Enter full screen';
    els.fullscreenBtn.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {
        els.sessionHint.textContent = 'Your browser did not allow full-screen mode. The test will continue normally.';
      });
      return;
    }
    if (!document.documentElement.requestFullscreen) {
      els.sessionHint.textContent = 'Full-screen mode is not supported by this browser. The test will continue normally.';
      return;
    }
    document.documentElement.requestFullscreen().catch(() => {
      els.sessionHint.textContent = 'Full-screen mode was not allowed. You can still continue the test normally.';
    });
  }

  function stopTimer() {
    if (timerInterval !== null) window.clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimer() {
    if (!session || !session.endsAt) return;
    const remaining = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    els.timerText.textContent = hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    els.timerBox.classList.toggle('timer-danger', remaining <= 60);
    els.timerBox.classList.toggle('timer-warning', remaining > 60 && remaining <= 300);
    if (remaining <= 0) {
      stopTimer();
      finishSession(true);
    }
  }

  function questionIsAnswered(question) {
    return String(session?.answers?.[question.id] ?? '').trim() !== '';
  }

  function updateAnsweredCounter() {
    if (!session || session.mode === 'mock') return;
    const answered = session.questions.filter(questionIsAnswered).length;
    els.answeredCounter.textContent = `${answered} of ${session.questions.length} answered`;
    updateQuestionNavigator();
  }

  function updateQuestionNavigator() {
    if (!session || session.mode === 'mock') return;
    els.questionNavigator.replaceChildren();
    session.questions.forEach((question, index) => {
      const answered = questionIsAnswered(question);
      const marked = Boolean(session.marked?.[question.id]);
      const visited = Boolean(session.visited?.[question.id]) || index === session.index;
      let stateClass = 'not-visited';
      let stateLabel = 'not visited';
      if (answered && marked) { stateClass = 'answered-marked'; stateLabel = 'answered and marked for review'; }
      else if (marked) { stateClass = 'marked'; stateLabel = 'marked for review'; }
      else if (answered) { stateClass = 'answered'; stateLabel = 'answered'; }
      else if (visited) { stateClass = 'not-answered'; stateLabel = 'not answered'; }
      const button = makeElement('button', `navigator-button ${stateClass}`, String(index + 1));
      button.type = 'button';
      button.setAttribute('aria-label', `Question ${index + 1}, ${stateLabel}${index === session.index ? ', current question' : ''}`);
      if (index === session.index) button.classList.add('current');
      button.addEventListener('click', () => goToQuestion(index));
      els.questionNavigator.append(button);
    });
    const answered = session.questions.filter(questionIsAnswered).length;
    els.answeredCounter.textContent = `${answered} of ${session.questions.length} answered`;
  }

  const pyqImageBundlePromises = {};

  function loadPyqImageBundle(question) {
    const cls = String(question?.class || '10');
    const year = Number(question?.year || 0);
    const bundle = cls === '12' ? 'pyq-images-class12.js' : `pyq-images-class10-${year}.js`;
    if (pyqImageBundlePromises[bundle]) return pyqImageBundlePromises[bundle];
    pyqImageBundlePromises[bundle] = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = new URL(bundle, document.baseURI).href;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.append(script);
    });
    return pyqImageBundlePromises[bundle];
  }

  function renderSourceImage(question) {
    const filenames = (question.sourceImages && question.sourceImages.length
      ? question.sourceImages : (question.sourceImage ? [question.sourceImage] : []))
      .map((name) => String(name).split('/').pop());
    if (!filenames.length) return;
    const details = makeElement('details', 'source-image-details');
    details.open = true;
    const summary = makeElement('summary', '', 'Original English paper page(s) · full page, not cropped');
    details.append(summary);
    const holder = makeElement('div', 'source-image-pages');
    details.append(holder);
    const fallback = makeElement('p', 'source-image-fallback', 'The original paper page is unavailable. The question text and options above remain available.');
    els.questionArea.append(details);
    loadPyqImageBundle(question).then((loaded) => {
      const data = window.PYQ_IMAGE_DATA || {};
      let shown = 0;
      filenames.forEach((filename, index) => {
        const src = data[filename];
        if (!src) return;
        const figure = makeElement('figure', 'source-image-page');
        const caption = makeElement('figcaption', '', `Full page reference ${index + 1}`);
        const image = document.createElement('img');
        image.alt = `Uncropped original CBSE ${question.year || ''} Science paper page for question ${question.questionNumber || ''}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.src = src;
        image.addEventListener('error', () => figure.remove());
        figure.append(caption, image);
        holder.append(figure);
        shown += 1;
      });
      if (!shown || !loaded) {
        if (!fallback.isConnected) details.append(fallback);
      }
    });
  }

  function renderQuestion() {
    if (!session || session.mode === 'mock') return;
    const question = session.questions[session.index];
    const total = session.questions.length;
    session.answers = session.answers || {};
    session.marked = session.marked || {};
    session.visited = session.visited || {};
    session.visited[question.id] = true;
    persistActiveSession();
    els.questionCounter.textContent = `Question ${session.index + 1} of ${total}`;
    els.progressFill.style.width = `${((session.index + 1) / total) * 100}%`;
    els.prevBtn.disabled = session.index === 0;
    els.nextBtn.classList.toggle('hidden', session.index === total - 1);
    els.finishBtn.classList.remove('hidden');
    els.markReviewBtn.textContent = session.marked[question.id] ? 'Unmark review' : 'Mark for review';
    els.markNextBtn.textContent = session.marked[question.id] ? 'Next question' : 'Mark & Next';
    els.clearResponseBtn.disabled = !questionIsAnswered(question);
    const saved = progress.bookmarks.includes(question.id);
    els.bookmarkBtn.textContent = saved ? '★ Saved' : '☆ Save question';
    els.bookmarkBtn.classList.toggle('is-saved', saved);
    els.questionArea.replaceChildren();

    const kicker = makeElement('div', 'question-kicker');
    kicker.append(makeElement('span', '', question.chapter || 'General'));
    if (question.difficulty && question.type !== 'written' && question.type !== 'source-mcq') kicker.append(makeElement('span', '', question.difficulty));
    kicker.append(makeElement('span', 'marks-tag', `${question.marks || 1} mark${Number(question.marks || 1) === 1 ? '' : 's'}`));
    if (isVerifiedPyq(question)) {
      const pyqLabel = `${question.board || session.scope.board || 'PYQ'} ${question.year}${question.paperCode ? ` · ${question.paperCode}` : ''}${question.questionNumber ? ` · Q${question.questionNumber}` : ''}`;
      kicker.append(makeElement('span', 'year-tag', pyqLabel));
    }
    els.questionArea.append(kicker);
    if (question.sourceType) {
      const sourceLine = makeElement('p', 'source-question-meta', `Original paper ${question.paperCode || question.sourcePaper || 'code not listed'} · Question ${question.questionNumber || '—'} · ${question.year || 'Year unverified'}`);
      els.questionArea.append(sourceLine);
    }
    els.questionArea.append(makeElement('h3', 'question-prompt', String(question.prompt || '').replace(/\s+/g, ' ').trim()));
    if (question.sourceImage || question.sourceImages?.length) renderSourceImage(question);

    if (question.type === 'mcq' || question.type === 'source-mcq') {
      const options = makeElement('div', 'question-options');
      const sourceLetters = ['A', 'B', 'C', 'D'];
      const choiceValues = question.type === 'source-mcq' ? sourceLetters : (question.options || []);
      choiceValues.forEach((option, index) => {
        const value = question.type === 'source-mcq' ? sourceLetters[index] : String(option);
        const label = makeElement('label', 'option-label');
        if (session.answers[question.id] === value) label.classList.add('selected');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `answer-${question.id}`;
        radio.value = value;
        radio.checked = session.answers[question.id] === value;
        radio.addEventListener('change', () => {
          session.answers[question.id] = value;
          options.querySelectorAll('.option-label').forEach((item) => item.classList.remove('selected'));
          label.classList.add('selected');
          persistActiveSession();
          els.clearResponseBtn.disabled = false;
          updateAnsweredCounter();
        });
        const optionText = question.type === 'source-mcq' ? (question.options?.[index] || '') : option;
        const placeholder = /^Option [A-D]$/i.test(String(optionText).trim());
        const labelText = question.type === 'source-mcq'
          ? (optionText && !placeholder ? `${value}. ${optionText}` : `Option ${value}`)
          : `${String.fromCharCode(65 + index)}. ${option}`;
        label.append(radio, makeElement('span', '', labelText));
        options.append(label);
      });
      els.questionArea.append(options);
    } else if (question.type === 'written') {
      const wrap = makeElement('div', 'answer-input-wrap written-answer-wrap');
      const input = document.createElement('textarea');
      input.rows = Number(question.marks || 0) >= 4 ? 7 : (Number(question.marks || 0) >= 2 ? 4 : 2);
      input.autocomplete = 'off';
      input.placeholder = 'Write your answer here…';
      input.setAttribute('aria-label', 'Your written answer');
      input.value = session.answers[question.id] || '';
      input.addEventListener('input', () => {
        session.answers[question.id] = input.value;
        persistActiveSession();
        els.clearResponseBtn.disabled = !questionIsAnswered(question);
        updateAnsweredCounter();
      });
      wrap.append(input, makeElement('p', 'input-hint', 'Written responses are not included in standard Practice, Timed or PYQ tests.'));
      els.questionArea.append(wrap);
    } else {
      const wrap = makeElement('div', 'answer-input-wrap');
      const input = document.createElement('input');
      input.type = 'text';
      input.autocomplete = 'off';
      input.inputMode = question.type === 'numeric' ? 'decimal' : 'text';
      input.placeholder = question.type === 'numeric' ? 'Enter your numerical answer' : 'Type your answer';
      input.setAttribute('aria-label', 'Your answer');
      input.value = session.answers[question.id] || '';
      input.addEventListener('input', () => {
        session.answers[question.id] = input.value;
        persistActiveSession();
        els.clearResponseBtn.disabled = !questionIsAnswered(question);
        updateAnsweredCounter();
      });
      wrap.append(input);
      wrap.append(makeElement('p', 'input-hint', question.type === 'numeric'
        ? `Enter the number${question.unit ? ` (unit: ${question.unit})` : ''}. Equivalent decimal formatting is accepted.`
        : 'Capitalisation and extra spaces do not matter.'));
      els.questionArea.append(wrap);
    }
    updateQuestionNavigator();
  }

  function normaliseText(value) {
    return String(value ?? '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
  }

  function parseNumeric(value) {
    const cleaned = String(value ?? '').trim().replace(/[−–⁻]/g, '-').replace(/[⁺]/g, '+').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) => '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(digit)]).replace(/,/g, '').replace(/\s+/g, '');
    const fraction = cleaned.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
    }
    const powerForm = cleaned.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(?:×|x|\*)10\^?([+-]?\d+)/i);
    if (powerForm) return Number(powerForm[1]) * Math.pow(10, Number(powerForm[2]));
    const match = cleaned.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    return match ? Number(match[0]) : NaN;
  }

  function isCorrect(question, response) {
    if (String(response ?? '').trim() === '' || question.type === 'written' || question.gradingStatus === 'pending-review') return false;
    if (question.type === 'source-mcq') {
      return /^[ABCD]$/.test(String(question.answerKeyLetter || ''))
        && normaliseText(response) === normaliseText(question.answerKeyLetter);
    }
    if (question.type === 'mcq') return normaliseText(response) === normaliseText(question.answer);
    if (question.type === 'numeric') {
      const entered = parseNumeric(response);
      const target = Number(question.answer);
      if (!Number.isFinite(entered) || !Number.isFinite(target)) return false;
      return Math.abs(entered - target) <= Number(question.tolerance ?? 0.001);
    }
    const accepted = Array.isArray(question.accepted) ? question.accepted : [question.answer];
    return accepted.some((answer) => normaliseText(answer) === normaliseText(response));
  }

  function correctAnswerText(question) {
    if (question.type === 'source-mcq') {
      const letter = question.answerKeyLetter || '';
      const optionText = question.options?.['ABCD'.indexOf(letter)];
      return letter ? `Option ${letter}${optionText ? ` · ${optionText}` : ''}` : 'Answer key unavailable';
    }
    if (question.type === 'blank') return (question.accepted || [question.answer]).join(' / ');
    if (question.type === 'numeric') return question.answerDisplay || `${question.answer}${question.unit ? ` ${question.unit}` : ''}`;
    return String(question.answer ?? 'Not supplied');
  }

  function goToQuestion(index) {
    if (!session || session.mode === 'mock' || index < 0 || index >= session.questions.length) return;
    session.index = index;
    persistActiveSession();
    renderQuestion();
  }

  function goNext() {
    if (!session || session.mode === 'mock' || session.index >= session.questions.length - 1) return;
    goToQuestion(session.index + 1);
  }

  function goPrevious() {
    if (!session || session.mode === 'mock' || session.index <= 0) return;
    goToQuestion(session.index - 1);
  }

  function toggleMarked() {
    if (!session || session.mode === 'mock') return;
    const question = session.questions[session.index];
    session.marked[question.id] = !session.marked[question.id];
    persistActiveSession();
    renderQuestion();
  }

  function clearCurrentResponse() {
    if (!session || session.mode === 'mock') return;
    const question = session.questions[session.index];
    delete session.answers[question.id];
    persistActiveSession();
    renderQuestion();
  }

  function markReviewAndNext() {
    if (!session || session.mode === 'mock') return;
    const question = session.questions[session.index];
    session.marked[question.id] = true;
    persistActiveSession();
    if (session.index < session.questions.length - 1) goToQuestion(session.index + 1);
    else renderQuestion();
  }

  function toggleBookmark() {
    if (!session || session.mode === 'mock') return;
    const question = session.questions[session.index];
    const index = progress.bookmarks.indexOf(question.id);
    if (index >= 0) progress.bookmarks.splice(index, 1);
    else progress.bookmarks.push(question.id);
    persistProgress();
    renderQuestion();
  }

  function requestFinish() {
    if (!session) return;
    if (session.mode === 'mock') {
      const confirmed = window.confirm('End this mock test now? The paper will be recorded as submitted for offline checking.');
      if (confirmed) finishSession(false);
      return;
    }
    const answered = session.questions.filter(questionIsAnswered).length;
    const unanswered = session.questions.length - answered;
    const marked = session.questions.filter((question) => session.marked?.[question.id]).length;
    const notVisited = session.questions.filter((question, index) => !session.visited?.[question.id] && index !== session.index).length;
    els.submitSummary.replaceChildren();
    [
      ['Answered', answered],
      ['Not answered', unanswered],
      ['Marked for review', marked],
      ['Not visited', notVisited]
    ].forEach(([label, value]) => {
      const row = makeElement('div', 'submit-summary-row');
      row.append(makeElement('span', '', label), makeElement('strong', '', String(value)));
      els.submitSummary.append(row);
    });
    if (typeof els.submitDialog.showModal === 'function') els.submitDialog.showModal();
    else if (window.confirm(`You answered ${answered} of ${session.questions.length} questions. Submit this test now?`)) finishSession(false);
  }

  function finishSession(timeExpired = false) {
    if (!session || session.saved) return;
    stopTimer();
    if (session.mode === 'mock') {
      finishMockSession(timeExpired);
      return;
    }

    const completedSession = session;
    const outcomes = completedSession.questions.map((question) => {
      const response = completedSession.answers[question.id] ?? '';
      const attempted = String(response).trim() !== '';
      const pendingReview = false;
      const needsVerification = false;
      const gradable = true;
      const correct = gradable && attempted && isCorrect(question, response);
      return {
        id: question.id,
        chapter: question.chapter || 'General',
        topic: question.topic || question.chapter || 'General',
        prompt: question.prompt,
        type: question.type,
        response,
        attempted,
        correct,
        gradable,
        pendingReview: pendingReview && attempted,
        needsVerification,
        answer: correctAnswerText(question),
        answerKeyLetter: question.answerKeyLetter || null,
        explanation: question.explanation || '',
        marks: Number(question.marks || 1),
        year: question.year || null,
        set: question.set || question.paperCode || null,
        questionNumber: question.questionNumber || null
      };
    });
    const correctCount = outcomes.filter((item) => item.correct).length;
    const attemptedCount = outcomes.filter((item) => item.attempted).length;
    const gradableAttemptedCount = outcomes.filter((item) => item.attempted && item.gradable).length;
    const pendingReviewCount = outcomes.filter((item) => item.pendingReview).length;
    const unverifiedCount = outcomes.filter((item) => item.needsVerification && item.attempted).length;
    const wrongCount = outcomes.filter((item) => item.attempted && item.gradable && !item.correct).length;
    const score = outcomes.reduce((sum, item) => sum + (item.gradable && item.correct ? item.marks : 0), 0);
    const maxMarks = outcomes.reduce((sum, item) => sum + (item.gradable ? item.marks : 0), 0);
    const accuracy = gradableAttemptedCount ? (correctCount / gradableAttemptedCount) * 100 : 0;
    const percentage = maxMarks ? (score / maxMarks) * 100 : 0;
    const result = {
      date: new Date().toISOString(),
      class: completedSession.scope.class,
      board: completedSession.scope.board,
      subject: completedSession.scope.subject,
      mode: completedSession.mode,
      title: completedSession.title,
      score,
      maxMarks,
      percentage,
      accuracy,
      correctCount,
      wrongCount,
      attemptedCount,
      gradableAttemptedCount,
      pendingReviewCount,
      unverifiedCount,
      totalQuestions: outcomes.length,
      timeSpentSeconds: Math.max(0, Math.floor((Date.now() - completedSession.startedAt) / 1000)),
      timeExpired,
      outcomes
    };

    completedSession.saved = true;
    latestResult = result;
    progress.attempts.unshift(result);
    progress.attempts = progress.attempts.slice(0, 100);
    outcomes.forEach((item) => {
      if (item.gradable && item.attempted && !item.correct && !progress.mistakes.includes(item.id)) progress.mistakes.push(item.id);
      if (item.correct) progress.mistakes = progress.mistakes.filter((id) => id !== item.id);
    });
    progress.mistakes = progress.mistakes.slice(-300);
    persistProgress();
    clearActiveSession();
    session = null;
    els.sessionPanel.classList.add('hidden');
    els.mockCompletePanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
    renderResult(result);
    renderDashboard();
    applyActiveLock();
    els.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finishMockSession(timeExpired) {
    const paper = session.mockPaper;
    const record = {
      date: new Date().toISOString(),
      code: paper.code,
      title: paper.title,
      class: paper.class,
      board: paper.board,
      subject: paper.subject,
      timeSpentSeconds: Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000)),
      timeExpired: Boolean(timeExpired)
    };
    progress.mockAttempts.unshift(record);
    progress.mockAttempts = progress.mockAttempts.slice(0, 50);
    persistProgress();
    clearActiveSession();
    session = null;
    stopTimer();
    els.sessionPanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    els.mockCompletePanel.classList.remove('hidden');
    els.mockCompleteDetails.replaceChildren();
    els.mockCompleteDetails.append(makeElement('strong', '', record.title));
    els.mockCompleteDetails.append(makeElement('span', '', `Code: ${record.code} · Class ${record.class} ${record.board} · ${record.subject}`));
    els.mockCompleteDetails.append(makeElement('span', '', `Time used: ${formatDuration(record.timeSpentSeconds)}${timeExpired ? ' · Time limit reached' : ''}`));
    renderDashboard();
    applyActiveLock();
    els.mockCompletePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderResult(result) {
    els.resultScore.textContent = result.maxMarks ? `${formatNumber(result.score)}/${formatNumber(result.maxMarks)}` : 'Pending';
    els.resultPercent.textContent = result.maxMarks ? `${Math.round(result.percentage)}% of auto-graded marks` : 'No automatic score for this set';
    els.resultAccuracy.textContent = result.gradableAttemptedCount ? `${Math.round(result.accuracy)}%` : '—';
    els.resultAttempted.textContent = `${result.attemptedCount} attempted`;
    els.resultCorrect.textContent = String(result.correctCount);
    els.resultWrong.textContent = `${result.wrongCount} wrong · ${result.totalQuestions - result.attemptedCount} skipped`;
    els.reviewCount.textContent = `${result.totalQuestions} questions`;
    let insight = '';
    if (result.attemptedCount === 0) insight = 'No answers were attempted in this session. Review the answers below and try a shorter set.';
    else if (result.accuracy >= 85) insight = 'Strong work. Review the questions you missed so that small gaps do not become repeated mistakes.';
    else if (result.accuracy >= 60) insight = 'A useful practice run. Revisit the incorrect answers and try another set from the same topics.';
    else insight = 'Treat this as a diagnostic, not a judgement. Start with the explanations, revise the listed topics and practise them again.';
    if (result.timeExpired) insight += ' The time limit was reached, so the test was submitted automatically.';
    els.resultInsight.textContent = insight;
    renderChapterBreakdown(result.outcomes, els.resultChapterBreakdown);
    els.reviewList.replaceChildren();
    result.outcomes.forEach((item, index) => {
      const card = makeElement('article', 'review-item');
      const head = makeElement('div', 'review-item-head');
      head.append(makeElement('b', '', `Q${index + 1} · ${item.chapter}${item.year ? ` · PYQ ${item.year}` : ''}${item.set ? ` · ${item.set}` : ''}`));
      const statusClass = item.correct ? 'good' : 'bad';
      const statusText = item.correct ? `✓ Correct · ${item.marks} mark(s)` : (item.attempted ? '✕ Incorrect' : '— Not attempted');
      head.append(makeElement('span', `review-status ${statusClass}`, statusText));
      card.append(head);
      card.append(makeElement('p', 'review-prompt', item.prompt));
      card.append(makeElement('p', 'review-answer', `Your answer: ${item.attempted ? item.response : 'Not answered'}`));
      card.append(makeElement('p', 'review-answer correct-answer', `Correct answer: ${item.answer}`));
      if (item.explanation) card.append(makeElement('p', 'review-explanation', item.explanation));
      els.reviewList.append(card);
    });
  }

  function renderChapterBreakdown(outcomes, target) {
    const groups = new Map();
    outcomes.forEach((item) => {
      const key = item.chapter || 'General';
      if (!groups.has(key)) groups.set(key, { chapter: key, attempted: 0, correct: 0, total: 0 });
      const group = groups.get(key);
      if (item.gradable) {
        group.total += 1;
        if (item.attempted) {
          group.attempted += 1;
          if (item.correct) group.correct += 1;
        }
      }
    });
    target.replaceChildren();
    [...groups.values()].forEach((item) => {
      const accuracy = item.attempted ? Math.round((item.correct / item.attempted) * 100) : 0;
      const row = makeElement('div', 'chapter-row');
      const details = makeElement('div', 'chapter-row-details');
      details.append(makeElement('strong', '', item.chapter));
      details.append(makeElement('small', '', `${item.correct}/${item.attempted} correct · ${item.total} total`));
      const meter = makeElement('div', 'mini-meter');
      const fill = makeElement('span');
      fill.style.width = `${accuracy}%`;
      meter.append(fill);
      row.append(details, meter, makeElement('b', 'chapter-pct', `${accuracy}%`));
      target.append(row);
    });
  }

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  }

  function downloadResult() {
    const result = latestResult;
    if (!result) {
      window.alert('There is no completed test report to download yet.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      window.alert('Your browser could not create the report image.');
      return;
    }
    ctx.fillStyle = '#eef2f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 36, 1128, 828);
    ctx.fillStyle = '#14213d';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText('VIDHYASHRAM', 76, 112);
    ctx.fillStyle = '#64748b';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText('BOARDPREP LAB · TEST REPORT', 78, 151);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 27px Arial, sans-serif';
    ctx.fillText(`Class ${result.class} · ${result.board} · ${result.subject}`, 78, 218, 1035);
    ctx.fillStyle = '#64748b';
    ctx.font = '19px Arial, sans-serif';
    ctx.fillText(`${new Date(result.date).toLocaleString()}  |  ${modeLabel(result.mode).replaceAll('_', ' ')}`, 78, 254);
    ctx.strokeStyle = '#dbe3ef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 282);
    ctx.lineTo(1122, 282);
    ctx.stroke();
    const metrics = [
      { label: 'TOTAL QUESTIONS', value: String(result.totalQuestions) },
      { label: 'ATTEMPTED', value: String(result.attemptedCount) },
      { label: 'CORRECT', value: String(result.correctCount) },
      { label: 'WRONG', value: String(result.wrongCount) },
      { label: 'ACCURACY', value: result.gradableAttemptedCount === 0 ? '—' : `${Number(result.accuracy || 0).toFixed(1)}%` },
      { label: 'PERCENTAGE', value: result.maxMarks ? `${Number(result.percentage || 0).toFixed(1)}%` : 'Pending' }
    ];
    const cardWidth = 320;
    const cardHeight = 145;
    metrics.forEach((metric, index) => {
      const x = 78 + (index % 3) * 362;
      const y = 326 + Math.floor(index / 3) * 173;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, y, cardWidth, cardHeight);
      ctx.strokeStyle = '#dbe3ef';
      ctx.strokeRect(x, y, cardWidth, cardHeight);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(metric.label, x + 24, y + 42);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.fillText(metric.value, x + 24, y + 108);
    });
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(78, 690, 1044, 94);
    ctx.strokeStyle = '#bfdbfe';
    ctx.strokeRect(78, 690, 1044, 94);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('TIME SPENT', 106, 727);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(formatDuration(result.timeSpentSeconds), 106, 766);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Generated by Vidhyashram BoardPrep Lab', 78, 828);
    const safeClass = String(result.class || 'class').replace(/[^a-z0-9_-]/gi, '-');
    const safeSubject = String(result.subject || 'subject').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'subject';
    const link = document.createElement('a');
    link.download = `vidhyashram-report-class-${safeClass}-${safeSubject}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.94);
    link.click();
  }

  function renderDashboard() {
    const attempts = progress.attempts;
    const scoredAttempts = attempts.filter((item) => Number(item.maxMarks || 0) > 0);
    els.statAttempts.textContent = String(attempts.length + progress.mockAttempts.length);
    const average = scoredAttempts.length ? scoredAttempts.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / scoredAttempts.length : null;
    const best = scoredAttempts.length ? Math.max(...scoredAttempts.map((item) => Number(item.percentage || 0))) : null;
    const tried = attempts.reduce((sum, item) => sum + Number(item.attemptedCount || 0), 0);
    els.statAverage.textContent = average === null ? '—' : `${Math.round(average)}%`;
    els.statBest.textContent = best === null ? '—' : `${Math.round(best)}%`;
    els.statTried.textContent = String(tried);

    const chapterMap = new Map();
    attempts.forEach((attempt) => (attempt.outcomes || []).forEach((item) => {
      const key = `${attempt.class}|${attempt.board}|${attempt.subject}|${item.chapter}`;
      if (!chapterMap.has(key)) chapterMap.set(key, { chapter: item.chapter, subject: attempt.subject, class: attempt.class, attempted: 0, correct: 0 });
      const stats = chapterMap.get(key);
      if (item.attempted && item.gradable) {
        stats.attempted += 1;
        if (item.correct) stats.correct += 1;
      }
    }));
    const chapterRows = [...chapterMap.values()].filter((item) => item.attempted > 0)
      .map((item) => ({ ...item, accuracy: item.correct / item.attempted }))
      .sort((a, b) => a.accuracy - b.accuracy).slice(0, 8);
    els.chapterPerformance.replaceChildren();
    if (!chapterRows.length) {
      els.chapterPerformance.className = 'empty-state';
      els.chapterPerformance.textContent = 'Complete a few tests to see chapter-level performance.';
    } else {
      els.chapterPerformance.className = '';
      chapterRows.forEach((item) => {
        const row = makeElement('div', 'topic-row');
        row.append(makeElement('span', '', `${item.chapter} · Class ${item.class} ${item.subject}`));
        row.append(makeElement('strong', '', `${Math.round(item.accuracy * 100)}%`));
        els.chapterPerformance.append(row);
      });
    }

    const recent = [
      ...attempts.map((item) => ({ ...item, kind: 'scored' })),
      ...progress.mockAttempts.map((item) => ({ ...item, kind: 'mock' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    els.recentSessions.replaceChildren();
    if (!recent.length) {
      els.recentSessions.className = 'empty-state';
      els.recentSessions.textContent = 'Your completed sessions will appear here.';
    } else {
      els.recentSessions.className = '';
      recent.forEach((item) => {
        const row = makeElement('div', 'recent-row');
        const info = makeElement('div');
        const label = item.kind === 'mock'
          ? `${item.title} · Mock`
          : `${item.subject} · Class ${item.class} ${item.board}`;
        info.append(makeElement('span', '', label));
        info.append(makeElement('small', '', new Date(item.date).toLocaleString()));
        row.append(info, makeElement('strong', '', item.kind === 'mock' ? 'Offline check' : `${Math.round(item.percentage)}%`));
        els.recentSessions.append(row);
      });
    }
    updateRevisionCounts();
  }

  function updateRevisionCounts() {
    els.savedCount.textContent = String(progress.bookmarks.length);
    els.mistakeCount.textContent = String(progress.mistakes.length);
    els.savedRevisionBtn.disabled = Boolean(session) || progress.bookmarks.length === 0;
    els.mistakeRevisionBtn.disabled = Boolean(session) || progress.mistakes.length === 0;
  }

  function startRevision(which) {
    if (session) return;
    const ids = which === 'saved' ? progress.bookmarks : progress.mistakes;
    const questions = bank.filter((question) => ids.includes(question.id) && isRegularEligibleQuestion(question));
    if (!questions.length) {
      els.formMessage.textContent = which === 'saved' ? 'You have not saved any questions yet.' : 'There are no recorded mistakes to retry yet.';
      return;
    }
    const first = questions[0];
    const scope = { class: first.class, board: first.board, subject: first.subject };
    createSession(questions, 'revision', scope, 0, { title: which === 'saved' ? `Saved-question revision · ${questions.length} questions` : `Mistake revision · ${questions.length} questions` });
  }

  function resetProgress() {
    if (session) {
      window.alert('Submit the active test before resetting your history.');
      return;
    }
    const confirmed = window.confirm('Delete all test history, saved questions and mistake records on this device? This cannot be undone.');
    if (!confirmed) return;
    progress = { attempts: [], bookmarks: [], mistakes: [], mockAttempts: [] };
    persistProgress();
    renderDashboard();
  }

  function showWelcome() {
    if (isExamPage) { window.location.assign('index.html'); return; }
    latestResult = null;
    els.resultPanel.classList.add('hidden');
    els.mockCompletePanel.classList.add('hidden');
    els.welcomePanel.classList.remove('hidden');
    els.welcomePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleStorageChange(event) {
    if (event.key !== ACTIVE_KEY) return;
    if (event.newValue) {
      let incoming;
      try { incoming = JSON.parse(event.newValue); } catch (error) { return; }
      if (!incoming || !Array.isArray(incoming.questions)) return;
      if (!session || session.id !== incoming.id) {
        stopTimer();
        session = incoming;
        if (!isExamPage) { window.location.replace('exam.html'); return; }
        renderActiveSession(false);
        lockExamNavigation();
      } else if (Number(incoming.updatedAt || 0) > Number(session.updatedAt || 0) && incoming.updatedBy !== TAB_ID) {
        session = incoming;
        if (session.mode === 'mock') renderMockPaper();
        else renderQuestion();
        applyActiveLock();
      }
    } else if (session) {
      if (isExamPage) { window.location.replace('index.html'); return; }
      stopTimer();
      session = null;
      els.sessionPanel.classList.add('hidden');
      els.mockCompletePanel.classList.add('hidden');
      els.resultPanel.classList.add('hidden');
      els.welcomePanel.classList.remove('hidden');
      applyActiveLock();
      els.formMessage.textContent = 'The active test was submitted or ended in another tab.';
    }
  }

  els.classSelect.addEventListener('change', refreshBoardOptions);
  els.boardSelect.addEventListener('change', refreshSubjectOptions);
  els.subjectSelect.addEventListener('change', refreshChapterOptions);
  els.chapterSelect.addEventListener('change', () => { refreshPyqYears(); updateAvailableCount(); });
  els.difficultySelect.addEventListener('change', () => { refreshPyqYears(); updateAvailableCount(); });
  els.modeSelect.addEventListener('change', updateModeVisibility);
  els.mockCodeInput.addEventListener('input', () => { pendingMockPaper = null; els.mockPreviewCard.classList.add('hidden'); });
  els.confirmMockStartBtn.addEventListener('click', startMockSession);
  els.pyqYearSelect.addEventListener('change', updateAvailableCount);
  els.setupForm.addEventListener('submit', startSession);
  els.fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  els.prevBtn.addEventListener('click', goPrevious);
  els.nextBtn.addEventListener('click', goNext);
  els.markReviewBtn.addEventListener('click', toggleMarked);
  els.clearResponseBtn.addEventListener('click', clearCurrentResponse);
  els.markNextBtn.addEventListener('click', markReviewAndNext);
  els.bookmarkBtn.addEventListener('click', toggleBookmark);
  els.finishBtn.addEventListener('click', requestFinish);
  els.exitSessionBtn.addEventListener('click', requestFinish);
  els.tryAgainBtn.addEventListener('click', showWelcome);
  els.downloadResultBtn.addEventListener('click', downloadResult);
  els.resetProgressBtn.addEventListener('click', resetProgress);
  els.savedRevisionBtn.addEventListener('click', () => startRevision('saved'));
  els.mistakeRevisionBtn.addEventListener('click', () => startRevision('mistakes'));
  els.mockBackBtn.addEventListener('click', showWelcome);
  els.howItWorksBtn.addEventListener('click', () => els.howDialog.showModal());
  els.closeDialogBtn.addEventListener('click', () => els.howDialog.close());
  els.gotItBtn.addEventListener('click', () => els.howDialog.close());
  els.cancelSubmitBtn.addEventListener('click', () => els.submitDialog.close());
  els.keepTestingBtn.addEventListener('click', () => els.submitDialog.close());
  els.confirmSubmitBtn.addEventListener('click', () => { els.submitDialog.close(); finishSession(false); });
  window.addEventListener('storage', handleStorageChange);
  if (isExamPage) window.addEventListener('beforeunload', (event) => { if (readActiveSession()) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && session?.endsAt) updateTimer(); });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  const savedSession = readActiveSession();
  if (savedSession && !isExamPage) {
    window.location.replace('exam.html');
    return;
  }
  if (!savedSession && isExamPage) {
    window.location.replace('index.html');
    return;
  }
  refreshBoardOptions();
  updateFullscreenButton();
  updateModeVisibility();
  renderDashboard();
  if (savedSession) {
    session = savedSession;
    renderActiveSession(false);
    lockExamNavigation();
  } else {
    applyActiveLock();
  }

  function lockExamNavigation() {
    if (!isExamPage || !session) return;
    document.body.classList.add('exam-locked');
    if (!history.state?.examLocked) {
      history.replaceState({ examLocked: true }, '', window.location.href);
      history.pushState({ examLocked: true }, '', window.location.href);
    }
    window.addEventListener('popstate', () => {
      if (readActiveSession()) {
        history.pushState({ examLocked: true }, '', window.location.href);
      } else {
        window.location.replace('index.html');
      }
    });
  }
})();
