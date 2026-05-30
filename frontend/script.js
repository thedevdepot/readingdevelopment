const questions = [
  {
    text: "“The cat sat on the mat.” What is the cat doing?",
    choices: ["Running", "Sitting", "Flying", "Sleeping"],
    answer: 1,
    level: 1
  },
  {
    text: "“He ran quickly to catch the bus.” What does 'quickly' mean?",
    choices: ["Slowly", "Fast", "Carefully", "Sadly"],
    answer: 1,
    level: 2
  },
  {
    text: "“The sun dipped below the horizon.” What time is it?",
    choices: ["Morning", "Noon", "Evening", "Midnight"],
    answer: 2,
    level: 3
  },
  {
    text: "“She spoke in a trembling voice.” What does trembling suggest?",
    choices: ["Anger", "Fear", "Joy", "Excitement"],
    answer: 1,
    level: 3
  },
  {
    text: "“The wind whispered through the trees.” This is an example of?",
    choices: ["Metaphor", "Simile", "Personification", "Hyperbole"],
    answer: 2,
    level: 4
  },
  {
    text: "“He carried the weight of the world on his shoulders.” Meaning?",
    choices: ["Physically strong", "Very stressed", "Happy", "Lazy"],
    answer: 1,
    level: 4
  },
  {
    text: "“It was the best of times, it was the worst of times.” What device?",
    choices: ["Irony", "Alliteration", "Oxymoron", "Repetition"],
    answer: 3,
    level: 5
  },
  {
    text: "“Her smile was a ray of sunshine.” This suggests?",
    choices: ["She is bright", "She is happy and uplifting", "She is loud", "She is quiet"],
    answer: 1,
    level: 5
  },
  {
    text: "“Call me Ishmael.” What is this?",
    choices: ["Dialogue", "Narration", "Metaphor", "Conflict"],
    answer: 1,
    level: 6
  },
  {
    text: "“All animals are equal, but some are more equal than others.” Meaning?",
    choices: ["Equality exists", "Contradiction/irony", "Animals are fair", "Confusion"],
    answer: 1,
    level: 6
  }
];

let current = 0;
let score = 0;
let correctCount = 0;
let selected = null;
let answered = false;

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

  const q = questions[current];
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
  const correctText = questions[current].choices[questions[current].answer];

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

  const grade = Math.max(1, Math.min(6, Math.ceil((correctCount / questions.length) * 6)));
  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>Correct answers: ${correctCount} / ${questions.length}</p>
    <p>Your estimated reading level: Grade ${grade}</p>
  `;
}

nextBtn.onclick = () => {
  if (selected === null) return alert("Please select an answer before continuing.");

  if (!answered) {
    answered = true;
    const isCorrect = selected === questions[current].answer;
    if (isCorrect) {
      score += questions[current].level;
      correctCount += 1;
    }
    showFeedback(isCorrect);
    nextBtn.textContent = current < questions.length - 1 ? "Continue" : "See Score";
    document.querySelectorAll(".choice").forEach(c => c.classList.add("disabled"));
    return;
  }

  current += 1;
  if (current < questions.length) {
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
  loadQuestion();
};

loadQuestion();
