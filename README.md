
# LaunchPad Reading Application

LaunchPad Reading Application - Formativley find reading level to keep readers in the proximal learning zone & foster a love for reading.

An adaptive reading assessment application designed to help educators better understand student reading comprehension through engaging, interactive activities.

**Live demo:** [https://happy-meadow-0c1a27010.7.azurestaticapps.net/](https://happy-meadow-0c1a27010.7.azurestaticapps.net/)

This project is part of the Azure Innovation Studio Agents League hackathon.

As a high school ELA teacher who works with special education students, I've seen how difficult it can be to gather meaningful assessment data when students are not genuinely engaged. This project is inspired by tools such as Pear Deck, Edpuzzle, Quizizz, Gimkit, and MagicSchool, with the goal of creating reading assessments that feel more interactive while providing actionable insights for teachers.

---

## Current Features

### Adaptive Reading Assessment

Students complete a reading assessment that adjusts feedback based on performance and estimates an appropriate reading level.

### Multiple Choice Questions

The current application uses grade-level multiple-choice reading comprehension questions loaded from a CSV file.

### Experimental Missing Word Activity

An experimental drag-and-drop sentence completion activity allows students to select the best word to complete a sentence.

Features include:

* Grade-level question filtering
* Randomized question selection
* Drag-and-drop interactions
* Consistent styling with the main assessment

### Reading Recommendations

After completing an assessment, students receive recommended reading resources aligned to their estimated reading level.

---

## Screenshot

![MVP Screenshot](./mvp.png)

---

## Vision

Reading comprehension is more than selecting the correct answer from a list of choices. Future versions of this project will incorporate additional assessment types that allow students to demonstrate understanding in multiple ways.

Planned question types include:

* Multiple choice
* Sentence completion
* Text annotation
* Vocabulary-in-context responses
* Written response evaluation
* Author's purpose and intent analysis
* Paragraph writing activities
* Visual comprehension and drawing activities

The goal is to create a richer picture of student comprehension while maintaining high levels of engagement.

---

## Future AI Integration

A future phase of this project will integrate Large Language Models (LLMs) through REST APIs to evaluate open-ended student responses.

Potential use cases include:

* Evaluating text annotations
* Scoring written responses
* Providing feedback on vocabulary usage in context
* Assessing short paragraph responses
* Analyzing student-generated visual descriptions and drawings
* Generating personalized feedback and instructional recommendations

The focus will be on using AI to support educators, not replace teacher judgment.

---

## Technology Stack

### Current Implementation

* HTML
* CSS
* JavaScript
* CSV-based question and recommendation data
* CSV-based activity content
* Azure Static Web Apps

![App Architecture](./appArchitecture.png)

### Future Exploration

* LLM-powered response evaluation
* Agentic API workflows
* Learning analytics and engagement insights
* Expanded adaptive assessment models

---

## Project Structure

```text
.
├── frontend
│   ├── index.html
│   ├── missing-word.html
│   ├── script.js
│   ├── missing-word.js
│   ├── styles.css
│   ├── questions.csv
│   ├── missing-word-questions.json
│   ├── recommendations.csv
│   └── staticwebapp.config.json
├── package.json
├── README.md
└── staticwebapp.config.json
```

---

## Project Status

This project is currently an active prototype focused on reading assessment and student engagement. New activity types, AI-assisted evaluation, and additional adaptive learning features are planned for future development.

## Planned Assessment Types

The long-term vision for this project is to measure reading comprehension through multiple modalities rather than relying exclusively on multiple-choice questions. Each assessment will eventually contain a mix of question types that measure different aspects of reading comprehension, inference, vocabulary, evidence gathering, visualization, and written response.

### Phase 1: Structured Question Types (No AI Required)

These activities can be evaluated with traditional scoring methods and are prioritized because they are easier to implement and provide valuable reading-level data.

| Priority | Question Type                    | Coding Difficulty | Storage Format | Reading Skills Measured           | Reading-Level Value | Engagement |
| -------- | -------------------------------- | ----------------- | -------------- | --------------------------------- | ------------------- | ---------- |
| 1        | Multiple Choice                  | Very Easy         | CSV            | Literal comprehension, inference  | Medium              | Medium     |
| 2        | Vocabulary in Context            | Easy              | CSV            | Vocabulary knowledge              | Very High           | Medium     |
| 3        | Evidence Selection               | Easy              | CSV            | Text evidence usage               | High                | Medium     |
| 4        | Character Emotion Identification | Easy              | CSV            | Inferencing, character analysis   | High                | High       |
| 5        | Image Selection                  | Medium            | JSON           | Visualization, comprehension      | High                | Very High  |
| 6        | Sequence Ordering                | Medium            | JSON           | Narrative structure, cause/effect | High                | High       |
| 7        | Cause and Effect Match           | Medium            | JSON           | Logical comprehension             | High                | High       |

### Phase 2: AI-Assisted Question Types

These activities require evaluation by an LLM or agentic workflow and provide deeper insights into student comprehension.

| Priority | Question Type               | Coding Difficulty | Storage Format | Reading Skills Measured                | Reading-Level Value | Engagement |
| -------- | --------------------------- | ----------------- | -------------- | -------------------------------------- | ------------------- | ---------- |
| 8        | Short Constructed Response  | Easy              | JSON           | Written comprehension, inference       | Very High           | Medium     |
| 9        | Annotation                  | Medium            | JSON           | Evidence identification, close reading | Very High           | High       |
| 10       | Summary Generation          | Easy              | JSON           | Main idea, synthesis                   | Extremely High      | Medium     |
| 11       | Text-to-Image Description   | Medium            | JSON           | Mental visualization                   | High                | Very High  |
| 12       | Conversation with Character | Medium            | JSON           | Perspective taking, comprehension      | High                | Very High  |

### Why Multiple Modalities?

Research and modern reading assessments suggest that reading comprehension is best measured through a combination of:

* Literal comprehension
* Vocabulary knowledge
* Inferencing
* Evidence gathering
* Main idea identification
* Narrative understanding
* Visualization
* Written explanation
* Metacognitive reasoning

Rather than relying on a single assessment format, this project aims to collect evidence across multiple modalities to generate a more accurate estimate of a student's reading level and provide targeted instructional recommendations.

> **James 1:5 (KJV)**
> "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him."
