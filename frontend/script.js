let allQuestions = [];
let quizQuestions = [];
let current = 0;
let score = 0;
let correctCount = 0;
let selected = null;
let answered = false;

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
      allQuestions = parseCSV(text).map(row => ({
        text: row.text,
        choices: [row.choice1, row.choice2, row.choice3, row.choice4],
        answer: Number(row.answer),
        level: Number(row.level)
      }));

      const sampleCount = Math.min(10, allQuestions.length);
      quizQuestions = shuffle(allQuestions).slice(0, sampleCount);
      loadQuestion();
    })
    .catch(error => {
      questionEl.textContent = "Unable to load questions. Please refresh the page.";
      console.error("Question load error:", error);
    });
}

const questionEl = document.getElementById("question");
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

  const q = quizQuestions[current];
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
  const correctText = quizQuestions[current].choices[quizQuestions[current].answer];

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

  const grade = Math.max(1, Math.min(6, Math.ceil((correctCount / quizQuestions.length) * 6)));
  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>Correct answers: ${correctCount} / ${quizQuestions.length}</p>
    <p>Your estimated reading level: Grade ${grade}</p>
  `;
}

nextBtn.onclick = () => {
  if (selected === null) return alert("Please select an answer before continuing.");

  if (!answered) {
    answered = true;
    const isCorrect = selected === quizQuestions[current].answer;
    if (isCorrect) {
      score += quizQuestions[current].level;
      correctCount += 1;
    }
    showFeedback(isCorrect);
    nextBtn.textContent = current < quizQuestions.length - 1 ? "Continue" : "See Score";
    document.querySelectorAll(".choice").forEach(c => c.classList.add("disabled"));
    return;
  }

  current += 1;
  if (current < quizQuestions.length) {
    loadQuestion();
  } else {
    showResult();
  }
};

restartBtn.onclick = () => {
  current = 0;
  score = 0;
  correctCount = 0;
  selected = null;
  answered = false;
  resultEl.classList.add("hidden");

  const sampleCount = Math.min(10, allQuestions.length);
  quizQuestions = shuffle(allQuestions).slice(0, sampleCount);
  loadQuestion();
};

loadQuestionsFromCSV();
