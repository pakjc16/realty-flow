import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a marketing description for a property vacancy.
 */
export const generateListingDescription = async (
  propertyName: string,
  unitNumber: string,
  features: string[]
): Promise<string> => {
  if (!apiKey) return "API Key가 설정되지 않았습니다.";

  try {
    const prompt = `
      부동산 직거래 플랫폼에 올릴 매물 홍보글을 작성해줘.
      건물명: ${propertyName}
      호수: ${unitNumber}
      특징: ${features.join(', ')}
      
      말투는 정중하고 매력적으로, 이모지를 적절히 사용하여 가독성을 높여줘.
      핵심 요약과 상세 설명으로 나누어 작성해줘.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "설명을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 서비스 연결 중 오류가 발생했습니다.";
  }
};

/**
 * Answers legal or administrative questions regarding real estate.
 */
export const askRealEstateAdvisor = async (question: string): Promise<string> => {
  if (!apiKey) return "API Key가 설정되지 않았습니다.";

  try {
    const prompt = `
      당신은 한국 부동산 법률 및 임대차 관리 전문가입니다.
      사용자의 질문에 대해 정확하고 실질적인 조언을 제공하세요.
      주택임대차보호법 및 상가임대차보호법에 근거하여 답변하되, 
      법적 책임이 없음을 끝에 명시하세요.

      질문: ${question}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "답변을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 서비스 연결 중 오류가 발생했습니다.";
  }
};