import { Storage } from "../storage/Storage";
import { AIHandler } from "../utils/AIHandler";
import { ProxyAPI } from "../utils/ProxyAPI";

export enum ManagerStatus {
  idle = "idle",
  processing = "processing",
}

export type Bookmark = chrome.bookmarks.BookmarkTreeNode & { folder?: boolean };
export type Categories = { [key: string]: number[] };

export class Manager {
  public status: ManagerStatus = ManagerStatus.idle;

  private storage = new Storage();
  private aiHandler = new AIHandler();

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

  async handleBookmarks() {
    this.status = ManagerStatus.processing;
    const categories = await this.aiHandler.handleBookmarks(this.bookmarks);
    this.storage.set("categories", JSON.stringify(categories));
    this.status = ManagerStatus.idle;
  }

  getCategories() {
    return JSON.parse(this.storage.get("categories") || "");
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
