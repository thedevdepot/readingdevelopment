export interface Question {
  id: number;
  text: string;
  choices: string[];
  level: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: "The cat sat on the mat. What is the cat doing?",
    choices: ["Running", "Sitting", "Flying", "Sleeping"],
    level: 1,
  },
  {
    id: 2,
    text: "He ran quickly to catch the bus. What does 'quickly' mean?",
    choices: ["Slowly", "Fast", "Carefully", "Sadly"],
    level: 2,
  },
  {
    id: 3,
    text: "The wind whispered through the trees. This is an example of?",
    choices: ["Metaphor", "Simile", "Personification", "Hyperbole"],
    level: 4,
  },
  {
    id: 4,
    text: "All animals are equal, but some are more equal than others. Meaning?",
    choices: ["Equality exists", "Contradiction/irony", "Animals are fair", "Confusion"],
    level: 6,
  },
];

export const fetchQuestions = async (): Promise<Question[]> => {
  return questions;
};

export interface QuizAnswer {
  questionId: number;
  selectedChoice: number;
}

export const submitAnswers = async (
  userId: string,
  answers: QuizAnswer[]
) => {
  return {
    success: true,
    userId,
    answers,
  };
};
