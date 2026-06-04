const questionDataPath = 'missing-word-questions.json';
const questionCount = 3;
let allQuestions = [];
let currentGrade = 1;
let questions = [];
let currentIndex = 0;
let selectedChoice = null;
let answered = false;

const gradeSelectEl = document.getElementById('grade');
const gradeSelectContainer = document.getElementById('gradeSelect');
const startBtn = document.getElementById('startBtn');
const progressEl = document.getElementById('progress');
const sentenceContainer = document.getElementById('sentenceContainer');
const choicesEl = document.getElementById('choices');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const feedbackEl = document.getElementById('feedback');
const resultEl = document.getElementById('result');

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadQuestions() {
  return fetch(questionDataPath)
    .then(response => response.json())
    .then(data => {
      allQuestions = data;
    });
}

function renderSentence(question) {
  const sentence = document.createElement('div');
  sentence.className = 'sentence-text';

  const before = document.createElement('span');
  before.textContent = question.textBefore;
  sentence.appendChild(before);

  const blank = document.createElement('span');
  blank.className = 'blank-zone';
  blank.textContent = '_____';
  blank.dataset.index = '';
  blank.addEventListener('dragover', ev => ev.preventDefault());
  blank.addEventListener('drop', ev => {
    ev.preventDefault();
    if (answered) return;
    const droppedIndex = ev.dataTransfer.getData('text/plain');
    if (!droppedIndex) return;
    setSelected(Number(droppedIndex));
    const chosenWord = question.choices[selectedChoice];
    blank.textContent = chosenWord;
    blank.dataset.index = selectedChoice;
    document.querySelectorAll('.choice-option').forEach(option => option.classList.remove('dragged'));
    document.querySelector(`.choice-option[data-choice-index="${selectedChoice}"]`)?.classList.add('dragged');
  });

  sentence.appendChild(blank);

  const after = document.createElement('span');
  after.textContent = question.textAfter;
  sentence.appendChild(after);

  sentenceContainer.innerHTML = '';
  sentenceContainer.appendChild(sentence);
}

function setSelected(choiceIndex) {
  selectedChoice = choiceIndex;
  document.querySelectorAll('.choice-option').forEach(option => option.classList.toggle('selected', Number(option.dataset.choiceIndex) === choiceIndex));
}

function renderChoices(question) {
  choicesEl.innerHTML = '';
  const shuffled = shuffle(question.choices.map((choice, index) => ({choice, index})));
  shuffled.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-option';
    button.textContent = item.choice;
    button.draggable = true;
    button.dataset.choiceIndex = item.index;
    button.addEventListener('dragstart', ev => {
      ev.dataTransfer.setData('text/plain', item.index);
    });
    button.addEventListener('click', () => {
      if (answered) return;
      const blank = document.querySelector('.blank-zone');
      setSelected(item.index);
      blank.textContent = item.choice;
      blank.dataset.index = item.index;
    });
    choicesEl.appendChild(button);
  });
}

function showQuestion() {
  answered = false;
  selectedChoice = null;
  feedbackEl.classList.add('hidden');
  feedbackEl.textContent = '';
  nextBtn.textContent = 'Submit Answer';
  nextBtn.disabled = false;
  currentIndex += 1;

  const question = questions[currentIndex - 1];
  progressEl.textContent = `Question ${currentIndex} of ${questionCount} • Grade ${currentGrade}`;
  renderSentence(question);
  renderChoices(question);
  nextBtn.classList.remove('hidden');
  restartBtn.classList.add('hidden');
  resultEl.classList.add('hidden');
}

function showFeedback(isCorrect) {
  feedbackEl.classList.remove('hidden');
  const correctWord = questions[currentIndex - 1].answer;
  if (isCorrect) {
    feedbackEl.textContent = 'Correct! Press Continue to move on.';
  } else {
    feedbackEl.textContent = `Not quite. The best word is "${correctWord}". Press Continue to move on.`;
  }
}

function showResult() {
  sentenceContainer.classList.add('hidden');
  choicesEl.classList.add('hidden');
  nextBtn.classList.add('hidden');
  feedbackEl.classList.add('hidden');
  progressEl.textContent = '';
  resultEl.classList.remove('hidden');
  restartBtn.classList.remove('hidden');

  const correctAnswers = questions.filter((q, index) => Number(q.choiceIndex) === q.answer).length;
  resultEl.innerHTML = `
    <h2>Quiz Complete</h2>
    <p>Score: ${correctAnswers} / ${questionCount}</p>
    <p>This activity used your selected grade level to show only current-level questions.</p>
  `;
}

function startQuiz() {
  currentGrade = Number(gradeSelectEl.value);
  const gradeQuestions = allQuestions.filter(q => Number(q.grade) === currentGrade);
  if (gradeQuestions.length === 0) {
    sentenceContainer.textContent = 'No questions available for this grade.';
    return;
  }
  questions = shuffle(gradeQuestions).slice(0, questionCount);
  currentIndex = 0;
  gradeSelectContainer.classList.add('hidden');
  sentenceContainer.classList.remove('hidden');
  choicesEl.classList.remove('hidden');
  showQuestion();
}

function resetQuiz() {
  currentIndex = 0;
  selectedChoice = null;
  answered = false;
  gradeSelectContainer.classList.remove('hidden');
  sentenceContainer.classList.remove('hidden');
  choicesEl.classList.remove('hidden');
  feedbackEl.classList.add('hidden');
  resultEl.classList.add('hidden');
  nextBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  progressEl.textContent = '';
  sentenceContainer.innerHTML = '';
  choicesEl.innerHTML = '';
}

startBtn.addEventListener('click', () => {
  if (!allQuestions.length) return;
  startQuiz();
});

nextBtn.addEventListener('click', () => {
  if (!answered) {
    if (selectedChoice === null) {
      alert('Drop or click a word into the blank before submitting.');
      return;
    }
    answered = true;
    const question = questions[currentIndex - 1];
    const isCorrect = selectedChoice === question.answer;
    question.choiceIndex = selectedChoice;
    showFeedback(isCorrect);
    nextBtn.textContent = currentIndex < questionCount ? 'Continue' : 'Finish';
    return;
  }

  if (currentIndex >= questionCount) {
    showResult();
  } else {
    showQuestion();
  }
});

restartBtn.addEventListener('click', () => {
  resetQuiz();
});

loadQuestions().catch(() => {
  sentenceContainer.textContent = 'Unable to load the experimental questions. Refresh and try again.';
});
