import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ConfigService } from './configService';

interface AnalysisResult {
  coreSummary: string;
  features: string[];
  useCases: string[];
}

export class AiService {
  private static async getGeminiClient() {
    const apiKey = await ConfigService.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Gemini API Key is missing");
    return new GoogleGenerativeAI(apiKey);
  }

  static async analyzeRepo(repoData: any, readmeContent?: string | null): Promise<AnalysisResult> {
    const provider = await ConfigService.get('AI_PROVIDER');
    const language = 'Chinese';
    
    const systemPrompt = `You are a senior technical expert. Analyze the GitHub repository metadata and README content to provide a summary in ${language}. Return JSON only.`;
    const userPrompt = `
      Project: ${repoData.full_name}
      Description: ${repoData.description}
      Language: ${repoData.language}
      Topics: ${repoData.topics?.join(', ')}
      Readme Content: ${readmeContent ? readmeContent.substring(0, 50000) : 'Not available'}
      
      Required JSON Format:
      {
        "coreSummary": "A concise summary of the project based on the README content (under 200 words).",
        "features": ["Feature 1", "Feature 2", "Feature 3"],
        "useCases": ["Case 1", "Case 2", "Case 3"]
      }
    `;

    if (provider === 'gemini') {
      try {
        const genAI = await this.getGeminiClient();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: SchemaType.OBJECT,
                  properties: {
                    coreSummary: { type: SchemaType.STRING },
                    features: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    useCases: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                  },
                  required: ["coreSummary", "features", "useCases"]
                }
            }
        });
        
        const result = await model.generateContent(userPrompt);
        const text = result.response.text();
        return JSON.parse(text);
      } catch (e) {
        console.error("Gemini Analysis Failed:", e);
        return { coreSummary: "Analysis Failed", features: [], useCases: [] };
      }
    } else {
      // OpenAI Compatible
      return this.callOpenAICompatible(systemPrompt, userPrompt, true);
    }
  }

  static async analyzeContent(text: string): Promise<string> {
    const provider = await ConfigService.get('AI_PROVIDER');
    const language = 'Simplified Chinese (简体中文)';

    const systemPrompt = `You are a senior technical expert. Analyze the following project documentation content and provide a comprehensive summary STRICTLY in ${language}.
    Regardless of the source language, the output MUST be in ${language}.
    Focus on:
    1. Core Functionality: What does it do?
    2. Key Features: What are the main capabilities?
    3. Technical Highlights: Any interesting algorithms, patterns, or tech stack details?
    4. Use Cases: When should one use this?
    
    Output format: clearly structured Markdown.`;

    // Truncate if necessary (Gemini 1.5 Flash has 1M context, so usually fine)
    const userPrompt = text;

    if (provider === 'gemini') {
      try {
        const genAI = await this.getGeminiClient();
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
        });
        
        const result = await model.generateContent(userPrompt);
        return result.response.text();
      } catch (e) {
        console.error("Gemini Analysis Failed:", e);
        return "Analysis failed. Please try again later.";
      }
    } else {
      // OpenAI Compatible
      return this.callOpenAICompatible(systemPrompt, userPrompt, false);
    }
  }

  private static async callOpenAICompatible(system: string, user: string, jsonMode: boolean): Promise<any> {
    const baseUrl = await ConfigService.get('OPENAI_BASE_URL');
    const apiKey = await ConfigService.get('OPENAI_API_KEY');
    const model = await ConfigService.get('OPENAI_MODEL');

    const payload: any = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.7
    };

    if (jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    try {
      const axiosConfig = await this.getAxiosConfig(baseUrl);
      const res = await axios.post(`${baseUrl}/chat/completions`, payload, {
        ...axiosConfig,
        headers: {
          ...axiosConfig.headers,
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });
      const content = res.data.choices[0].message.content;
      return jsonMode ? JSON.parse(content) : content;
    } catch (e) {
      console.error("OpenAI Compatible Call Failed:", e);
      return jsonMode ? { coreSummary: "Error", features: [], useCases: [] } : "";
    }
  }

  private static async getAxiosConfig(url: string) {
    const proxyUrl = await ConfigService.get('PROXY_URL');
    const config: any = { headers: {} };
    
    // Simple heuristic: Skip proxy for .cn domains (likely domestic)
    // and localhost/127.0.0.1
    const isDomestic = url.includes('.cn') || url.includes('localhost') || url.includes('127.0.0.1');
    
    if (proxyUrl && !isDomestic) {
      config.httpsAgent = new HttpsProxyAgent(proxyUrl);
      config.proxy = false;
    }
    return config;
  }

  static async testConnection(config: {
    provider: string;
    geminiKey?: string;
    openaiBaseUrl?: string;
    openaiKey?: string;
    openaiModel?: string;
  }): Promise<{ success: boolean; message: string; duration?: number }> {
    const start = Date.now();
    try {
      if (config.provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(config.geminiKey || '');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("Hello");
        const duration = Date.now() - start;
        return { success: true, message: "Gemini connection successful", duration };
      } else {
        const baseUrl = config.openaiBaseUrl || '';
        const axiosConfig = await this.getAxiosConfig(baseUrl);
        
        const payload = {
          model: config.openaiModel,
          messages: [{ role: "user", content: "Hello" }]
        };
        await axios.post(`${baseUrl}/chat/completions`, payload, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.openaiKey}`
          }
        });
        const duration = Date.now() - start;
        return { success: true, message: "OpenAI Compatible connection successful", duration };
      }
    } catch (e: any) {
      const duration = Date.now() - start;
      const msg = e.response?.data?.error?.message || e.message || "Connection failed";
      return { success: false, message: msg, duration };
    }
  }
}
