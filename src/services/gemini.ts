import { api } from "./api";

export const GEMINI_MODEL = "gemini-2.5-flash-lite";

export type GeminiHistoryTurn = {
  role: "user" | "model";
  text: string;
  image?: string;
};

export async function chatWithGemini(
  prompt: string,
  systemInstruction: string,
  history: GeminiHistoryTurn[] = [],
  images?: string[]
) {
  return api.chatWithGemini(prompt, systemInstruction, history, images);
}

export async function analyzeImageWithGemini(
  image: string,
  prompt: string = "Analyze this image and describe it in detail."
) {
  return api.analyzeImageWithGemini(image, prompt);
}
