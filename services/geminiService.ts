
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Subject, QuizQuestion, LessonSummary } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function summarizePDFContent(text: string, subject: Subject): Promise<LessonSummary> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this ${subject} material. Extract academic essence with exam focus.
               Include: 1. Summary, 2. Real-world bridge, 3. Examiner Perspective, 4. Prerequisites.
               Content: ${text.substring(0, 15000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          keyTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedNextTopic: { type: Type.STRING },
          realWorldApplication: { type: Type.STRING },
          examinerInsights: { type: Type.STRING },
          prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["subject", "title", "summary", "difficulty", "keyTerms", "suggestedNextTopic", "realWorldApplication", "examinerInsights", "prerequisites"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateQuiz(summary: string, subject: Subject, previousFailures: string[] = []): Promise<QuizQuestion[]> {
  const ai = getAIClient();
  const prompt = `Generate 4 MCQs for ${subject}. 
                  Summary: "${summary}". 
                  Special Note: The student has previously struggled with: [${previousFailures.join(", ")}]. 
                  Ensure at least one question specifically targets these "failure signatures".
                  Assign difficultyTier (1-3) and a 'conceptTag'.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER },
            examinerTip: { type: Type.STRING },
            difficultyTier: { type: Type.NUMBER },
            conceptTag: { type: Type.STRING }
          },
          required: ["id", "question", "options", "correctAnswer", "examinerTip", "difficultyTier", "conceptTag"]
        }
      }
    }
  });
  return JSON.parse(response.text);
}

// Added generateWeaknessAutopsy to fix the missing export error in App.tsx
export async function generateWeaknessAutopsy(userAnswers: number[], questions: QuizQuestion[], subject: Subject): Promise<string[]> {
  const ai = getAIClient();
  const performanceData = questions.map((q, i) => ({
    question: q.question,
    concept: q.conceptTag,
    isCorrect: userAnswers[i] === q.correctAnswer,
    selectedOption: q.options[userAnswers[i]],
    correctOption: q.options[q.correctAnswer]
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze the student's performance in ${subject}.
               Performance Data: ${JSON.stringify(performanceData)}
               Identify the core cognitive weaknesses or conceptual gaps evidenced by the errors.
               Provide exactly 3 concise, academic diagnostic notes as an array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text);
}

export async function evaluateSelfExplanation(question: string, explanation: string): Promise<{ quality: number; feedback: string }> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The student answered a question: "${question}".
               They explained their reasoning as: "${explanation}".
               Evaluate the depth of conceptual understanding (quality 0-100) and provide 1 line of academic feedback.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quality: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["quality", "feedback"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function getCognitiveLoadStatus(errorCount: number, sessionDurationMinutes: number): Promise<{ action: 'continue' | 'slow' | 'stop'; message: string }> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Student has made ${errorCount} errors in ${sessionDurationMinutes} minutes.
               Provide a "Cognitive Load Governor" status. If overloading, recommend stopping.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          message: { type: Type.STRING }
        },
        required: ["action", "message"]
      }
    }
  });
  return JSON.parse(response.text);
}

export async function generateTTS(text: string, voiceName: 'Kore' | 'Puck' | 'Zephyr' = 'Kore'): Promise<string> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    }
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
}

export function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
