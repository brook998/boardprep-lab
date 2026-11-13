(() => {
  'use strict';

  const bank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
  const STORAGE_KEY = 'boardprep-lab-progress-v1';
  const $ = (id) => document.getElementById(id);
  const els = {
    setupForm: $('setupForm'), classSelect: $('classSelect'), boardSelect: $('boardSelect'),
    subjectSelect: $('subjectSelect'), chapterSelect: $('chapterSelect'), difficultySelect: $('difficultySelect'),
    modeSelect: $('modeSelect'), countSelect: $('countSelect'), durationWrap: $('durationWrap'), durationInput: $('durationInput'),
    availableCount: $('availableCount'), formMessage: $('formMessage'), welcomePanel: $('welcomePanel'), sessionPanel: $('sessionPanel'),
    resultPanel: $('resultPanel'), sessionMeta: $('sessionMeta'), sessionTitle: $('sessionTitle'), timerBox: $('timerBox'),
    timerText: $('timerText'), questionCounter: $('questionCounter'), answeredCounter: $('answeredCounter'), progressFill: $('progressFill'),
    questionArea: $('questionArea'), prevBtn: $('prevBtn'), nextBtn: $('nextBtn'), checkBtn: $('checkBtn'), finishBtn: $('finishBtn'),
    exitSessionBtn: $('exitSessionBtn'), sessionHint: $('sessionHint'), resultScore: $('resultScore'), resultPercent: $('resultPercent'),
    resultAccuracy: $('resultAccuracy'), resultAttempted: $('resultAttempted'), resultCorrect: $('resultCorrect'), resultWrong: $('resultWrong'),
    resultInsight: $('resultInsight'), reviewCount: $('reviewCount'), reviewList: $('reviewList'), tryAgainBtn: $('tryAgainBtn'),
    downloadResultBtn: $('downloadResultBtn'), statAttempts: $('statAttempts'), statAverage: $('statAverage'), statBest: $('statBest'),
    statTried: $('statTried'), weakTopics: $('weakTopics'), recentSessions: $('recentSessions'), resetProgressBtn: $('resetProgressBtn'),
    howDialog: $('howDialog'), howItWorksBtn: $('howItWorksBtn'), closeDialogBtn: $('closeDialogBtn'), gotItBtn: $('gotItBtn')
  };

  let session = null;
  let timerInterval = null;
  let latestResult = null;
  let progress = loadProgress();

  function loadProgress() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"attempts":[]}');
      return parsed && Array.isArray(parsed.attempts) ? parsed : { attempts: [] };
    } catch (error) {
      return { attempts: [] };
    }
  }

  function persistProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.warn('Could not save practice history in this browser.', error);
    }
  }

  function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }

  function setSelectOptions(select, values, firstLabel, firstValue) {
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = firstValue;
    first.textContent = firstLabel;
    select.append(first);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.append(option);
    });
  }

  function currentScopeQuestions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subject = els.subjectSelect.value;
    const chapter = els.chapterSelect.value;
    const difficulty = els.difficultySelect.value;
    return bank.filter((q) => q.class === cls && q.board === board && q.subject === subject &&
      (chapter === 'all' || q.chapter === chapter) &&
      (difficulty === 'all' || q.difficulty === difficulty));
  }

  function refreshBoardOptions() {
    const cls = els.classSelect.value;
    const boards = uniqueSorted(bank.filter((q) => q.class === cls).map((q) => q.board));
    const previous = els.boardSelect.value;
    setSelectOptions(els.boardSelect, boards, 'Choose a board', '');
    els.boardSelect.value = boards.includes(previous) ? previous : (boards[0] || '');
    refreshSubjectOptions();
  }

  function refreshSubjectOptions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subjects = uniqueSorted(bank.filter((q) => q.class === cls && q.board === board).map((q) => q.subject));
    const previous = els.subjectSelect.value;
    setSelectOptions(els.subjectSelect, subjects, 'Choose a subject', '');
    els.subjectSelect.value = subjects.includes(previous) ? previous : (subjects[0] || '');
    refreshChapterOptions();
  }

  function refreshChapterOptions() {
    const cls = els.classSelect.value;
    const board = els.boardSelect.value;
    const subject = els.subjectSelect.value;
    const chapters = uniqueSorted(bank.filter((q) => q.class === cls && q.board === board && q.subject === subject).map((q) => q.chapter));
    const previous = els.chapterSelect.value;
    setSelectOptions(els.chapterSelect, chapters, 'All available chapters', 'all');
    els.chapterSelect.value = chapters.includes(previous) ? previous : 'all';
    updateAvailableCount();
  }

  function updateAvailableCount() {
    const count = currentScopeQuestions().length;
    els.availableCount.textContent = `${count} question${count === 1 ? '' : 's'} available`;
  }

  function updateModeVisibility() {
    const timed = els.modeSelect.value === 'test';
    els.durationWrap.classList.toggle('hidden', !timed);
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function startSession(event) {
    event.preventDefault();
    const pool = currentScopeQuestions();
    els.formMessage.textContent = '';
    if (!pool.length) {
      els.formMessage.textContent = 'There are no questions for this selection yet.';
      return;
    }
    const requested = Number(els.countSelect.value) || 10;
    const chosen = shuffle(pool).slice(0, Math.min(requested, pool.length));
    const mode = els.modeSelect.value;
    const durationMinutes = Math.max(5, Math.min(180, Number(els.durationInput.value) || 20));
    session = {
      questions: chosen,
      answers: {},
      checked: {},
      index: 0,
      mode,
      startedAt: Date.now(),
      durationSeconds: durationMinutes * 60,
      endsAt: mode === 'test' ? Date.now() + durationMinutes * 60 * 1000 : null,
      scope: { class: els.classSelect.value, board: els.boardSelect.value, subject: els.subjectSelect.value },
      saved: false
    };
    if (pool.length < requested) {
      els.formMessage.textContent = `Only ${pool.length} question(s) match this selection, so all available questions are included.`;
    }
    latestResult = null;
    els.welcomePanel.classList.add('hidden');
    els.resultPanel.classList.add('hidden');
    els.sessionPanel.classList.remove('hidden');
    els.sessionMeta.textContent = `${mode === 'test' ? 'TIMED TEST' : 'PRACTICE SESSION'} · CLASS ${session.scope.class} · ${session.scope.board.toUpperCase()}`;
    els.sessionTitle.textContent = `${session.scope.subject} · ${chosen.length} questions`;
    els.timerBox.classList.toggle('hidden', mode !== 'test');
    els.checkBtn.classList.toggle('hidden', mode !== 'practice');
    els.sessionHint.textContent = mode === 'practice' ? 'Check each answer for instant feedback, or review it at the end.' : 'Your answers are checked when you submit. The timer submits automatically at zero.';
    renderQuestion();
    stopTimer();
    if (mode === 'test') {
      updateTimer();
      timerInterval = window.setInterval(updateTimer, 1000);
    }
    els.sessionPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stopTimer() {
    if (timerInterval !== null) window.clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateTimer() {
    if (!session || session.mode !== 'test') return;
    const remaining = Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    els.timerText.textContent = `${minutes}:${seconds}`;
    els.timerBox.classList.toggle('timer-danger', remaining <= 60);
    if (remaining <= 0) {
      stopTimer();
      finishSession(true);
    }
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function renderQuestion() {
    if (!session) return;
    const q = session.questions[session.index];
    const total = session.questions.length;
    const answered = Object.keys(session.answers).filter((id) => String(session.answers[id] ?? '').trim() !== '').length;
    els.questionCounter.textContent = `Question ${session.index + 1} of ${total}`;
    els.answeredCounter.textContent = `${answered} answered`;
    els.progressFill.style.width = `${((session.index + 1) / total) * 100}%`;
    els.prevBtn.disabled = session.index === 0;
    els.prevBtn.style.opacity = session.index === 0 ? '.45' : '1';
    els.nextBtn.classList.toggle('hidden', session.index === total - 1);
    els.finishBtn.classList.toggle('hidden', session.index !== total - 1);
    els.checkBtn.classList.toggle('hidden', session.mode !== 'practice');
    els.questionArea.replaceChildren();

    const kicker = makeElement('div', 'question-kicker');
    kicker.append(makeElement('span', '', q.chapter));
    kicker.append(makeElement('span', '', q.difficulty));
    kicker.append(makeElement('span', 'marks-tag', `${q.marks || 1} mark${(q.marks || 1) === 1 ? '' : 's'}`));
    els.questionArea.append(kicker);
    els.questionArea.append(makeElement('h3', 'question-prompt', q.prompt));

    if (q.type === 'mcq') {
      const options = makeElement('div', 'question-options');
      q.options.forEach((option, index) => {
        const label = makeElement('label', 'option-label');
        if (session.answers[q.id] === option) label.classList.add('selected');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `answer-${q.id}`;
        radio.value = option;
        radio.checked = session.answers[q.id] === option;
        radio.addEventListener('change', () => {
          session.answers[q.id] = option;
          session.checked[q.id] = false;
          const oldFeedback = els.questionArea.querySelector('.feedback-box');
          if (oldFeedback) oldFeedback.remove();
          options.querySelectorAll('.option-label').forEach((item) => item.classList.remove('selected'));
          label.classList.add('selected');
          updateAnsweredCounter();
        });
        label.append(radio, makeElement('span', '', `${String.fromCharCode(65 + index)}. ${option}`));
        options.append(label);
      });
      els.questionArea.append(options);
    } else {
      const wrap = makeElement('div', 'answer-input-wrap');
      const input = document.createElement('input');
      input.type = 'text';
      input.autocomplete = 'off';
      input.inputMode = q.type === 'numeric' ? 'decimal' : 'text';
      input.placeholder = q.type === 'numeric' ? 'Enter your numerical answer' : 'Type your answer';
      input.setAttribute('aria-label', 'Your answer');
      input.value = session.answers[q.id] || '';
      input.addEventListener('input', () => {
        session.answers[q.id] = input.value;
        session.checked[q.id] = false;
        const oldFeedback = els.questionArea.querySelector('.feedback-box');
        if (oldFeedback) oldFeedback.remove();
        updateAnsweredCounter();
      });
      wrap.append(input);
      wrap.append(makeElement('p', 'input-hint', q.type === 'numeric' ? `Enter the number${q.unit ? ` (unit: ${q.unit})` : ''}. Equivalent decimal formatting is accepted.` : 'Capitalisation and extra spaces do not matter.'));
      els.questionArea.append(wrap);
    }

    if (session.mode === 'practice' && session.checked[q.id]) {
      els.questionArea.append(createFeedback(q));
    }
  }

  function updateAnsweredCounter() {
    if (!session) return;
    const answered = Object.keys(session.answers).filter((id) => String(session.answers[id] ?? '').trim() !== '').length;
    els.answeredCounter.textContent = `${answered} answered`;
  }

  function normaliseText(value) {
    return String(value ?? '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
  }

  function parseNumeric(value) {
    let cleaned = String(value ?? '').trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
    const fraction = cleaned.match(/^([+-]?\d+(?:\.\d+)?)\/([+-]?\d+(?:\.\d+)?)$/);
    if (fraction) {
      const denominator = Number(fraction[2]);
      return denominator === 0 ? NaN : Number(fraction[1]) / denominator;
    }
    const match = cleaned.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    return match ? Number(match[0]) : NaN;
  }

  function isCorrect(q, response) {
    if (String(response ?? '').trim() === '') return false;
    if (q.type === 'mcq') return normaliseText(response) === normaliseText(q.answer);
    if (q.type === 'numeric') {
      const entered = parseNumeric(response);
      const target = Number(q.answer);
      if (!Number.isFinite(entered) || !Number.isFinite(target)) return false;
      return Math.abs(entered - target) <= Number(q.tolerance ?? 0.001);
    }
    const accepted = Array.isArray(q.accepted) ? q.accepted : [q.answer];
    return accepted.some((answer) => normaliseText(answer) === normaliseText(response));
  }

  function correctAnswerText(q) {
    if (q.type === 'blank') return (q.accepted || [q.answer]).join(' / ');
    if (q.type === 'numeric') return `${q.answer}${q.unit ? ` ${q.unit}` : ''}`;
    return q.answer;
  }

  function createFeedback(q) {
    const correct = isCorrect(q, session.answers[q.id]);
    const box = makeElement('div', `feedback-box ${correct ? 'correct' : 'incorrect'}`);
    box.append(makeElement('strong', '', correct ? 'Correct answer' : 'Not quite — review this one'));
    box.append(makeElement('div', '', correct ? (q.explanation || 'That is correct.') : `Accepted answer: ${correctAnswerText(q)}. ${q.explanation || ''}`));
    return box;
  }

  function checkCurrentAnswer() {
    if (!session) return;
    const q = session.questions[session.index];
    const response = session.answers[q.id];
    if (String(response ?? '').trim() === '') {
      els.sessionHint.textContent = 'Enter or select an answer before checking it.';
      return;
    }
    session.checked[q.id] = true;
    const existing = els.questionArea.querySelector('.feedback-box');
    if (existing) existing.remove();
    els.questionArea.append(createFeedback(q));
    els.sessionHint.textContent = 'Feedback is shown below your answer. You can still change it.';
  }

  function goNext() {
    if (!session || session.index >= session.questions.length - 1) return;
    session.index += 1;
    renderQuestion();
  }

  function goPrevious() {
    if (!session || session.index <= 0) return;
    session.index -= 1;
    renderQuestion();
  }

  function finishSession(timeExpired = false) {
    if (!session || session.saved) return;
    stopTimer();
    const outcomes = session.questions.map((q) => {
      const response = session.answers[q.id] ?? '';
      const attempted = String(response).trim() !== '';
      const correct = attempted && isCorrect(q, response);
      return { id: q.id, chapter: q.chapter, topic: q.topic || q.chapter, prompt: q.prompt, type: q.type, response, attempted, correct, answer: correctAnswerText(q), explanation: q.explanation || '', marks: Number(q.marks || 1) };
    });
    const correctCount = outcomes.filter((item) => item.correct).length;
    const attemptedCount = outcomes.filter((item) => item.attempted).length;
    const wrongCount = outcomes.filter((item) => item.attempted && !item.correct).length;
    const score = outcomes.reduce((sum, item) => sum + (item.correct ? item.marks : 0), 0);
    const maxMarks = outcomes.reduce((sum, item) => sum + item.marks, 0);
    const accuracy = attemptedCount ? (correctCount / attemptedCount) * 100 : 0;
    const percentage = maxMarks ? (score / maxMarks) * 100 : 0;
          const timeSpentSeconds = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
    const result = {
      date: new Date().toISOString(), class: session.scope.class, board: session.scope.board, subject: session.scope.subject,
      mode: session.mode, score, maxMarks, percentage, accuracy, correctCount, wrongCount,
      attemptedCount, totalQuestions: outcomes.length, timeSpentSeconds, timeExpired, outcomes
    };
    session.saved = true;
    latestResult = result;
    progress.attempts.unshift(result);
    progress.attempts = progress.attempts.slice(0, 100);
    persistProgress();
    renderResult(result);
    renderDashboard();
    session = null;
    els.sessionPanel.classList.add('hidden');
    els.resultPanel.classList.remove('hidden');
    els.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderResult(result) {
    els.resultScore.textContent = `${formatNumber(result.score)}/${formatNumber(result.maxMarks)}`;
    els.resultPercent.textContent = `${Math.round(result.percentage)}% of available marks`;
    els.resultAccuracy.textContent = `${Math.round(result.accuracy)}%`;
    els.resultAttempted.textContent = `${result.attemptedCount} attempted`;
    els.resultCorrect.textContent = String(result.correctCount);
    els.resultWrong.textContent = `${result.wrongCount} incorrect · ${result.totalQuestions - result.attemptedCount} skipped`;
    els.reviewCount.textContent = `${result.totalQuestions} questions`;
    let insight = '';
    if (result.attemptedCount === 0) insight = 'No answers were attempted in this session. Try a shorter set first and answer each question you can.';
    else if (result.accuracy >= 85) insight = 'Strong work. Review the questions you missed so that small gaps do not become repeated mistakes.';
    else if (result.accuracy >= 60) insight = 'A useful practice run. Revisit the incorrect answers and try another set from the same topics.';
    else insight = 'Treat this as a diagnostic, not a judgement. Start with the explanations, revise the listed topics and practise them again.';
    if (result.timeExpired) insight += ' The time limit was reached, so the test was submitted automatically.';
    els.resultInsight.textContent = insight;
    els.reviewList.replaceChildren();
    result.outcomes.forEach((item, index) => {
      const card = makeElement('article', 'review-item');
      const head = makeElement('div', 'review-item-head');
      head.append(makeElement('b', '', `Q${index + 1} · ${item.chapter}`));
      head.append(makeElement('span', `review-status ${item.correct ? 'good' : 'bad'}`, item.correct ? `✓ Correct · ${item.marks} mark(s)` : (item.attempted ? '✕ Incorrect' : '— Not attempted')));
      card.append(head);
      card.append(makeElement('p', 'review-prompt', item.prompt));
      card.append(makeElement('p', 'review-answer', `Your answer: ${item.attempted ? item.response : 'Not answered'}`));
      if (!item.correct) card.append(makeElement('p', 'review-answer', `Accepted answer: ${item.answer}`));
      if (item.explanation) card.append(makeElement('p', 'review-explanation', item.explanation));
      els.reviewList.append(card);
    });
  }

  function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function renderDashboard() {
    const attempts = progress.attempts;
    els.statAttempts.textContent = String(attempts.length);
    const average = attempts.length ? attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length : null;
    const best = attempts.length ? Math.max(...attempts.map((item) => item.percentage)) : null;
    const tried = attempts.reduce((sum, item) => sum + item.attemptedCount, 0);
    els.statAverage.textContent = average === null ? '—' : `${Math.round(average)}%`;
    els.statBest.textContent = best === null ? '—' : `${Math.round(best)}%`;
    els.statTried.textContent = String(tried);

    const topicMap = new Map();
    attempts.forEach((attempt) => attempt.outcomes.forEach((item) => {
      const key = `${attempt.class}|${attempt.board}|${attempt.subject}|${item.topic}`;
      if (!topicMap.has(key)) topicMap.set(key, { topic: item.topic, subject: attempt.subject, board: attempt.board, class: attempt.class, attempted: 0, correct: 0 });
      const stats = topicMap.get(key);
      if (item.attempted) {
        stats.attempted += 1;
        if (item.correct) stats.correct += 1;
      }
    }));
    const weak = [...topicMap.values()].filter((item) => item.attempted >= 2).map((item) => ({ ...item, accuracy: item.correct / item.attempted })).sort((a, b) => a.accuracy - b.accuracy).slice(0, 4);
    els.weakTopics.replaceChildren();
    if (!weak.length) {
      els.weakTopics.className = 'empty-state';
      els.weakTopics.textContent = 'Complete more questions. A topic appears here after at least 2 attempts.';
    } else {
      els.weakTopics.className = '';
      weak.forEach((item) => {
        const row = makeElement('div', 'topic-row');
        row.append(makeElement('span', '', `${item.topic} · Class ${item.class} ${item.board}`));
        row.append(makeElement('span', '', `${Math.round(item.accuracy * 100)}%`));
        els.weakTopics.append(row);
      });
    }

    els.recentSessions.replaceChildren();
    if (!attempts.length) {
      els.recentSessions.className = 'empty-state';
      els.recentSessions.textContent = 'Your completed sessions will appear here.';
    } else {
      els.recentSessions.className = '';
      attempts.slice(0, 4).forEach((item) => {
        const row = makeElement('div', 'recent-row');
        const info = makeElement('div');
        info.append(makeElement('span', '', `${item.subject} · Class ${item.class} ${item.board}`));
        info.append(makeElement('small', '', new Date(item.date).toLocaleString()));
        row.append(info, makeElement('strong', '', `${Math.round(item.percentage)}%`));
        els.recentSessions.append(row);
      });
    }
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
      window.alert('There is no completed session report to download yet.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      window.alert('Your browser could not create the report image. Please try another browser.');
      return;
    }

    // Background and report sheet.
    ctx.fillStyle = '#eef2f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(36, 36, 1128, 828);

    // Header.
    ctx.fillStyle = '#14213d';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText('BoardPrep Lab', 76, 112);
    ctx.fillStyle = '#64748b';
    ctx.font = '22px Arial, sans-serif';
    ctx.fillText('PRACTICE SESSION REPORT', 78, 151);

    const heading = `Class ${result.class} · ${result.board} · ${result.subject}`;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 27px Arial, sans-serif';
    ctx.fillText(heading, 78, 218, 1035);
    ctx.fillStyle = '#64748b';
    ctx.font = '19px Arial, sans-serif';
    const dateText = result.date ? new Date(result.date).toLocaleString() : new Date().toLocaleString();
    ctx.fillText(`${dateText}  |  ${result.mode === 'test' ? 'Timed test' : 'Practice session'}`, 78, 254);

    ctx.strokeStyle = '#dbe3ef';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 282);
    ctx.lineTo(1122, 282);
    ctx.stroke();

    // Six requested performance measures, arranged in two rows.
    const metrics = [
      { label: 'TOTAL QUESTIONS', value: String(result.totalQuestions) },
      { label: 'ATTEMPTED', value: String(result.attemptedCount) },
      { label: 'CORRECT', value: String(result.correctCount) },
      { label: 'WRONG', value: String(result.wrongCount) },
      { label: 'ACCURACY', value: `${Number(result.accuracy || 0).toFixed(1)}%` },
      { label: 'PERCENTAGE', value: `${Number(result.percentage || 0).toFixed(1)}%` }
    ];
    const cardWidth = 320;
    const cardHeight = 145;
    const horizontalGap = 42;
    const verticalGap = 28;
    const startX = 78;
    const startY = 326;

    metrics.forEach((metric, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = startX + column * (cardWidth + horizontalGap);
      const y = startY + row * (cardHeight + verticalGap);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x, y, cardWidth, cardHeight);
      ctx.strokeStyle = '#dbe3ef';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cardWidth, cardHeight);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText(metric.label, x + 24, y + 42);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.fillText(metric.value, x + 24, y + 108);
    });

    // Time spent is displayed separately so it remains prominent.
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(78, 690, 1044, 94);
    ctx.strokeStyle = '#bfdbfe';
    ctx.lineWidth = 2;
    ctx.strokeRect(78, 690, 1044, 94);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('TIME SPENT', 106, 727);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(formatDuration(result.timeSpentSeconds), 106, 766);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Generated by BoardPrep Lab', 78, 828);

    const safeClass = String(result.class || 'class').replace(/[^a-z0-9_-]/gi, '-');
    const safeSubject = String(result.subject || 'subject').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'subject';
    const filename = `boardprep-report-class-${safeClass}-${safeSubject}.jpg`;

    function saveImageUrl(url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.append(link);
      link.click();
      link.remove();
    }

    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (!blob) {
          saveImageUrl(canvas.toDataURL('image/jpeg', 0.94));
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        saveImageUrl(objectUrl);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
      }, 'image/jpeg', 0.94);
    } else {
      saveImageUrl(canvas.toDataURL('image/jpeg', 0.94));
    }
  }

  function resetProgress() {
    if (!progress.attempts.length) return;
    const confirmed = window.confirm('Delete all practice history saved in this browser? This cannot be undone.');
    if (!confirmed) return;
    progress = { attempts: [] };
    persistProgress();
    renderDashboard();
  }

  function closeSession() {
    if (!session) return;
    const hasAnswers = Object.values(session.answers).some((value) => String(value ?? '').trim() !== '');
    if (hasAnswers && !window.confirm('Exit this session? Its answers will not be added to your progress history.')) return;
    stopTimer();
    session = null;
    els.sessionPanel.classList.add('hidden');
    els.welcomePanel.classList.remove('hidden');
  }

  function showWelcome() {
    latestResult = null;
    els.resultPanel.classList.add('hidden');
    els.welcomePanel.classList.remove('hidden');
    els.welcomePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  els.classSelect.addEventListener('change', refreshBoardOptions);
  els.boardSelect.addEventListener('change', refreshSubjectOptions);
  els.subjectSelect.addEventListener('change', refreshChapterOptions);
  els.chapterSelect.addEventListener('change', updateAvailableCount);
  els.difficultySelect.addEventListener('change', updateAvailableCount);
  els.modeSelect.addEventListener('change', updateModeVisibility);
  els.setupForm.addEventListener('submit', startSession);
  els.prevBtn.addEventListener('click', goPrevious);
  els.nextBtn.addEventListener('click', goNext);
  els.checkBtn.addEventListener('click', checkCurrentAnswer);
  els.finishBtn.addEventListener('click', () => finishSession(false));
  els.exitSessionBtn.addEventListener('click', closeSession);
  els.tryAgainBtn.addEventListener('click', showWelcome);
  els.downloadResultBtn.addEventListener('click', downloadResult);
  els.resetProgressBtn.addEventListener('click', resetProgress);
  els.howItWorksBtn.addEventListener('click', () => els.howDialog.showModal());
  els.closeDialogBtn.addEventListener('click', () => els.howDialog.close());
  els.gotItBtn.addEventListener('click', () => els.howDialog.close());

  refreshBoardOptions();
  updateModeVisibility();
  renderDashboard();
})();
