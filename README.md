# Reading Development Web Application

Welcome to the **Reading Development Web Application**! This platform helps students track and improve their reading level through personalized strategies. Students can sign in, take adaptive assessments, receive feedback, and monitor their progress over time.

---

## Features

- **Reading Level Assessment:** 10-question adaptive assessment based on classic novel passages (grades 1–6).
- **Personalized Feedback:** Results highlighting strengths, growth areas, and next steps.
- **Progress Tracking:** Dashboard showing growth over time with reassessment options.
- **Mobile-Responsive UI:** Fully responsive for both mobile and desktop devices.
- **Current MVP:** JSON-backed storage for data (PostgreSQL planned for future).

---

## Screenshot

![MVP Running](./mvp_running.png)

---

## Adaptive Assessment Workflow

The application includes a **dynamic, adaptive question system**:

1. **Initial Assessment:** First 3 questions at estimated starting grade level.
2. **Performance-Based Adjustment:** Next 3 questions adjust difficulty based on student performance.
3. **Progressive Adaptation:** Subsequent questions continue adjusting up or down to fine-tune reading level.
4. **Final Scoring:** After 10 questions, the system calculates an estimated reading level.

**Supported Question Types (expandable):**

- Multiple Choice (MCQ)
- Fill-in-the-blank
- True/False
- Short Answer (AI scoring)
- Future: Matching, Drag & Drop, Audio/Video comprehension

---

## Architecture & Tech Stack

- **Frontend:** React + Vite (modular, mobile-friendly UI)  
- **Backend:** Python + Django API (currently JSON storage)  
- **Deployment:** Azure Static Web Apps (frontend)  
- **Database:** JSON for MVP; PostgreSQL planned for future integration  

**Planned AI Features:**

- Dynamic question generation  
- Open-ended answer evaluation  
- Hints and explanations  

---

<details>
<summary>Project Structure</summary>


.
├── frontend
│ ├── package.json
│ ├── public
│ │ └── index.html
│ ├── src
│ │ ├── api
│ │ │ └── quiz.ts
│ │ ├── app.tsx
│ │ ├── components
│ │ │ ├── ProgressBar.tsx
│ │ │ ├── QuestionCard.tsx
│ │ │ └── Quiz.tsx
│ │ ├── index.css
│ │ ├── main.tsx
│ │ └── pages
│ │ ├── Dashboard.tsx
│ │ └── Home.tsx
│ ├── tsconfig.json
│ └── vite.config.ts
├── old_frontend
│ ├── azure_hosted_old.png
│ ├── index.html
│ ├── script.js
│ └── styles.css
├── README.md
└── tree.txt


</details>

---

## Setup

### Prerequisites

- Node.js >= 18  
- npm  
- Git  

