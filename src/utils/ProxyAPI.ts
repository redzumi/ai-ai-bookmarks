export class ProxyAPI {
  private baseUrl = "https://api.proxyapi.ru/openai/v1";
  private apiToken: string = import.meta.env.VITE_PROXYAPI_TOKEN;

  sendRequest(prompt: string) {
    return fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Ты менеджер закладок в браузере" },
          { role: "user", content: prompt },
        ],
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      });
  }
}
