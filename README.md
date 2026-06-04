# Reading Development Web Application

Welcome to the **Reading Development Web Application**! This repository contains a lightweight static web app for estimating elementary reading levels using simple, adaptive quiz interactions.

---

## Features

- Adaptive Reading Level Assessment: 10-question quiz that uses grade-level questions and adjusts feedback based on correct answers.
- Multiple Choice Quiz: Core question type served from `frontend/questions.csv`.
- Experimental Missing Word Activity: A separate page with drag-and-drop sentence completion questions loaded from `frontend/missing-word-questions.json`.
- Grade-specific content: The experimental page shows only questions for the student's selected grade.
- Recommendations: After completing the main quiz, the app loads recommended reading links from `frontend/recommendations.csv`.
- Simple static deployment: Works from `frontend/index.html` and can be hosted on Azure Static Web Apps or any static web host.

---

## New Experimental Page

The project now includes an experimental sentence completion activity at:

- `frontend/missing-word.html`

This experimental page:

- asks students to drag the best word into a sentence blank
- presents 3 options per question
- selects 3 random questions from the user’s current grade level
- is styled consistently with the main quiz

---

## How to Run

From the `frontend` folder, open `index.html` or `missing-word.html` in a browser. For local development, serve the `frontend` directory with a static file server.

---

## Architecture & Tech Stack

- **Frontend:** Static HTML, CSS, and JavaScript
- **Data:** CSV for main quiz questions and recommendations; JSON for the experimental missing-word questions
- **Deployment:** Static site hosting (Azure Static Web Apps or similar)

---

<details>
<summary>Current Project Structure</summary>

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

</details>
