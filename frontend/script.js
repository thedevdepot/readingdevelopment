let allQuestions = [];
let currentQuestion = null;
let currentLevel = 1;
let questionsAsked = 0;
let score = 0;
let correctCount = 0;
let highestCorrectLevel = 1;
let totalQuestionLevels = 0;
let selected = null;
let answered = false;
let usedQuestionIds = new Set();
const questionCount = 10;

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

function loadQuestionsFromCSV() {
  fetch("questions.csv")
    .then(response => response.text())
    .then(text => {
      allQuestions = parseCSV(text).map((row, index) => ({
        id: index,
        text: row.text,
        choices: [row.choice1, row.choice2, row.choice3, row.choice4].filter(choice => choice && choice.trim()),
        answer: Number(row.answer) - 1,
        level: Number(row.level)
      }));

      if (allQuestions.length === 0) {
        throw new Error("No questions loaded from CSV.");
      }

      startNewQuiz();
    })
    .catch(error => {
      questionEl.textContent = "Unable to load questions. Please refresh the page.";
      console.error("Question load error:", error);
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
  resultEl.classList.add("hidden");
  pickNextQuestion();
}

function pickNextQuestion() {
  if (questionsAsked >= questionCount) {
    showResult();
    return;
  }

  let candidates = allQuestions.filter(q => q.level === currentLevel && !usedQuestionIds.has(q.id));
  if (candidates.length === 0) {
    candidates = allQuestions.filter(q => !usedQuestionIds.has(q.id));
  }

  if (candidates.length === 0) {
    showResult();
    return;
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  currentQuestion = candidates[randomIndex];
  usedQuestionIds.add(currentQuestion.id);
  questionsAsked += 1;
  totalQuestionLevels += currentQuestion.level;
  loadQuestion();
}

const questionEl = document.getElementById("question");
const progressEl = document.getElementById("progress");
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
  progressEl.textContent = `Question ${questionsAsked} of ${questionCount} • Level ${currentLevel}`;
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
  progressEl.textContent = "";

  const weightedRatio = totalQuestionLevels > 0 ? score / totalQuestionLevels : 0;
  const grade = Math.max(1, Math.min(6, Math.round(1 + weightedRatio * 5)));

  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>Correct answers: ${correctCount} / ${questionsAsked}</p>
    <p>Highest grade level answered correctly: Grade ${highestCorrectLevel}</p>
    <p>Weighted estimated reading level: Grade ${grade}</p>
  `;
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
  if (allQuestions.length === 0) {
    loadQuestionsFromCSV();
  } else {
    startNewQuiz();
  }
};

loadQuestionsFromCSV();
