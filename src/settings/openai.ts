export type OpenAISettings = {
  baseUrl: string;
  model: string;
  token: string;
};

export const OPENAI_SETTINGS_KEY = "openai-settings";

export type OpenAIEndpointOption = {
  label: string;
  baseUrl: string;
  description: string;
};

export const OPENAI_ENDPOINT_OPTIONS: OpenAIEndpointOption[] = [
  {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    description: "Official OpenAI endpoint.",
  },
  {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    description: "Multi-model router with an OpenAI-compatible API.",
  },
  {
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    description: "Fast inference for supported OpenAI-style models.",
  },
  {
    label: "ProxyAPI",
    baseUrl: "https://api.proxyapi.ru/openai/v1",
    description: "ProxyAPI's OpenAI-compatible `/chat/completions` endpoint.",
  },
  {
    label: "ProxyAPI OpenRouter",
    baseUrl: "https://api.proxyapi.ru/openrouter/v1",
    description: "ProxyAPI's OpenRouter-compatible endpoint.",
  },
];

export const DEFAULT_OPENAI_SETTINGS: OpenAISettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  token: "",
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/$/, "");

export const sanitizeOpenAISettings = (
  settings: OpenAISettings
): OpenAISettings => {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const supportedBaseUrl =
    OPENAI_ENDPOINT_OPTIONS.find((option) => option.baseUrl === baseUrl)?.baseUrl ??
    DEFAULT_OPENAI_SETTINGS.baseUrl;

  return {
    baseUrl: supportedBaseUrl,
    model: settings.model.trim() || DEFAULT_OPENAI_SETTINGS.model,
    token: settings.token.trim(),
  };
};
