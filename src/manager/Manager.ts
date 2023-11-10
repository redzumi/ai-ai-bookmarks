import { ProxyAPI } from "../utils/ProxyAPI";

export type Bookmark = chrome.bookmarks.BookmarkTreeNode;

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
      if (item.children) {
        this.readBookmarks(item.children, items);
      } else {
        items.push(item);
      }
    });

    return items;
  }
}

export const manager = new Manager();
