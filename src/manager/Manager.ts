import { Storage } from "../storage/Storage";
import { AIHandler } from "../utils/AIHandler";
import { SimpleEventEmitter } from "../utils/SimpleEventEmitter";

export enum ManagerStatus {
  idle = "idle",
  processing = "processing",
}

export type Bookmark = chrome.bookmarks.BookmarkTreeNode & { folder?: boolean };
export type Categories = { [key: string]: number[] };

export class Manager extends SimpleEventEmitter {
  public status: ManagerStatus = ManagerStatus.idle;

  private storage = new Storage();
  private aiHandler = new AIHandler();

  private bookmarks: Bookmark[] = [];
  private categories: Categories = {};

  constructor() {
    super();

    this.bindBookmarkListeners();
    void this.initialize();
  }

  getBookmarks(): Bookmark[] {
    return this.bookmarks;
  }

  async saveBookmarks() {
    await this.storage.set("bookmarks", JSON.stringify(this.bookmarks));
  }

  async handleBookmarks() {
    this.setStatus(ManagerStatus.processing);

    try {
      const categories = await this.aiHandler.handleBookmarks(this.bookmarks);
      await this.setCategories(categories);
    } finally {
      this.setStatus(ManagerStatus.idle);
    }
  }

  getCategories() {
    return this.categories;
  }

  private async initialize() {
    await Promise.all([this.loadBookmarks(), this.loadCategories()]);
  }

  private bindBookmarkListeners() {
    if (!chrome?.bookmarks) {
      return;
    }

    const refreshBookmarks = () => {
      void this.loadBookmarks();
    };

    chrome.bookmarks.onCreated.addListener(refreshBookmarks);
    chrome.bookmarks.onRemoved.addListener(refreshBookmarks);
    chrome.bookmarks.onChanged.addListener(refreshBookmarks);
    chrome.bookmarks.onMoved.addListener(refreshBookmarks);
    chrome.bookmarks.onChildrenReordered.addListener(refreshBookmarks);
    chrome.bookmarks.onImportEnded.addListener(refreshBookmarks);
  }

  private async loadBookmarks() {
    if (!chrome?.bookmarks) {
      return [];
    }

    const tree = await new Promise<Bookmark[]>((resolve) => {
      chrome.bookmarks.getTree((items) => {
        resolve(items as Bookmark[]);
      });
    });

    this.bookmarks = this.readBookmarks(tree, []);
    await this.saveBookmarks();
    this.emit("bookmarksUpdate", this.bookmarks);

    return this.bookmarks;
  }

  private async loadCategories() {
    const raw = await this.storage.get("categories");
    this.categories = this.parseCategories(raw);
    this.emit("categoriesUpdate", this.categories);
    return this.categories;
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

  private parseCategories(raw: string | null): Categories {
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw) as Categories;
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async setCategories(categories: Categories) {
    this.categories = categories;
    await this.storage.set("categories", JSON.stringify(categories));
    this.emit("categoriesUpdate", categories);
  }

  setStatus(status: ManagerStatus) {
    this.status = status;
    this.emit("statusUpdate", status);
  }
}

export const manager = new Manager();
