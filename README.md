# Reading Development Web Application

Welcome to the **Reading Development Web Application**! This platform helps students track and improve their reading level through personalized strategies. Students can sign in via Google, take adaptive assessments, receive feedback, and monitor their progress over time.

---

## Features

- **Google Authentication:** Seamless login using a Google account.
- **Reading Level Assessment:** 10-question adaptive assessment based on classic novel passages (grades 1–6).
- **Personalized Feedback:** AI-powered results highlighting strengths, growth areas, and next steps.
- **Weekly Learning Plan:** Automatically generated reading plans with books and milestones.
- **Progress Tracking:** Dashboard showing growth over time with reassessment options.
- **Mobile-Responsive UI:** Fully responsive for both mobile and desktop devices.

---

## Adaptive Assessment Workflow

The application includes a **dynamic, adaptive question system**:

1. **Initial Assessment:** First 3 questions at estimated starting grade level.
2. **Performance-Based Adjustment:** Next 3 questions adjust difficulty based on student performance.
3. **Progressive Adaptation:** Subsequent questions continue adjusting up or down to fine-tune reading level.
4. **Final Scoring:** After 10 questions, the system calculates an accurate reading level estimate.

**Supported Question Types (expandable):**

- Multiple Choice (MCQ)
- Fill-in-the-blank
- True/False
- Short Answer (AI scoring)
- Future: Matching, Drag & Drop, Audio/Video comprehension

---

## Architecture & Tech Stack

- **Frontend:** React + Vite (modular, mobile-friendly UI)
- **Backend:** Python + Django + Django REST Framework (adaptive logic, future AI integration)
- **Database:** PostgreSQL (Azure) storing questions, quizzes, answers, and progress
- **Hosting / Deployment:**  
  - Frontend: Azure Static Web Apps  
  - Backend: Azure App Service / Containers  
  - Database: Azure PostgreSQL  

**Planned AI Features:**

- Dynamic question generation  
- Open-ended answer evaluation  
- Hints and explanations  

---

## Deployment

**Primary:** [https://thedevdepotreadingapp.z19.web.core.windows.net/](https://thedevdepotreadingapp.z19.web.core.windows.net/)  

# My Azure Deployment

Here’s a screenshot of my storage setup:

![Azure Storage setup screenshot](https://github.com/thedevdepot/readingdevelopment/blob/main/azure_hosted.png)

### Azure Storage Setup

- Static website hosting enabled
- Files uploaded to `$web` container:
  - `index.html`
  - `styles.css`
  - `script.js`
- Cache control & versioning for smooth updates
- HTTPS enabled
- Optional: custom domain support

---

## Development Stages

### Stage 1: Static Quiz (Completed)
- HTML/CSS/JS quiz hosted on Azure Storage
- 10-question multiple-choice assessment
- Basic scoring and reading level estimation

### Stage 2: Adaptive Quiz Engine (In Progress)
- Randomized question selection
- Adaptive difficulty based on performance
- Multiple question types
- Backend API for scoring and difficulty adjustment

### Stage 3: Full Dynamic Platform (Planned)
- React + Vite frontend
- Django + REST API backend
- PostgreSQL for persistence
- AI-powered question generation & evaluation
- Personalized learning plan and progress dashboard
- Google Authentication

### Stage 4: AI Integration & Advanced Features
- Open-ended question scoring
- AI hints and explanations
- Audio/video comprehension questions
- Expanded analytics & reporting

---

## Getting Started

1. Clone the repository.
2. Set up the backend (Python 3.11+, Django, DRF, PostgreSQL).  
3. Set up the frontend (Node.js, Vite, React).  
4. Configure `.env` with database and Google OAuth credentials.
5. Run the development servers:

```bash
# Backend
python manage.py runserver

# Frontend
npm run dev
