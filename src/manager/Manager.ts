import { Storage } from "../storage/Storage";
import { ProxyAPI } from "../utils/ProxyAPI";

export type Bookmark = chrome.bookmarks.BookmarkTreeNode & { folder?: boolean };

export class Manager {
  private storage = new Storage();
  private bookmarks: Bookmark[] = [];

  constructor() {
    chrome?.bookmarks?.getTree((tree) => {
      const items = this.readBookmarks(tree, []);
      this.bookmarks = items;
      this.saveBookmarks();
    });
  }

  getBookmarks(): Bookmark[] {
    return this.bookmarks;
  }

  saveBookmarks() {
    this.storage.set("bookmarks", JSON.stringify(this.bookmarks));
  }

  getProxyAPI() {
    return new ProxyAPI();
  }

  readBookmarks(tree: Bookmark[], items: Bookmark[]) {
    tree.forEach((item) => {
      items.push({ ...item, folder: item.children !== undefined });

      if (item.children) {
        this.readBookmarks(item.children, items);
      }
    });

    return items;
  }
}

export const manager = new Manager();
