/* Vidhyashram BoardPrep Lab — image-first UI bridge.
   Load this AFTER app.js. It does not replace the exam engine or grading logic. */
(() => {
  'use strict';
  document.body.classList.add('vui-upgrade');

  const imageFirstBank = () => (Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [])
    .filter(q => q && q.imageFirst && String(q.class) === '12' && q.sourceImage);

  function findActiveImageQuestion(area) {
    const tag = area.querySelector('.question-kicker .year-tag');
    if (!tag) return null;
    const label = (tag.textContent || '').replace(/\s+/g, ' ').trim();
    return imageFirstBank().find(q => {
      const prefix = `${q.board} ${q.year}`;
      const questionNo = String(q.questionNumber || '');
      const suffix = `· ${questionNo.startsWith('Q') ? questionNo : `Q${questionNo}`}`;
      const paper = q.paperCode ? `· ${q.paperCode} ·` : '';
      return label.startsWith(prefix) && label.endsWith(suffix) && (!paper || label.includes(paper));
    }) || null;
  }

  function normalizeChapterLabels() {
    const select = document.getElementById('chapterSelect');
    if (!select) return;
    [...select.options].forEach(option => {
      option.textContent = option.textContent.replace(/\s+\(\d+ questions?\)$/i, '');
    });
  }

  function applyImageFirst(area) {
    const question = findActiveImageQuestion(area);
    if (!question) {
      area.classList.remove('image-first-question');
      delete area.dataset.imageFirstQuestionId;
      return;
    }
    if (area.dataset.imageFirstQuestionId === question.id && area.querySelector('.question-source-crop')) return;

    area.classList.add('image-first-question');
    area.dataset.imageFirstQuestionId = question.id;

    const existingPrompt = area.querySelector('.question-prompt');
    if (existingPrompt) existingPrompt.remove();
    area.querySelectorAll('.source-image-details').forEach(node => node.remove());
    area.querySelectorAll('.question-source-crop, .question-source-fallback').forEach(node => node.remove());

    const figure = document.createElement('figure');
    figure.className = 'question-source-crop';
    figure.setAttribute('aria-label', `${question.board} ${question.year} original question image`);
    const image = document.createElement('img');
    image.src = question.sourceImage;
    image.alt = String(question.prompt || `${question.board} Class 12 Physics ${question.year} question ${question.questionNumber} from paper ${question.paperCode || ''}`);
    image.loading = 'eager';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      figure.remove();
      const fallback = document.createElement('div');
      fallback.className = 'question-source-fallback';
      fallback.textContent = question.prompt || `${question.topic || 'Original question'} — the question image could not be loaded. Please report this item to Vidhyashram.`;
      area.insertBefore(fallback, area.querySelector('.question-options, .answer-input-wrap'));
    }, { once: true });

    figure.append(image);
    const sourceMeta = area.querySelector('.source-question-meta');
    const kicker = area.querySelector('.question-kicker');
    const insertionPoint = sourceMeta || kicker;
    if (insertionPoint && insertionPoint.parentNode) insertionPoint.parentNode.insertBefore(figure, insertionPoint.nextSibling);
    else area.prepend(figure);

    // The CBSE/ISC source image already contains the printed options. Keep the app's
    // radio controls, but display clean A/B/C/D selectors instead of repeating option text.
    if (question.type === 'source-mcq') {
      area.querySelectorAll('.question-options .option-label').forEach((label, index) => {
        const span = label.querySelector('span');
        const radio = label.querySelector('input[type="radio"]');
        if (span && radio) span.textContent = radio.value || 'ABCD'[index] || '';
      });
    }
  }

  function refresh() {
    normalizeChapterLabels();
    const area = document.getElementById('questionArea');
    if (area) applyImageFirst(area);
  }

  const observer = new MutationObserver(() => refresh());
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
    const chapterSelect = document.getElementById('chapterSelect');
    if (chapterSelect) new MutationObserver(normalizeChapterLabels).observe(chapterSelect, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
