import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const startQuiz = () => {
    navigate("/quiz"); // route to quiz page
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
      <h1>Welcome to the Reading Development Web App</h1>
      <p>
        Track your reading level, take quizzes, and improve your skills with
        personalized learning plans.
      </p>
      <button onClick={startQuiz}>Start Quiz</button>
    </div>
  );
};

export default Home;
