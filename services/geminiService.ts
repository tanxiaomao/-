
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Season, Occasion, Outfit, WeatherData } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

export const getOutfitRecommendations = async (
  profile: UserProfile,
  season: Season,
  occasion: Occasion,
  weather?: WeatherData
): Promise<Outfit[]> => {
  const ai = getAI();
  const weatherContext = weather 
    ? `当前天气：${weather.city}，${weather.temp}度，${weather.condition}。` 
    : "";

  const prompt = `作为一个专业的职场女性穿搭博主，请根据以下信息推荐3套最适合“今日”的通勤穿搭：
    个人信息：年龄${profile.age}岁，身高${profile.height}cm，体重${profile.weight}kg，偏好风格：${profile.preferences.join(', ')}。
    环境信息：季节为${season}，场合为${occasion}。${weatherContext}
    
    请确保推荐考虑到当前的实时温度。
    返回JSON数组，每个对象包含：title, description, tags (数组), formula (穿搭公式), highlights (亮点列表, 数组)。
    注意：title要吸引人，description要有具体的搭配细节。`;

  try {
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
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              formula: { type: Type.STRING },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["title", "description", "tags", "formula", "highlights"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((item: any, index: number) => ({
      ...item,
      id: `ai-recom-${Date.now()}-${index}`,
      imageUrl: `https://picsum.photos/seed/${index + Date.now()}/600/800`,
      season,
      occasion
    }));
  } catch (error) {
    console.error("AI Recommendations failed:", error);
    // 网络失败时返回一组默认推荐，防止页面白屏
    return [{
      id: 'fallback-1',
      title: '极简主义职场风',
      description: '由于网络请求稍慢，为您展示经典款：修身西装外套搭配阔腿西装裤，内搭真丝衬衫。',
      imageUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=600',
      season: '春',
      occasion: '日常办公',
      tags: ['简约', '经典'],
      formula: '西装外套 + 真丝衬衫 + 阔腿裤',
      highlights: ['质感面料', '高级配色']
    }];
  }
};

export const analyzeOutfitImage = async (base64Image: string, profile: UserProfile): Promise<Partial<Outfit & { personalSuggestion: string }>> => {
  const ai = getAI();
  const prompt = `请分析这张穿搭图片。
    
    用户档案：
    - 年龄：${profile.age}岁
    - 身高：${profile.height}cm
    - 体重：${profile.weight}kg
    - 偏好风格：${profile.preferences.join('、')}
    
    任务：
    1. 提炼其风格亮点、配色方案和穿搭公式。
    2. **重点**：结合用户档案，给出个性化建议。评估这套穿搭是否适合用户，如果不完美，应该如何调整以更契合用户的身材和风格偏好。
    
    请以JSON格式返回。`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            formula: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            personalSuggestion: { type: Type.STRING }
          },
          required: ["title", "description", "formula", "highlights", "tags", "personalSuggestion"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw new Error("分析失败，请检查您的网络连接并重试。");
  }
};
