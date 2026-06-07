let allQuestionsByType = {
  'multiple-choice': [],
  'sentence-completion': [],
  'vocabulary-in-context': []
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
const questionTypes = ['multiple-choice', 'sentence-completion', 'vocabulary-in-context'];

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

function loadAllQuestions() {
  let loadedCount = 0;

  questionTypes.forEach(type => {
    const fileName = `${type}-questions.csv`;
    fetch(fileName)
      .then(response => response.text())
      .then(text => {
        allQuestionsByType[type] = parseCSV(text).map((row, index) => ({
          id: `${type}-${index}`,
          type: type,
          text: row.text,
          choices: [row.choice1, row.choice2, row.choice3].filter(choice => choice && choice.trim()),
          answer: Number(row.answer) - 1,
          level: Number(row.level)
        }));
        
        loadedCount += 1;
        if (loadedCount === questionTypes.length) {
          startNewQuiz();
        }
      })
      .catch(error => {
        console.error(`Error loading ${fileName}:`, error);
        questionEl.textContent = `Unable to load ${type} questions. Please refresh the page.`;
      });
  });
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
  questionEl.textContent = q.text;
  choicesEl.innerHTML = "";
  choicesEl.classList.remove("hidden");
  questionEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  nextBtn.classList.remove("hidden");

  q.choices.forEach((choice, index) => {
    const div = document.createElement("div");
    div.textContent = choice;
    div.classList.add("choice");

    div.onclick = () => {
      if (answered) return;
      document.querySelectorAll(".choice").forEach(c => c.classList.remove("selected"));
      div.classList.add("selected");
      selected = index;
    };

    choicesEl.appendChild(div);
  });
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
  if (selected === null) return alert("Please select an answer before continuing.");

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
    document.querySelectorAll(".choice").forEach(c => c.classList.add("disabled"));
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