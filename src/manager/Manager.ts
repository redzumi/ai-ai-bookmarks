import EventEmitter from "eventemitter3";
import { Storage } from "../storage/Storage";
import { AIHandler } from "../utils/AIHandler";
import { ProxyAPI } from "../utils/ProxyAPI";

export enum ManagerStatus {
  idle = "idle",
  processing = "processing",
}

export type Bookmark = chrome.bookmarks.BookmarkTreeNode & { folder?: boolean };
export type Categories = { [key: string]: number[] };

export class Manager extends EventEmitter {
  public status: ManagerStatus = ManagerStatus.idle;

  private storage = new Storage();
  private aiHandler = new AIHandler();

  private bookmarks: Bookmark[] = [];

  constructor() {
    super();

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
    this.setStatus(ManagerStatus.processing);
    const categories = await this.aiHandler.handleBookmarks(this.bookmarks);

    this.setCategories(categories);
    this.setStatus(ManagerStatus.idle);
  }

  getCategories() {
    const raw = this.storage.get("categories");
    return JSON.parse(raw === null ? "{}" : raw);
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

  setCategories(categories: Categories) {
    this.storage.set("categories", JSON.stringify(categories));
    this.emit("categoriesUpdate", categories);
  }

  setStatus(status: ManagerStatus) {
    this.status = status;
    this.emit("statusUpdate", status);
  }

  eventNames(): (string | symbol)[] {
    return ["statusUpdate"];
  }
}

export const manager = new Manager();
