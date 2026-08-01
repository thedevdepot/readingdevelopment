const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

function readJson(relativePath) {
  const filePath = path.join(frontendDir, relativePath);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function normalizeStoryTheme(story) {
  return (story.theme || 'fiction').toLowerCase();
}

function getOptionsForInteraction(interaction, pathKey) {
  if (interaction.optionsByPath) {
    return interaction.optionsByPath[pathKey] || interaction.optionsByPath.default || [];
  }

  return interaction.options || [];
}

function getCorrectAnswerForInteraction(interaction, pathKey) {
  if (!interaction.correctByPath) {
    return null;
  }

  return interaction.correctByPath[pathKey] || interaction.correctByPath.default || null;
}

function getPromptForInteraction(interaction, pathKey) {
  if (interaction.promptByPath) {
    return interaction.promptByPath[pathKey] || interaction.promptByPath.default || interaction.prompt || '';
  }

  return interaction.prompt || '';
}

function validateCheckInteraction(story, stepNumber, pathKey) {
  const interaction = story.interactions[`step${stepNumber}`];
  const options = getOptionsForInteraction(interaction, pathKey);
  const correctAnswer = getCorrectAnswerForInteraction(interaction, pathKey);

  assert(getPromptForInteraction(interaction, pathKey), `${story.id} step${stepNumber} is missing prompt text for ${pathKey}`);
  assert(Array.isArray(options) && options.length >= 2, `${story.id} step${stepNumber} must provide at least two options for ${pathKey}`);
  assert(correctAnswer, `${story.id} step${stepNumber} is missing a correct answer for ${pathKey}`);
  assert(options.some(option => option.id === correctAnswer), `${story.id} step${stepNumber} correct answer ${correctAnswer} is not present in options for ${pathKey}`);
}

function validateChoiceInteraction(story, stepNumber, pathKey) {
  const interaction = story.interactions[`step${stepNumber}`];
  const options = getOptionsForInteraction(interaction, pathKey);

  assert(getPromptForInteraction(interaction, pathKey), `${story.id} step${stepNumber} is missing prompt text for ${pathKey}`);
  assert(Array.isArray(options) && options.length >= 2, `${story.id} step${stepNumber} must provide at least two options for ${pathKey}`);
  options.forEach(option => {
    assert(option.id, `${story.id} step${stepNumber} has an option without an id for ${pathKey}`);
    assert(option.text, `${story.id} step${stepNumber} option ${option.id} is missing text for ${pathKey}`);
  });

  return options;
}

function validateStory(story, grade) {
  assert(story && typeof story === 'object', `Grade ${grade} contains an invalid story entry`);
  assert(story.id, `Grade ${grade} story is missing id`);
  assert(story.title, `${story.id} is missing title`);
  assert(normalizeStoryTheme(story), `${story.id} is missing theme`);
  assert(story.paragraphs && typeof story.paragraphs === 'object', `${story.id} is missing paragraphs`);
  assert(story.interactions && typeof story.interactions === 'object', `${story.id} is missing interactions`);

  for (let stepNumber = 1; stepNumber <= 5; stepNumber += 1) {
    assert(story.paragraphs[`step${stepNumber}`], `${story.id} is missing paragraphs.step${stepNumber}`);
    assert(story.interactions[`step${stepNumber}`], `${story.id} is missing interactions.step${stepNumber}`);
  }

  const step1Options = validateChoiceInteraction(story, 1, 'default');
  const firstPathIds = step1Options.map(option => option.id);

  firstPathIds.forEach(firstPathId => {
    const step2Paragraph = story.paragraphs.step2[firstPathId];
    const step3Paragraph = story.paragraphs.step3[firstPathId];
    assert(step2Paragraph, `${story.id} is missing step2 paragraph for ${firstPathId}`);
    assert(step3Paragraph, `${story.id} is missing step3 paragraph for ${firstPathId}`);
    validateCheckInteraction(story, 2, firstPathId);

    const step3Options = validateChoiceInteraction(story, 3, firstPathId);
    step3Options.forEach(secondChoice => {
      const branchPathId = `${firstPathId}_${secondChoice.id}`;
      const step4Paragraph = story.paragraphs.step4[branchPathId];
      const step5Paragraph = story.paragraphs.step5[branchPathId];
      assert(step4Paragraph, `${story.id} is missing step4 paragraph for ${branchPathId}`);
      assert(step5Paragraph, `${story.id} is missing step5 paragraph for ${branchPathId}`);
      validateCheckInteraction(story, 4, branchPathId);
      validateCheckInteraction(story, 5, branchPathId);
    });
  });
}

function validateStoryDataSet(label, storyData) {
  assert(storyData && typeof storyData === 'object', `${label} did not parse into an object`);
  assert(storyData.grades && typeof storyData.grades === 'object', `${label} is missing grades`);

  for (let grade = 1; grade <= 6; grade += 1) {
    const stories = storyData.grades[String(grade)];
    assert(Array.isArray(stories) && stories.length > 0, `${label} is missing stories for grade ${grade}`);
    stories.forEach(story => validateStory(story, grade));
  }
}

function main() {
  const baseStories = readJson('story-data.json');
  const fableStories = readJson('fable-story-data.json');

  validateStoryDataSet('story-data.json', baseStories);
  validateStoryDataSet('fable-story-data.json', fableStories);

  console.log('Story content validation passed.');
}

main();