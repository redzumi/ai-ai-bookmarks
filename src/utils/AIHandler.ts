import { Bookmark } from "../manager/Manager";

const MAX_CONTEXT_TOKENS = 8000;

const toDocument = (bookmarks: Bookmark[]) =>
  bookmarks.reduce((acc, curr) => acc + curr.title, "");

export class AIHandler {
  constructor() {}

  handleBookmarks(bookmarks: Bookmark[]) {
    const chunks = this.getContextChunks(bookmarks);
    console.log("Got chunks", chunks);

    const contexts = chunks.map((chunk) =>
      chunk.map((b) => `${b.id}: ${b.title}`).join("\n")
    );

    console.log("Got contexts", contexts);

    
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
