import { AskTemplate } from "../constants";
import { Bookmark } from "../manager/Manager";
import { ProxyAPI } from "./ProxyAPI";

const MAX_CONTEXT_TOKENS = 6000;

const toDocument = (bookmarks: Bookmark[]) =>
  bookmarks.reduce((acc, curr) => acc + curr.title, "");

export class AIHandler {
  private proxyApi = new ProxyAPI();

  constructor() {}

  async handleBookmarks(bookmarks: Bookmark[]) {
    const chunks = this.getContextChunks(bookmarks);
    console.log("Got chunks", chunks);

    const contexts = chunks.map((chunk) =>
      chunk.map((b) => `${b.id}: ${b.title}`).join("\n")
    );

    console.log("Got contexts", contexts);

    const responses = await Promise.all(
      contexts.map((context) =>
        this.proxyApi.sendRequest(AskTemplate.replace("#context", context))
      )
    );

    console.log("Got responses", responses);

    const messages = responses.map((response) => response?.choices[0]?.message);

    try {
      const content = messages.map((m) => {
        console.log(m?.content);
        return JSON.parse(m?.content);
      });
      console.log("Got content", content);
    } catch (error) {
      console.error(error);
    }
  }

  getContextChunks(bookmarks: Bookmark[]) {
    const chunks = bookmarks.reduce((acc: Bookmark[][], curr) => {
      const chunk = acc[acc.length - 1] || [];

      if (toDocument(chunk).length + curr.title.length > MAX_CONTEXT_TOKENS) {
        acc.push([]);
        acc[acc.length - 1].push(curr);

        return acc;
      } else {
        chunk.push(curr);
        if (acc.length === 0) acc[0] = chunk;
        else acc[acc.length - 1] = chunk;

        return acc;
      }
    }, []);

    return chunks;
  }
}
