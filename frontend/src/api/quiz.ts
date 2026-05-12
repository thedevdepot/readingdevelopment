import axios from "axios";

// Base URL for your Django backend
// Replace with your Azure App Service backend URL when ready
const API_BASE_URL = "https://your-django-backend.azurewebsites.net/api";

export interface Question {
  id: number;
  text: string;
  choices: string[];
  level: number;
}

// Fetch all questions (placeholder endpoint)
export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const response = await axios.get<Question[]>(`${API_BASE_URL}/questions/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    // fallback: return empty array or mock data
    return [];
  }
};

// Submit quiz answers (optional, for tracking user progress)
export interface QuizAnswer {
  questionId: number;
  selectedChoice: number;
}

export const submitAnswers = async (
  userId: string,
  answers: QuizAnswer[]
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/submit/`, {
      user_id: userId,
      answers,
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting answers:", error);
    return null;
  }
};
