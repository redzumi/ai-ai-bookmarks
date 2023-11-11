import uniq from "lodash.uniq";
import { AskTemplate } from "../constants";
import { Bookmark, Categories } from "../manager/Manager";
import { ProxyAPI } from "./ProxyAPI";
import PQueue from "p-queue";

const MAX_CONTEXT_TOKENS = 6000;

const toDocument = (bookmarks: Bookmark[]) =>
  bookmarks.reduce((acc, curr) => acc + curr.title, "");

export class AIHandler {

  private debug = false;

  private proxyApi = new ProxyAPI();
  private queue = new PQueue({ concurrency: 1 });

  async handleBookmarks(bookmarks: Bookmark[]) {
    const categories: Categories = {};

    const chunks = this.getContextChunks(bookmarks);
    this.log("Got chunks", chunks);

    const contexts = chunks.map((chunk) =>
      chunk.map((b) => `${b.id}: ${b.title}`).join("\n")
    );

    this.log("Got contexts", contexts);

    const responses = await Promise.all(
      contexts.map(
        async (context) =>
          await this.queue.add(async () => {
            this.log(Object.keys(categories));
            const response = await this.proxyApi.sendRequest(
              AskTemplate.replace("#context", context).replace(
                "#categories",
                JSON.stringify(Object.keys(categories))
              )
            );

            try {
              const content: { [key: string]: number[] } = JSON.parse(
                response?.choices[0]?.message?.content
              );

              Object.keys(content).forEach((key) => {
                categories[key] = uniq([
                  ...(categories[key] || []),
                  ...content[key],
                ]);
              });

              return content;
            } catch (error) {
              console.error(error);
            }
          })
      )
    );

    this.log(responses);
    this.log(categories);

    return categories;
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

  log(...args: unknown[]) {
    if (this.debug) console.log(...args);
  }
}
