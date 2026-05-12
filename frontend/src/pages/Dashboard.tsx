import React, { useEffect, useState } from "react";
import { fetchQuestions, Question } from "../api/quiz";

const Dashboard: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchQuestions();
      setQuestions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <p>Loading your data...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
      <h1>Your Dashboard</h1>
      <p>Here’s a summary of your progress:</p>

      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.text} (Level {q.level})
          </li>
        ))}
      </ul>

      <p>
        More analytics and progress tracking will be added here once backend
        integration is complete.
      </p>
    </div>
  );
};

export default Dashboard;
