import React from "react";

interface QuestionCardProps {
  question: string;
  choices: string[];
  selected: number | null;
  onSelect: (index: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  choices,
  selected,
  onSelect,
}) => {
  return (
    <div>
      <p style={{ fontWeight: "bold" }}>{question}</p>
      <div>
        {choices.map((choice, index) => (
          <div
            key={index}
            className={`choice ${selected === index ? "selected" : ""}`}
            onClick={() => onSelect(index)}
          >
            {choice}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
