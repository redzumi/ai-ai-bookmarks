import { ProxyAPI } from "../utils/ProxyAPI";

export type Bookmark = chrome.bookmarks.BookmarkTreeNode & { folder?: boolean };

export class Manager {
  constructor() {}

  getStorage() {
    // TODO: Replace by inner Storage class
    return new Storage();
  }

  getBookmarks(): Promise<Bookmark[]> {
    return new Promise((resolve) => {
      chrome?.bookmarks?.getTree((tree) => {
        const items = this.readBookmarks(tree, []);
        resolve(items);
      });
    });
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
