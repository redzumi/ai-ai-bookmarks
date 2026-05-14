import { Storage } from "../storage/Storage";
import {
  DEFAULT_OPENAI_SETTINGS,
  sanitizeOpenAISettings,
  OPENAI_SETTINGS_KEY,
  type OpenAISettings,
} from "../settings/openai";

type OpenAIChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAIClient {
  private storage = new Storage();

  async getSettings(): Promise<OpenAISettings> {
    const settings = await this.storage.getJSON(
      OPENAI_SETTINGS_KEY,
      DEFAULT_OPENAI_SETTINGS
    );

    return sanitizeOpenAISettings(settings);
  }

  async saveSettings(settings: OpenAISettings) {
    await this.storage.setJSON(OPENAI_SETTINGS_KEY, sanitizeOpenAISettings(settings));
  }

  async sendRequest(prompt: string): Promise<OpenAIChatCompletionsResponse> {
    const settings = await this.getSettings();

    if (!settings.token.trim()) {
      throw new Error("OpenAI token is not configured");
    }

    const baseUrl = settings.baseUrl.replace(/\/$/, "");

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.token.trim()}`,
      },
      body: JSON.stringify({
        model: settings.model.trim() || DEFAULT_OPENAI_SETTINGS.model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Ты менеджер закладок в браузере",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    return (await response.json()) as OpenAIChatCompletionsResponse;
  }
}

export const openAIClient = new OpenAIClient();
