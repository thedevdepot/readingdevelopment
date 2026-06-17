let allQuestionsByType = {
  'multiple-choice': [],
  'sentence-completion': [],
  'vocabulary-in-context': [],
  'image-description': []
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
const questionCount = 10;
const questionTypes = ['multiple-choice', 'sentence-completion', 'vocabulary-in-context', 'image-description'];
const questionSources = {
  'multiple-choice': { file: 'multiple-choice-questions.csv', format: 'csv' },
  'sentence-completion': { file: 'sentence-completion-questions.csv', format: 'csv' },
  'vocabulary-in-context': { file: 'vocabulary-in-context-questions.csv', format: 'csv' },
  'image-description': { file: 'image-description-questions.json', format: 'json' }
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
          text: buildImageDescriptionText(record.correct.subject, record.correct.detail, level),
          isCorrect: true
        },
        ...chosenDistractors.map(distractor => ({
          text: buildImageDescriptionText(distractor.subject, distractor.detail, level),
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
        if (source.format === 'json') {
          allQuestionsByType[type] = buildImageDescriptionQuestions(data);
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
  usedQuestionIds = new Set();
  usedQuestionTypes = new Set();
  resultEl.classList.add("hidden");
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
const progressBarEl = document.getElementById("progressBar");
const questionMediaEl = document.getElementById("questionMedia");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const feedbackEl = document.getElementById("feedback");
const resultEl = document.getElementById("result");

function loadQuestion() {
  selected = null;
  answered = false;
  feedbackEl.classList.add("hidden");
  feedbackEl.textContent = "";
  nextBtn.textContent = "Submit Answer";
  nextBtn.disabled = false;

  const q = currentQuestion;
  progressLabelEl.textContent = `Question ${questionsAsked} of ${questionCount}`;
  progressTypeEl.textContent = currentQuestionType.replace(/-/g, ' ');
  progressBarEl.style.width = `${Math.round((questionsAsked / questionCount) * 100)}%`;
  progressBarEl.setAttribute("aria-valuenow", Math.round((questionsAsked / questionCount) * 100));
  questionEl.textContent = q.text;
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
  nextBtn.classList.remove("hidden");

  q.choices.forEach((choice, index) => {
    const radioId = `choice-${index}`;
    
    const input = document.createElement("input");
    input.type = "radio";
    input.id = radioId;
    input.name = "answer";
    input.value = index;
    input.setAttribute("aria-label", choice);
    input.onchange = () => {
      if (answered) {
        input.checked = false;
        return;
      }
      selected = index;
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

function showFeedback(isCorrect) {
  feedbackEl.classList.remove("hidden");
  const correctText = currentQuestion.choices[currentQuestion.answer];

  if (isCorrect) {
    feedbackEl.textContent = "Correct! Great job. Press Continue to move on.";
  } else {
    feedbackEl.textContent = `Incorrect. The right answer is: ${correctText}. Press Continue to move on.`;
  }
}

function showResult() {
  questionEl.classList.add("hidden");
  choicesEl.classList.add("hidden");
  nextBtn.classList.add("hidden");
  feedbackEl.classList.add("hidden");
  progressLabelEl.textContent = "Quiz complete";
  progressTypeEl.textContent = "";
  progressBarEl.style.width = "100%";

  const weightedRatio = totalQuestionLevels > 0 ? score / totalQuestionLevels : 0;
  const grade = Math.max(1, Math.min(6, Math.round(1 + weightedRatio * 5)));

  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>Correct answers: ${correctCount} / ${questionsAsked}</p>
    <p>Highest grade level answered correctly: Grade ${highestCorrectLevel}</p>
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
  const selectedInput = document.querySelector('input[name="answer"]:checked');
  if (!selectedInput) {
    feedbackEl.classList.remove("hidden");
    feedbackEl.textContent = "Please select an answer before continuing.";
    feedbackEl.setAttribute("role", "alert");
    return;
  }

  selected = parseInt(selectedInput.value);

  if (!answered) {
    answered = true;
    const isCorrect = selected === currentQuestion.answer;
    if (isCorrect) {
      score += currentQuestion.level;
      correctCount += 1;
      highestCorrectLevel = Math.max(highestCorrectLevel, currentLevel);
      if (currentLevel < 6) {
        currentLevel += 1;
      }
    } else {
      if (currentLevel > 1) {
        currentLevel -= 1;
      }
    }
    showFeedback(isCorrect);
    nextBtn.textContent = questionsAsked < questionCount ? "Continue" : "See Score";
    document.querySelectorAll("input[name='answer']").forEach(input => {
      input.disabled = true;
    });
    return;
  }

  if (questionsAsked < questionCount) {
    pickNextQuestion();
  } else {
    showResult();
  }
};

restartBtn.onclick = () => {
  startNewQuiz();
};

loadAllQuestions();