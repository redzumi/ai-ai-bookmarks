import { AskTemplate } from "../constants";
import { Bookmark, Categories } from "../manager/Manager";
import { openAIClient } from "./OpenAIClient";

const MAX_CONTEXT_CHARS = 6000;

const toDocument = (bookmarks: Bookmark[]) =>
  bookmarks.reduce((acc, curr) => acc + (curr.title ?? ""), "");

export class AIHandler {
  private debug = false;

  async handleBookmarks(bookmarks: Bookmark[]) {
    const categories: Categories = {};
    const bookmarksToProcess = bookmarks.filter((bookmark) => !bookmark.folder);

    const chunks = this.getContextChunks(bookmarksToProcess);
    this.log("Got chunks", chunks);

    const contexts = chunks.map((chunk) =>
      chunk.map((b) => `${b.id}: ${b.title}`).join("\n")
    );

    this.log("Got contexts", contexts);

    const responses = [];

    for (const context of contexts) {
      this.log(Object.keys(categories));

      const response = await openAIClient.sendRequest(
        AskTemplate.replace("#context", context).replace(
          "#categories",
          JSON.stringify(Object.keys(categories))
        )
      );

      try {
        const content: { [key: string]: number[] } = JSON.parse(
          response?.choices?.[0]?.message?.content ?? "{}"
        );

        Object.keys(content).forEach((key) => {
          categories[key] = Array.from(
            new Set([...(categories[key] || []), ...(content[key] || [])])
          );
        });

        responses.push(content);
      } catch (error) {
        console.error(error);
      }
    }

    this.log(responses);
    this.log(categories);

    return categories;
  }

  getContextChunks(bookmarks: Bookmark[]) {
    const chunks = bookmarks.reduce((acc: Bookmark[][], curr) => {
      const chunk = acc[acc.length - 1] || [];

      if (toDocument(chunk).length + (curr.title?.length ?? 0) > MAX_CONTEXT_CHARS) {
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
