const storyTitleEl = document.getElementById('storyTitle');
const storyMetaEl = document.getElementById('storyMeta');
const storyStepLabelEl = document.getElementById('storyStepLabel');
const storyParagraphEl = document.getElementById('storyParagraph');
const storyPromptEl = document.getElementById('storyPrompt');
const storyChoicesEl = document.getElementById('storyChoices');
const storyFeedbackEl = document.getElementById('storyFeedback');
const storyCompleteEl = document.getElementById('storyComplete');
const tryAnotherBtn = document.getElementById('tryAnotherBtn');
const themePickerEl = document.getElementById('themePicker');
const themeOptionsEl = document.getElementById('themeOptions');

const TOTAL_STEPS = 5;
const feedbackDelayMs = 500;

const THEME_LABELS = {
  fiction: 'Fiction',
  space: 'Space Adventure',
  adventure: 'Adventure Story'
};

let currentStory = null;
let currentStep = 1;
let currentPath = '';
let storiesForGrade = [];
let storiesForTheme = [];

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function getGradeFromUrl() {
  const params = getQueryParams();
  const gradeValue = Number(params.get('grade'));
  if (!Number.isInteger(gradeValue) || gradeValue < 1 || gradeValue > 6) {
    return 3;
  }
  return gradeValue;
}

function getThemeFromUrl() {
  const params = getQueryParams();
  const value = params.get('theme');
  if (!value) {
    return null;
  }
  return value.toLowerCase();
}

function setThemeInUrl(theme) {
  const grade = getGradeFromUrl();
  const target = `story-reader.html?grade=${grade}&theme=${encodeURIComponent(theme)}`;
  window.location.href = target;
}

function pickStory(storyList) {
  if (!Array.isArray(storyList) || storyList.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * storyList.length);
  return storyList[randomIndex];
}

function getPathKey() {
  return currentPath || 'default';
}

function getBranchValue(stepData) {
  if (typeof stepData === 'string') {
    return stepData;
  }

  if (!stepData || typeof stepData !== 'object') {
    return '';
  }

  const key = getPathKey();
  return stepData[key] || stepData.default || '';
}

function getInteractionForStep(stepNumber) {
  return currentStory.interactions[`step${stepNumber}`];
}

function getParagraphForStep(stepNumber) {
  const paragraphData = currentStory.paragraphs[`step${stepNumber}`];
  return getBranchValue(paragraphData);
}

function getPrompt(interaction) {
  if (interaction.promptByPath) {
    return interaction.promptByPath[getPathKey()] || interaction.promptByPath.default || interaction.prompt || 'Choose an answer.';
  }
  return interaction.prompt || 'Choose an answer.';
}

function getOptions(interaction) {
  if (interaction.optionsByPath) {
    return interaction.optionsByPath[getPathKey()] || interaction.optionsByPath.default || [];
  }
  return interaction.options || [];
}

function getCorrectAnswer(interaction) {
  if (!interaction.correctByPath) {
    return null;
  }
  return interaction.correctByPath[getPathKey()] || interaction.correctByPath.default || null;
}

function showFeedback(isCorrect) {
  storyFeedbackEl.textContent = isCorrect ? 'Correct' : 'Incorrect';
  storyFeedbackEl.className = `story-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
}

function clearFeedback() {
  storyFeedbackEl.textContent = '';
  storyFeedbackEl.className = 'story-feedback hidden';
}

function hideThemePicker() {
  themePickerEl.classList.add('hidden');
}

function showThemePicker(themes) {
  storyTitleEl.textContent = `Grade ${getGradeFromUrl()} Story Adventure`;
  storyMetaEl.textContent = 'Choose a theme to begin.';
  storyStepLabelEl.textContent = '';
  storyParagraphEl.textContent = '';
  storyPromptEl.textContent = '';
  storyChoicesEl.innerHTML = '';
  storyCompleteEl.classList.add('hidden');
  clearFeedback();

  themeOptionsEl.innerHTML = '';
  themes.forEach(theme => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'side-menu-button theme-option-btn';
    button.textContent = THEME_LABELS[theme] || theme;
    button.onclick = () => setThemeInUrl(theme);
    themeOptionsEl.appendChild(button);
  });

  themePickerEl.classList.remove('hidden');
}

function updateStoryStepUI() {
  hideThemePicker();
  clearFeedback();
  storyStepLabelEl.textContent = `Paragraph ${currentStep} of ${TOTAL_STEPS}`;
  storyParagraphEl.textContent = getParagraphForStep(currentStep);

  const interaction = getInteractionForStep(currentStep);
  const options = getOptions(interaction);
  storyPromptEl.textContent = getPrompt(interaction);
  storyChoicesEl.innerHTML = '';

  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'story-choice-btn';
    button.textContent = option.text;
    button.onclick = () => handleChoice(interaction, option.id);
    storyChoicesEl.appendChild(button);
  });

  storyParagraphEl.focus();
}

function advanceStep() {
  if (currentStep >= TOTAL_STEPS) {
    storyChoicesEl.innerHTML = '';
    storyPromptEl.textContent = 'You finished this story path.';
    storyCompleteEl.classList.remove('hidden');
    return;
  }

  currentStep += 1;
  updateStoryStepUI();
}

function handleChoice(interaction, optionId) {
  const choiceButtons = storyChoicesEl.querySelectorAll('button');
  choiceButtons.forEach(button => {
    button.disabled = true;
  });

  if (interaction.type === 'choice') {
    currentPath = currentPath ? `${currentPath}_${optionId}` : optionId;
    advanceStep();
    return;
  }

  const correctAnswer = getCorrectAnswer(interaction);
  const isCorrect = optionId === correctAnswer;
  showFeedback(isCorrect);

  window.setTimeout(() => {
    clearFeedback();
    advanceStep();
  }, feedbackDelayMs);
}

function startStory(story) {
  currentStory = story;
  currentStep = 1;
  currentPath = '';
  storyCompleteEl.classList.add('hidden');
  const themeLabel = THEME_LABELS[story.theme] || 'Story';
  storyTitleEl.textContent = story.title;
  storyMetaEl.textContent = `Grade ${getGradeFromUrl()} • ${themeLabel}`;
  updateStoryStepUI();
}

function setupTryAnotherStory() {
  tryAnotherBtn.addEventListener('click', () => {
    const nextStory = pickStory(storiesForTheme);
    if (!nextStory) {
      return;
    }
    startStory(nextStory);
  });
}

function initStoryPage(storyData) {
  const grade = getGradeFromUrl();
  storiesForGrade = storyData.grades[String(grade)] || [];

  if (storiesForGrade.length === 0) {
    storyTitleEl.textContent = 'Story Adventure';
    storyMetaEl.textContent = `No story data found for Grade ${grade}`;
    storyParagraphEl.textContent = 'Please return to Reading Resources and choose another grade level.';
    storyPromptEl.textContent = '';
    storyChoicesEl.innerHTML = '';
    return;
  }

  const themes = Array.from(new Set(storiesForGrade.map(story => (story.theme || 'fiction').toLowerCase())));
  const selectedTheme = getThemeFromUrl();

  if (!selectedTheme || !themes.includes(selectedTheme)) {
    showThemePicker(themes);
    return;
  }

  storiesForTheme = storiesForGrade.filter(story => ((story.theme || 'fiction').toLowerCase() === selectedTheme));

  if (storiesForTheme.length === 0) {
    showThemePicker(themes);
    return;
  }

  setupTryAnotherStory();
  startStory(pickStory(storiesForTheme));
}

fetch('story-data.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Unable to load story data.');
    }
    return response.json();
  })
  .then(data => initStoryPage(data))
  .catch(error => {
    storyTitleEl.textContent = 'Story Adventure';
    storyMetaEl.textContent = 'Data load error';
    storyParagraphEl.textContent = 'Unable to load stories right now. Please refresh the page.';
    storyPromptEl.textContent = '';
    storyChoicesEl.innerHTML = '';
    console.error(error);
  });
