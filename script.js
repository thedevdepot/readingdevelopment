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
let selected = null;

const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const resultEl = document.getElementById("result");

function loadQuestion() {
  selected = null;
  const q = questions[current];
  questionEl.textContent = q.text;
  choicesEl.innerHTML = "";

  q.choices.forEach((choice, index) => {
    const div = document.createElement("div");
    div.textContent = choice;
    div.classList.add("choice");

    div.onclick = () => {
      document.querySelectorAll(".choice").forEach(c => c.classList.remove("selected"));
      div.classList.add("selected");
      selected = index;
    };

    choicesEl.appendChild(div);
  });
}

nextBtn.onclick = () => {
  if (selected === null) return alert("Please select an answer!");

  if (selected === questions[current].answer) {
    score += questions[current].level;
  }

  current++;

  if (current < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
};

function showResult() {
  document.getElementById("question").classList.add("hidden");
  choicesEl.classList.add("hidden");
  nextBtn.classList.add("hidden");

  let grade = Math.round(score / questions.length);

  resultEl.classList.remove("hidden");
  resultEl.innerHTML = `<h2>Your estimated reading level: Grade ${grade}</h2>`;
}

loadQuestion();
