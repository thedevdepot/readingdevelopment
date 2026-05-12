import { useState } from "react";

// Static quiz data for now
const questions = [
  {
    id: 1,
    text: "The cat sat on the mat. What is the cat doing?",
    choices: ["Running", "Sitting", "Flying", "Sleeping"],
    answer: 1,
    level: 1,
  },
  {
    id: 2,
    text: "He ran quickly to catch the bus. What does 'quickly' mean?",
    choices: ["Slowly", "Fast", "Carefully", "Sadly"],
    answer: 1,
    level: 2,
  },
  {
    id: 3,
    text: "The wind whispered through the trees. This is an example of?",
    choices: ["Metaphor", "Simile", "Personification", "Hyperbole"],
    answer: 2,
    level: 4,
  },
  {
    id: 4,
    text: "All animals are equal, but some are more equal than others. Meaning?",
    choices: ["Equality exists", "Contradiction/irony", "Animals are fair", "Confusion"],
    answer: 1,
    level: 6,
  },
];

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleChoiceClick = (index: number) => {
    setSelected(index);
  };

  const handleNext = () => {
    if (selected === null) {
      alert("Please select an answer!");
      return;
    }

    if (selected === questions[current].answer) {
      setScore(score + questions[current].level);
    }

    setSelected(null);

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    const grade = Math.round(score / questions.length);
    return (
      <div>
        <h2>Your estimated reading level: Grade {grade}</h2>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontWeight: "bold" }}>{questions[current].text}</p>
      <div>
        {questions[current].choices.map((choice, index) => (
          <div
            key={index}
            className={`choice ${selected === index ? "selected" : ""}`}
            onClick={() => handleChoiceClick(index)}
          >
            {choice}
          </div>
        ))}
      </div>
      <button onClick={handleNext}>Next</button>
    </div>
  );
}
