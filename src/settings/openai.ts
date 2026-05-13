export type OpenAISettings = {
  baseUrl: string;
  model: string;
  token: string;
};

export const OPENAI_SETTINGS_KEY = "openai-settings";

export const DEFAULT_OPENAI_SETTINGS: OpenAISettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  token: "",
};
