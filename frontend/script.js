let allQuestionsByType = {
  'multiple-choice': [],
  'sentence-completion': [],
  'sentence-ordering': [],
  'word-matching': [],
  'vocabulary-in-context': [],
  'image-description': [],
  'keyword-highlight': [],
  'image-select': [],
  'character-emotion': []
};
let currentQuestion = null;
let currentQuestionType = null;
let currentLevel = 1;
let questionsAsked = 0;
let score = 0;
let correctCount = 0;
let highestCorrectLevel = 1;
let totalQuestionLevels = 0;
let selected = null;
let answered = false;
let usedQuestionIds = new Set();
let usedQuestionTypes = new Set();
let selectedPassageWords = new Set();
let selectedSentenceOrder = [];
let wordMatchSelectedLeftId = null;
let wordMatchPairs = new Map();
let wordMatchResizeHandler = null;
const maxPassageSelections = 5;
const autoAdvanceDelayMs = 500;
const questionCount = 10;
const questionTypes = ['multiple-choice', 'sentence-completion', 'sentence-ordering', 'word-matching', 'vocabulary-in-context', 'image-description', 'keyword-highlight', 'image-select', 'character-emotion'];
const questionSources = {
  'multiple-choice': { file: 'multiple-choice-questions.csv', format: 'csv' },
  'sentence-completion': { file: 'sentence-completion-questions.csv', format: 'csv' },
  'sentence-ordering': { file: 'sentence-ordering-questions.json', format: 'json' },
  'word-matching': { file: 'word-matching-questions.json', format: 'json' },
  'vocabulary-in-context': { file: 'vocabulary-in-context-questions.csv', format: 'csv' },
  'image-description': { file: 'image-description-questions.json', format: 'json' },
  'keyword-highlight': { file: 'keyword-highlight-questions.json', format: 'json' },
  'image-select': { file: 'image-select-questions.json', format: 'json' },
  'character-emotion': { file: 'character-emotion-questions.json', format: 'json' }
};

function parseCSV(text) {
  const rows = [];
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift().split(",");

  lines.forEach(line => {
    const values = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(field);
        field = "";
      } else {
        field += char;
      }
    }
    values.push(field);
    rows.push(values);
  });

  return rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header.trim()] = row[index] ? row[index].trim() : "";
    });
    return entry;
  });
}

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildImageDescriptionDetail(entry, level) {
  const primaryDetail = entry.detail_1 || entry.detail || "";
  const secondaryDetail = entry.detail_2 || "";
  const tertiaryDetail = entry.detail_3 || "";

  if (level <= 3) {
    return primaryDetail;
  }

  if (level === 4) {
    return [primaryDetail, secondaryDetail].filter(Boolean).join(" ");
  }

  return [primaryDetail, secondaryDetail, tertiaryDetail].filter(Boolean).join(" ");
}

function buildImageDescriptionText(subject, detail, level) {
  const scene = detail ? `${subject} ${detail}` : subject;

  switch (level) {
    case 1:
      return `A picture of ${scene}.`;
    case 2:
      return `The picture shows ${scene}.`;
    case 3:
      return `The picture shows ${scene}, making the scene easy to notice.`;
    case 4:
      return `The image shows ${scene}, creating a clear scene.`;
    case 5:
      return `The image shows ${scene}, and the details make it vivid.`;
    case 6:
      return `The image shows ${scene}, and the details help the scene feel complete.`;
    default:
      return `The picture shows ${scene}.`;
  }
}

function buildImageDescriptionQuestions(records) {
  return records.flatMap((record, recordIndex) => {
    return [1, 2, 3, 4, 5, 6].map(level => {
      const chosenDistractors = shuffle(record.distractors).slice(0, 2);
      const choices = shuffle([
        {
          text: buildImageDescriptionText(record.correct.subject, buildImageDescriptionDetail(record.correct, level), level),
          isCorrect: true
        },
        ...chosenDistractors.map(distractor => ({
          text: buildImageDescriptionText(distractor.subject, buildImageDescriptionDetail(distractor, level), level),
          isCorrect: false
        }))
      ]);

      return {
        id: `image-description-${recordIndex}-level-${level}`,
        type: 'image-description',
        text: 'Which description best matches the image?',
        image: record.image,
        imageAlt: record.alt,
        choices: choices.map(choice => choice.text),
        answer: choices.findIndex(choice => choice.isCorrect),
        level: level
      };
    });
  });
}

function buildImageSelectQuestions(records) {
  return records.map((record, index) => {
    const imageChoices = shuffle([
      {
        src: record.correct_image,
        alt: record.correct_image_alt || record.description,
        isCorrect: true
      },
      ...(record.distractor_images || []).map((src, distractorIndex) => ({
        src,
        alt: record.distractor_image_alts?.[distractorIndex] || `Distractor image ${distractorIndex + 1}`,
        isCorrect: false
      }))
    ]);

    return {
      id: record.id || `image-select-${index}`,
      type: 'image-select',
      text: 'Select the image that matches this description:',
      promptDetail: record.description,
      imageChoices,
      choices: imageChoices.map((choice, choiceIndex) => `Image option ${choiceIndex + 1}`),
      answer: imageChoices.findIndex(choice => choice.isCorrect),
      level: Number(record.grade_level)
    };
  });
}

function renderImageSelectQuestion(question) {
  const legend = document.createElement("legend");
  legend.className = "sr-only";
  legend.textContent = "Choose the image that matches the description";
  choicesEl.appendChild(legend);

  const imageGrid = document.createElement("div");
  imageGrid.className = "image-choice-grid";

  question.imageChoices.forEach((choice, index) => {
    const radioId = `image-choice-${index}`;

    const input = document.createElement("input");
    input.type = "radio";
    input.id = radioId;
    input.name = "answer";
    input.value = index;
    input.className = "image-choice-input";
    input.setAttribute("aria-label", `Image option ${index + 1}: ${choice.alt}`);
    input.onchange = () => {
      handleChoiceSelection(index, input);
    };

    const image = document.createElement("img");
    image.src = choice.src;
    image.alt = choice.alt;
    image.loading = "lazy";

    const label = document.createElement("label");
    label.htmlFor = radioId;
    label.className = "image-choice-label";
    label.appendChild(image);

    const caption = document.createElement("span");
    caption.className = "image-choice-caption";
    caption.textContent = `Option ${index + 1}`;
    label.appendChild(caption);

    const wrapper = document.createElement("div");
    wrapper.className = "image-choice-wrapper";
    wrapper.appendChild(input);
    wrapper.appendChild(label);

    imageGrid.appendChild(wrapper);
  });

  choicesEl.appendChild(imageGrid);
}

function buildEmotionChoiceText(emotion) {
  const emoji = emotion.emoji || '';
  const label = emotion.label || 'Unknown Emotion';
  const description = emotion.description || '';

  if (description) {
    return `${emoji} ${label} - ${description}`.trim();
  }

  return `${emoji} ${label}`.trim();
}

function buildCharacterEmotionQuestions(records) {
  return records.map((record, index) => {
    const passage = record.passage || record.description || '';
    const question = record.question || 'How is the character feeling?';
    const choices = shuffle([
      {
        text: buildEmotionChoiceText(record.correct_emotion || {}),
        isCorrect: true
      },
      ...((record.distractor_emotions || []).map(emotion => ({
        text: buildEmotionChoiceText(emotion),
        isCorrect: false
      })))
    ]);

    return {
      id: record.id || `character-emotion-${index}`,
      type: 'character-emotion',
      text: question,
      promptDetail: passage,
      choices: choices.map(choice => choice.text),
      answer: choices.findIndex(choice => choice.isCorrect),
      level: Number(record.grade_level)
    };
  });
}

function buildSentenceOrderingQuestions(records) {
  return records
    .filter(record => Array.isArray(record.segments) && record.segments.length >= 3)
    .map((record, index) => {
      const segmentItems = record.segments.map((segmentText, segmentIndex) => ({
        id: `seg-${segmentIndex}`,
        text: segmentText
      }));

      return {
        id: record.id || `sentence-ordering-${index}`,
        type: 'sentence-ordering',
        text: record.text || 'Put the sentence parts in the best order.',
        promptDetail: record.prompt || '',
        level: Number(record.level) || 1,
        segments: segmentItems,
        answerOrder: segmentItems.map(segment => segment.id)
      };
    });
}

function buildWordMatchingQuestions(records) {
  return records
    .filter(record => Array.isArray(record.pairs) && record.pairs.length >= 3)
    .map((record, index) => {
      const normalizedPairs = record.pairs
        .filter(pair => pair && pair.left && pair.right)
        .slice(0, 3)
        .map((pair, pairIndex) => ({
          leftId: `left-${pairIndex}`,
          left: pair.left,
          right: pair.right
        }));

      if (normalizedPairs.length < 3) {
        return null;
      }

      const leftWords = normalizedPairs.map(pair => ({
        id: pair.leftId,
        text: pair.left
      }));

      const rightWords = shuffle(normalizedPairs.map((pair, pairIndex) => ({
        id: `right-${pairIndex}`,
        text: pair.right
      })));

      const correctMatches = {};
      normalizedPairs.forEach(pair => {
        correctMatches[pair.leftId] = pair.right;
      });

      return {
        id: record.id || `word-matching-${index}`,
        type: 'word-matching',
        text: record.text || 'Match each word on the left with the similar word on the right.',
        promptDetail: record.prompt || '',
        level: Number(record.level) || 1,
        leftWords,
        rightWords,
        correctMatches
      };
    })
    .filter(Boolean);
}

function clearWordMatchResizeHandler() {
  if (wordMatchResizeHandler) {
    window.removeEventListener('resize', wordMatchResizeHandler);
    wordMatchResizeHandler = null;
  }
}

function normalizeWord(value) {
  return value
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "")
    .replace(/'s$/, "");
}

function updateSelectionStatus(message = "") {
  const selectedCount = selectedPassageWords.size;
  const baseMessage = `Directions: Click the five most important words in the paragraph. You can select up to ${maxPassageSelections} words (${selectedCount}/${maxPassageSelections} selected).`;
  const finalMessage = message ? `${baseMessage} ${message}` : baseMessage;

  selectionStatusEl.textContent = finalMessage;
  selectionStatusEl.classList.remove("hidden");
  selectionStatusEl.classList.toggle("limit-reached", selectedCount >= maxPassageSelections);
}

function updatePassageWordStyles() {
  choicesEl.querySelectorAll(".passage-word").forEach(button => {
    const token = button.dataset.normalized;
    button.classList.toggle("selected", selectedPassageWords.has(token));
    button.setAttribute("aria-pressed", String(selectedPassageWords.has(token)));
  });
}

function togglePassageWordSelection(token) {
  if (!token || answered) {
    return;
  }

  if (selectedPassageWords.has(token)) {
    selectedPassageWords.delete(token);
    updateSelectionStatus();
    updatePassageWordStyles();
    return;
  }

  if (selectedPassageWords.size >= maxPassageSelections) {
    updateSelectionStatus("You have reached the limit. Deselect one word to choose another.");
    return;
  }

  selectedPassageWords.add(token);
  updateSelectionStatus();
  updatePassageWordStyles();

  if (selectedPassageWords.size >= maxPassageSelections) {
    finalizeKeywordQuestion();
  }
}

function scoreKeywordSelections(question) {
  const selectedWords = Array.from(selectedPassageWords);
  const keywordEntries = question.keywords || [];
  let matchedCount = 0;

  keywordEntries.forEach(keyword => {
    const targets = [keyword.word, ...(keyword.aliases || [])]
      .map(normalizeWord)
      .filter(Boolean);
    const isMatched = selectedWords.some(word => targets.includes(normalizeWord(word)));

    if (isMatched) {
      matchedCount += 1;
    }
  });

  return {
    matchedCount,
    selectedCount: selectedWords.length
  };
}

function advanceToNextQuestion() {
  if (questionsAsked < questionCount) {
    pickNextQuestion();
  } else {
    showResult();
  }
}

function finalizeKeywordQuestion() {
  if (answered) {
    return;
  }

  answered = true;
  const result = scoreKeywordSelections(currentQuestion);
  const isCorrect = result.matchedCount >= 2;

  if (isCorrect) {
    score += currentQuestion.level;
    correctCount += 1;
    highestCorrectLevel = Math.max(highestCorrectLevel, currentLevel);
    if (currentLevel < 6) {
      currentLevel += 1;
    }
  } else if (currentLevel > 1) {
    currentLevel -= 1;
  }

  choicesEl.querySelectorAll(".passage-word").forEach(button => {
    button.disabled = true;
  });

  window.setTimeout(advanceToNextQuestion, autoAdvanceDelayMs);
}

function handleChoiceSelection(index, inputElement) {
  if (answered) {
    inputElement.checked = false;
    return;
  }

  selected = index;
  answered = true;

  const isCorrect = selected === currentQuestion.answer;
  if (isCorrect) {
    score += currentQuestion.level;
    correctCount += 1;
    highestCorrectLevel = Math.max(highestCorrectLevel, currentLevel);
    if (currentLevel < 6) {
      currentLevel += 1;
    }
  } else if (currentLevel > 1) {
    currentLevel -= 1;
  }

  document.querySelectorAll("input[name='answer']").forEach(input => {
    input.disabled = true;
  });

  const selectedWrapper = inputElement.closest('.choice-wrapper, .image-choice-wrapper');
  if (selectedWrapper) {
    selectedWrapper.classList.add(isCorrect ? 'verdict-correct' : 'verdict-incorrect');
  }

  window.setTimeout(advanceToNextQuestion, autoAdvanceDelayMs);
}

function renderWordMatchingQuestion(question) {
  const isSmallScreen = window.matchMedia('(max-width: 700px)').matches;
  wordMatchSelectedLeftId = null;
  wordMatchPairs = new Map();

  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = 'Match words on the left to similar words on the right';
  choicesEl.appendChild(legend);

  const wrapper = document.createElement('div');
  wrapper.className = 'word-match-wrapper';

  const board = document.createElement('div');
  board.className = 'word-match-board';

  const linesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  linesSvg.classList.add('word-match-lines');
  linesSvg.setAttribute('aria-hidden', 'true');

  const columns = document.createElement('div');
  columns.className = 'word-match-columns';

  const leftColumn = document.createElement('div');
  leftColumn.className = 'word-match-column left';

  const rightColumn = document.createElement('div');
  rightColumn.className = 'word-match-column right';

  const leftButtons = new Map();
  const rightButtons = new Map();
  const rightTextById = new Map(question.rightWords.map(item => [item.id, item.text]));

  function getNextUnmatchedLeftId() {
    const unmatched = question.leftWords.find(leftItem => !wordMatchPairs.has(leftItem.id));
    return unmatched ? unmatched.id : null;
  }

  function updateStatus() {
    if (isSmallScreen) {
      const activeLeftWord = question.leftWords.find(item => item.id === wordMatchSelectedLeftId);
      const activeText = activeLeftWord ? `Current word: ${activeLeftWord.text}.` : 'All left words matched.';
      selectionStatusEl.textContent = `${activeText} Match all pairs (${wordMatchPairs.size}/${question.leftWords.length} complete).`;
    } else {
      selectionStatusEl.textContent = `Match all pairs (${wordMatchPairs.size}/${question.leftWords.length} complete).`;
    }
    selectionStatusEl.classList.remove('hidden');
  }

  function drawLines() {
    linesSvg.innerHTML = '';
    const boardRect = board.getBoundingClientRect();
    const width = Math.max(1, Math.round(boardRect.width));
    const height = Math.max(1, Math.round(boardRect.height));
    linesSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    wordMatchPairs.forEach((rightId, leftId) => {
      const leftButton = leftButtons.get(leftId);
      const rightButton = rightButtons.get(rightId);
      if (!leftButton || !rightButton) {
        return;
      }

      const leftRect = leftButton.getBoundingClientRect();
      const rightRect = rightButton.getBoundingClientRect();
      const x1 = leftRect.right - boardRect.left;
      const y1 = leftRect.top + (leftRect.height / 2) - boardRect.top;
      const x2 = rightRect.left - boardRect.left;
      const y2 = rightRect.top + (rightRect.height / 2) - boardRect.top;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.classList.add('word-match-line');
      linesSvg.appendChild(line);
    });
  }

  function updateButtonStyles() {
    leftButtons.forEach((button, leftId) => {
      button.classList.toggle('active', leftId === wordMatchSelectedLeftId);
      button.classList.toggle('matched', wordMatchPairs.has(leftId));
    });

    const claimedRights = new Set(Array.from(wordMatchPairs.values()));
    rightButtons.forEach((button, rightId) => {
      button.classList.toggle('matched', claimedRights.has(rightId));
    });
  }

  function applyMatchResult() {
    if (wordMatchPairs.size !== question.leftWords.length || answered) {
      return;
    }

    answered = true;
    const isCorrect = question.leftWords.every(leftItem => {
      const selectedRightId = wordMatchPairs.get(leftItem.id);
      const selectedRightText = rightTextById.get(selectedRightId);
      return selectedRightText === question.correctMatches[leftItem.id];
    });

    if (isCorrect) {
      score += currentQuestion.level;
      correctCount += 1;
      highestCorrectLevel = Math.max(highestCorrectLevel, currentLevel);
      if (currentLevel < 6) {
        currentLevel += 1;
      }
    } else if (currentLevel > 1) {
      currentLevel -= 1;
    }

    wrapper.classList.add(isCorrect ? 'verdict-correct' : 'verdict-incorrect');
    wrapper.querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });

    window.setTimeout(advanceToNextQuestion, autoAdvanceDelayMs);
  }

  function selectLeft(leftId) {
    if (answered || isSmallScreen) {
      return;
    }

    wordMatchSelectedLeftId = leftId;
    updateStatus();
    updateButtonStyles();
  }

  function connectToRight(rightId) {
    if (answered) {
      return;
    }

    if (!wordMatchSelectedLeftId) {
      if (isSmallScreen) {
        wordMatchSelectedLeftId = getNextUnmatchedLeftId();
      }
    }

    if (!wordMatchSelectedLeftId) {
      return;
    }

    wordMatchPairs.forEach((claimedRightId, ownerLeftId) => {
      if (claimedRightId === rightId && ownerLeftId !== wordMatchSelectedLeftId) {
        wordMatchPairs.delete(ownerLeftId);
      }
    });

    wordMatchPairs.set(wordMatchSelectedLeftId, rightId);
    wordMatchSelectedLeftId = isSmallScreen ? getNextUnmatchedLeftId() : null;
    updateStatus();
    updateButtonStyles();
    drawLines();
    applyMatchResult();
  }

  question.leftWords.forEach(leftItem => {
    if (isSmallScreen) {
      const label = document.createElement('div');
      label.className = 'word-match-item word-match-left-label';
      label.textContent = leftItem.text;
      label.setAttribute('aria-hidden', 'true');
      leftButtons.set(leftItem.id, label);
      leftColumn.appendChild(label);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word-match-item word-match-left-item';
    button.textContent = leftItem.text;
    button.setAttribute('aria-label', `Left word: ${leftItem.text}`);
    button.onclick = () => selectLeft(leftItem.id);
    leftButtons.set(leftItem.id, button);
    leftColumn.appendChild(button);
  });

  question.rightWords.forEach(rightItem => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'word-match-item word-match-right-item';
    button.textContent = rightItem.text;
    button.setAttribute('aria-label', `Right word: ${rightItem.text}`);
    button.onclick = () => connectToRight(rightItem.id);
    rightButtons.set(rightItem.id, button);
    rightColumn.appendChild(button);
  });

  columns.appendChild(leftColumn);
  columns.appendChild(rightColumn);
  board.appendChild(linesSvg);
  board.appendChild(columns);
  wrapper.appendChild(board);
  choicesEl.appendChild(wrapper);

  if (isSmallScreen) {
    wordMatchSelectedLeftId = getNextUnmatchedLeftId();
    wrapper.classList.add('mobile-guided-mode');
  }

  updateStatus();
  updateButtonStyles();
  drawLines();

  wordMatchResizeHandler = () => drawLines();
  window.addEventListener('resize', wordMatchResizeHandler);

  // Draw again after layout settles to keep lines aligned with dynamic text wrapping.
  window.requestAnimationFrame(() => drawLines());

  const firstFocusable = isSmallScreen
    ? rightColumn.querySelector('button')
    : leftColumn.querySelector('button');
  if (firstFocusable) {
    firstFocusable.focus();
  }
}

function renderSentenceOrderingQuestion(question) {
  selectedSentenceOrder = [];

  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = 'Arrange the sentence parts in order';
  choicesEl.appendChild(legend);

  const wrapper = document.createElement('div');
  wrapper.className = 'sentence-ordering-wrapper';

  const controls = document.createElement('div');
  controls.className = 'sentence-ordering-controls';

  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'sentence-ordering-control';
  undoBtn.textContent = 'Undo';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'sentence-ordering-control';
  clearBtn.textContent = 'Clear';

  controls.appendChild(undoBtn);
  controls.appendChild(clearBtn);
  wrapper.appendChild(controls);

  const answerList = document.createElement('ol');
  answerList.className = 'sentence-order-list';

  const bank = document.createElement('div');
  bank.className = 'sentence-order-bank';

  const segmentsById = new Map(question.segments.map(segment => [segment.id, segment]));
  const shuffledIds = shuffle(question.answerOrder);

  function checkSentenceOrder() {
    if (selectedSentenceOrder.length !== question.answerOrder.length || answered) {
      return;
    }

    answered = true;
    const isCorrect = selectedSentenceOrder.every((segmentId, index) => segmentId === question.answerOrder[index]);

    if (isCorrect) {
      score += currentQuestion.level;
      correctCount += 1;
      highestCorrectLevel = Math.max(highestCorrectLevel, currentLevel);
      if (currentLevel < 6) {
        currentLevel += 1;
      }
    } else if (currentLevel > 1) {
      currentLevel -= 1;
    }

    wrapper.classList.add(isCorrect ? 'verdict-correct' : 'verdict-incorrect');
    wrapper.querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });

    window.setTimeout(advanceToNextQuestion, autoAdvanceDelayMs);
  }

  function renderOrderUI() {
    bank.innerHTML = '';
    answerList.innerHTML = '';

    const availableIds = shuffledIds.filter(id => !selectedSentenceOrder.includes(id));
    availableIds.forEach(segmentId => {
      const segment = segmentsById.get(segmentId);
      if (!segment) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sentence-order-chip';
      button.textContent = segment.text;
      button.setAttribute('aria-label', `Add phrase: ${segment.text}`);
      button.onclick = () => {
        if (answered) {
          return;
        }

        selectedSentenceOrder.push(segmentId);
        renderOrderUI();
        checkSentenceOrder();
      };

      bank.appendChild(button);
    });

    if (selectedSentenceOrder.length === 0) {
      const placeholder = document.createElement('li');
      placeholder.className = 'sentence-order-placeholder';
      placeholder.textContent = 'Tap sentence parts below to build your answer.';
      answerList.appendChild(placeholder);
    } else {
      selectedSentenceOrder.forEach((segmentId, orderIndex) => {
        const segment = segmentsById.get(segmentId);
        if (!segment) {
          return;
        }

        const item = document.createElement('li');
        item.className = 'sentence-order-item';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'sentence-order-remove';
        removeBtn.textContent = `${orderIndex + 1}. ${segment.text}`;
        removeBtn.setAttribute('aria-label', `Remove phrase ${orderIndex + 1}: ${segment.text}`);
        removeBtn.onclick = () => {
          if (answered) {
            return;
          }

          selectedSentenceOrder = selectedSentenceOrder.filter((id, idx) => !(id === segmentId && idx === orderIndex));
          renderOrderUI();
        };

        item.appendChild(removeBtn);
        answerList.appendChild(item);
      });
    }

    const complete = selectedSentenceOrder.length === question.answerOrder.length;
    selectionStatusEl.textContent = complete
      ? 'Answer complete. Checking order...'
      : `Build the sentence by choosing all parts (${selectedSentenceOrder.length}/${question.answerOrder.length}).`;
    selectionStatusEl.classList.remove('hidden');
  }

  undoBtn.onclick = () => {
    if (answered || selectedSentenceOrder.length === 0) {
      return;
    }

    selectedSentenceOrder.pop();
    renderOrderUI();
  };

  clearBtn.onclick = () => {
    if (answered || selectedSentenceOrder.length === 0) {
      return;
    }

    selectedSentenceOrder = [];
    renderOrderUI();
  };

  wrapper.appendChild(answerList);
  wrapper.appendChild(bank);
  choicesEl.appendChild(wrapper);

  renderOrderUI();

  const firstChip = choicesEl.querySelector('.sentence-order-chip');
  if (firstChip) {
    firstChip.focus();
  }
}

function renderKeywordHighlightQuestion(question) {
  selectedPassageWords = new Set();
  selectionStatusEl.classList.remove("hidden");
  updateSelectionStatus();

  const legend = document.createElement("legend");
  legend.className = "sr-only";
  legend.textContent = "Select up to five important words from the passage";
  choicesEl.appendChild(legend);

  const paragraph = document.createElement("p");
  paragraph.className = "passage-text";

  const tokens = question.passage.split(/(\s+)/);
  tokens.forEach(token => {
    if (/^\s+$/.test(token)) {
      paragraph.appendChild(document.createTextNode(token));
      return;
    }

    const normalized = normalizeWord(token);
    if (!normalized) {
      paragraph.appendChild(document.createTextNode(token));
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "passage-word";
    button.dataset.normalized = normalized;
    button.textContent = token;
    button.setAttribute("aria-label", `Select word ${token}`);
    button.setAttribute("aria-pressed", "false");
    button.onclick = () => togglePassageWordSelection(normalized);
    paragraph.appendChild(button);
  });

  choicesEl.appendChild(paragraph);
}

function loadAllQuestions() {
  const loadPromises = questionTypes.map(type => {
    const source = questionSources[type];

    if (!source) {
      return Promise.reject(new Error(`Missing question source for ${type}`));
    }

    const loader = source.format === 'json' ? 'json' : 'text';

    return fetch(source.file)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${source.file}`);
        }

        return response[loader]();
      })
      .then(data => {
        if (type === 'image-description') {
          allQuestionsByType[type] = buildImageDescriptionQuestions(data);
          return;
        }

        if (type === 'keyword-highlight') {
          allQuestionsByType[type] = data.map((entry, index) => ({
            ...entry,
            id: entry.id || `${type}-${index}`,
            type: type,
            text: entry.text || 'Read the passage and select the five most important words.',
            level: Number(entry.level)
          }));
          return;
        }

        if (type === 'image-select') {
          allQuestionsByType[type] = buildImageSelectQuestions(data);
          return;
        }

        if (type === 'sentence-ordering') {
          allQuestionsByType[type] = buildSentenceOrderingQuestions(data);
          return;
        }

        if (type === 'word-matching') {
          allQuestionsByType[type] = buildWordMatchingQuestions(data);
          return;
        }

        if (type === 'character-emotion') {
          allQuestionsByType[type] = buildCharacterEmotionQuestions(data);
          return;
        }

        allQuestionsByType[type] = parseCSV(data).map((row, index) => ({
          id: `${type}-${index}`,
          type: type,
          text: row.text,
          choices: [row.choice1, row.choice2, row.choice3].filter(choice => choice && choice.trim()),
          answer: Number(row.answer) - 1,
          level: Number(row.level)
        }));
      })
      .catch(error => {
        console.error(`Error loading ${source.file}:`, error);
        questionEl.textContent = `Unable to load ${type} questions. Please refresh the page.`;
        throw error;
      });
  });

  Promise.all(loadPromises)
    .then(() => startNewQuiz())
    .catch(() => {});
}

function startNewQuiz() {
  currentLevel = 1;
  questionsAsked = 0;
  score = 0;
  correctCount = 0;
  highestCorrectLevel = 1;
  totalQuestionLevels = 0;
  selected = null;
  answered = false;
  selectedPassageWords = new Set();
  selectedSentenceOrder = [];
  usedQuestionIds = new Set();
  usedQuestionTypes = new Set();
  resultEl.classList.add("hidden");
  updateProgressBars(0, currentLevel);
  progressBarEl.classList.add("shimmer");
  progressBarEl.addEventListener('animationend', () => progressBarEl.classList.remove('shimmer'), { once: true });
  pickNextQuestion();
}

function pickNextQuestion() {
  if (questionsAsked >= questionCount) {
    showResult();
    return;
  }

  let typeToUse = null;
  
  if (usedQuestionTypes.size === questionTypes.length) {
    usedQuestionTypes = new Set();
  }
  
  const unusedTypes = questionTypes.filter(t => !usedQuestionTypes.has(t));
  typeToUse = unusedTypes[Math.floor(Math.random() * unusedTypes.length)];
  usedQuestionTypes.add(typeToUse);

  let candidates = allQuestionsByType[typeToUse].filter(
    q => q.level === currentLevel && !usedQuestionIds.has(q.id)
  );
  
  if (candidates.length === 0) {
    candidates = allQuestionsByType[typeToUse].filter(
      q => !usedQuestionIds.has(q.id)
    );
  }

  if (candidates.length === 0) {
    showResult();
    return;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  currentQuestion = candidates[randomIndex];
  currentQuestionType = typeToUse;
  usedQuestionIds.add(currentQuestion.id);
  questionsAsked += 1;
  totalQuestionLevels += currentQuestion.level;
  loadQuestion();
}

const questionEl = document.getElementById("question");
const progressLabelEl = document.getElementById("progressLabel");
const progressTypeEl = document.getElementById("progressType");
const progressCompletedEl = document.getElementById("progressCompleted");
const progressBarEl = document.getElementById("progressBar");
const questionMediaEl = document.getElementById("questionMedia");
const selectionStatusEl = document.getElementById("selectionStatus");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const feedbackEl = document.getElementById("feedback");
const resultEl = document.getElementById("result");

function updateProgressBars(completedQuestions, gradeLevel) {
  const safeCompleted = Math.max(0, Math.min(questionCount, completedQuestions));
  const safeGrade = Math.max(1, Math.min(6, gradeLevel));
  const completedPercent = Math.round((safeCompleted / questionCount) * 100);
  const gradePercent = Math.round((safeGrade / 6) * 100);

  progressCompletedEl.style.width = `${completedPercent}%`;
  progressCompletedEl.setAttribute("aria-valuenow", String(safeCompleted));

  progressBarEl.style.width = `${gradePercent}%`;
  progressBarEl.setAttribute("aria-valuenow", String(safeGrade));
}

function loadQuestion() {
  selected = null;
  answered = false;
  clearWordMatchResizeHandler();
  feedbackEl.classList.add("hidden");
  feedbackEl.textContent = "";
  nextBtn.classList.add("hidden");
  selectionStatusEl.classList.add("hidden");
  selectionStatusEl.classList.remove("limit-reached");

  const q = currentQuestion;
  progressLabelEl.textContent = `Question ${questionsAsked} of ${questionCount}`;
  progressTypeEl.textContent = currentQuestionType.replace(/-/g, ' ');
  updateProgressBars(questionsAsked - 1, currentLevel);
  if ((q.type === 'image-select' || q.type === 'character-emotion' || q.type === 'sentence-ordering' || q.type === 'word-matching') && q.promptDetail) {
    questionEl.innerHTML = '';

    const promptDetail = document.createElement('span');
    promptDetail.textContent = q.promptDetail;

    const firstLineBreak = document.createElement('br');
    const secondLineBreak = document.createElement('br');

    const directions = document.createElement('span');
    directions.textContent = q.text;

    questionEl.appendChild(promptDetail);
    questionEl.appendChild(firstLineBreak);
    questionEl.appendChild(secondLineBreak);
    questionEl.appendChild(directions);
  } else {
    questionEl.textContent = q.text;
  }
  questionMediaEl.innerHTML = "";
  if (q.image) {
    const image = document.createElement("img");
    image.src = q.image;
    image.alt = q.imageAlt || q.text;
    image.loading = "lazy";
    questionMediaEl.appendChild(image);
    questionMediaEl.classList.remove("hidden");
  } else {
    questionMediaEl.classList.add("hidden");
  }
  choicesEl.innerHTML = '<legend class="sr-only">Choose the correct answer</legend>';
  choicesEl.classList.remove("hidden");
  questionEl.classList.remove("hidden");
  resultEl.classList.add("hidden");

  if (q.type === 'keyword-highlight') {
    choicesEl.innerHTML = "";
    renderKeywordHighlightQuestion(q);
    const firstWordButton = choicesEl.querySelector(".passage-word");
    if (firstWordButton) {
      firstWordButton.focus();
    }
    return;
  }

  if (q.type === 'image-select') {
    choicesEl.innerHTML = "";
    renderImageSelectQuestion(q);
    const firstImageChoice = choicesEl.querySelector('input[type="radio"]');
    if (firstImageChoice) {
      firstImageChoice.focus();
    }
    return;
  }

  if (q.type === 'sentence-ordering') {
    choicesEl.innerHTML = "";
    renderSentenceOrderingQuestion(q);
    return;
  }

  if (q.type === 'word-matching') {
    choicesEl.innerHTML = "";
    renderWordMatchingQuestion(q);
    return;
  }

  q.choices.forEach((choice, index) => {
    const radioId = `choice-${index}`;
    
    const input = document.createElement("input");
    input.type = "radio";
    input.id = radioId;
    input.name = "answer";
    input.value = index;
    input.setAttribute("aria-label", choice);
    input.onchange = () => {
      handleChoiceSelection(index, input);
    };

    const label = document.createElement("label");
    label.htmlFor = radioId;
    label.className = "choice-label";
    label.textContent = choice;

    const div = document.createElement("div");
    div.className = "choice-wrapper";
    div.appendChild(input);
    div.appendChild(label);

    choicesEl.appendChild(div);
  });

  // Focus on the first choice for keyboard users
  const firstInput = choicesEl.querySelector('input[type="radio"]');
  if (firstInput) {
    firstInput.focus();
  }
}

function showResult() {
  clearWordMatchResizeHandler();
  questionEl.classList.add("hidden");
  choicesEl.classList.add("hidden");
  nextBtn.classList.add("hidden");
  feedbackEl.classList.add("hidden");
  selectionStatusEl.classList.add("hidden");
  progressLabelEl.textContent = "Quiz complete";
  progressTypeEl.textContent = "";

  const weightedRatio = totalQuestionLevels > 0 ? score / totalQuestionLevels : 0;
  const grade = Math.max(1, Math.min(6, Math.round(1 + weightedRatio * 5)));
  updateProgressBars(questionCount, grade);

  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>This short quiz estimates a student's reading level from Grade 1 up to Grade 6.</p>
    <p>Weighted estimated reading level: Grade ${grade}</p>
  `;
  fetch('recommendations.csv')
    .then(res => res.text())
    .then(text => {
      try {
        const recs = parseCSV(text);
        const gradeRecs = recs.filter(r => Number(r['Grade']) === grade);
        if (gradeRecs.length > 0) {
          const section = document.createElement('div');
          section.classList.add('recommendations');
          const h3 = document.createElement('h3');
          h3.textContent = `Recommended reading for Grade ${grade}`;
          section.appendChild(h3);
          const list = document.createElement('ul');
          gradeRecs.forEach(r => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = r['Free Read Link'] || r['Free Read link'] || r['Free Read'] || r['Free Read Link '];
            a.target = '_blank';
            a.rel = 'noopener';
            const title = r['Title'] || r['title'] || 'Recommended Title';
            const author = r['Author'] ? ` — ${r['Author']}` : '';
            a.textContent = `${title}${author}`;
            li.appendChild(a);
            list.appendChild(li);
          });
          section.appendChild(list);
          resultEl.appendChild(section);
        }
      } catch (e) {
        console.error('Failed to parse recommendations:', e);
      }
    })
    .catch(err => console.error('Failed to load recommendations.csv:', err));
}

nextBtn.onclick = () => {
  // Manual submit flow is intentionally disabled in favor of auto-advance.
  return;
};

restartBtn.onclick = (event) => {
  event.preventDefault();
  startNewQuiz();
};

loadAllQuestions();