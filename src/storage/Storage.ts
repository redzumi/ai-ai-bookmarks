export class Storage {
  private hasChromeStorage() {
    return typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
  }

  async get(key: string): Promise<string | null> {
    if (this.hasChromeStorage()) {
      return await new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] ?? null);
        });
      });
    }

    return localStorage.getItem(key);
  }

  async set(key: string, value: string) {
    if (this.hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
      return;
    }

    localStorage.setItem(key, value);
  }

  async remove(key: string) {
    if (this.hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove([key], () => resolve());
      });
      return;
    }

    localStorage.removeItem(key);
  }

  async getJSON<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.get(key);

    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(error);
      return fallback;
    }
  }

  async setJSON<T>(key: string, value: T) {
    await this.set(key, JSON.stringify(value));
  }
}
