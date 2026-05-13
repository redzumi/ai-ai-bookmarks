import { Storage } from "../storage/Storage";
import { AIHandler } from "../utils/AIHandler";
import { SimpleEventEmitter } from "../utils/SimpleEventEmitter";

export enum ManagerStatus {
  idle = "idle",
  processing = "processing",
}

export type Bookmark = Omit<chrome.bookmarks.BookmarkTreeNode, "children"> & {
  children?: Bookmark[];
  folder?: boolean;
};
export type Categories = { [key: string]: number[] };
export type CategoriesByFolder = Record<string, Categories>;

const CATEGORIES_STORAGE_KEY = "categories-by-folder";
const LEGACY_CATEGORIES_STORAGE_KEY = "categories";

export class Manager extends SimpleEventEmitter {
  public status: ManagerStatus = ManagerStatus.idle;

  private storage = new Storage();
  private aiHandler = new AIHandler();

  private bookmarkTree: Bookmark[] = [];
  private bookmarks: Bookmark[] = [];
  private categoriesByFolder: CategoriesByFolder = {};

  constructor() {
    super();

    this.bindBookmarkListeners();
    void this.initialize();
  }

  getBookmarks(): Bookmark[] {
    return this.bookmarks;
  }

  getBookmarkTree(): Bookmark[] {
    return this.bookmarkTree;
  }

  getRootFolders(): Bookmark[] {
    const root = this.bookmarkTree[0];
    const children = root?.children ?? this.bookmarkTree;

    return children.filter((item) => item.folder === true);
  }

  async saveBookmarks() {
    await this.storage.set("bookmarks", JSON.stringify(this.bookmarks));
  }

  async handleBookmarks(bookmarks: Bookmark[] = this.bookmarks, folderId = "all") {
    this.setStatus(ManagerStatus.processing);

    try {
      const categories = await this.aiHandler.handleBookmarks(bookmarks);
      await this.setCategories(folderId, categories);
    } finally {
      this.setStatus(ManagerStatus.idle);
    }
  }

  getCategories(folderId = "all") {
    return this.categoriesByFolder[folderId] ?? {};
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
        resolve(this.normalizeTree(items as Bookmark[]));
      });
    });

    this.bookmarkTree = tree;
    this.bookmarks = this.readBookmarks(tree, []);
    await this.saveBookmarks();
    this.emit("treeUpdate", this.bookmarkTree);
    this.emit("bookmarksUpdate", this.bookmarks);

    return this.bookmarks;
  }

  private async loadCategories() {
    let raw = await this.storage.getJSON<CategoriesByFolder | Categories>(
      CATEGORIES_STORAGE_KEY,
      {}
    );

    if (Object.keys(raw).length === 0) {
      const legacyRaw = await this.storage.getJSON<Categories>(
        LEGACY_CATEGORIES_STORAGE_KEY,
        {}
      );

      if (Object.keys(legacyRaw).length > 0) {
        raw = legacyRaw as Categories;
      }
    }

    this.categoriesByFolder = this.normalizeCategoriesByFolder(raw);
    this.emit("categoriesUpdate", this.categoriesByFolder);
    return this.categoriesByFolder;
  }

  private normalizeTree(tree: Bookmark[]): Bookmark[] {
    return tree.map((item) => {
      const children = item.children ? this.normalizeTree(item.children as Bookmark[]) : undefined;

      return {
        ...item,
        folder: item.children !== undefined,
        children,
      };
    });
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

  private normalizeCategoriesByFolder(
    raw: CategoriesByFolder | Categories
  ): CategoriesByFolder {
    const values = Object.values(raw);

    if (values.length === 0) {
      return {};
    }

    const looksLikeLegacyCategories = values.every((value) => Array.isArray(value));

    if (looksLikeLegacyCategories) {
      return { all: raw as Categories };
    }

    return raw as CategoriesByFolder;
  }

  async setCategories(folderId: string, categories: Categories) {
    this.categoriesByFolder = {
      ...this.categoriesByFolder,
      [folderId]: categories,
    };
    await this.storage.setJSON(CATEGORIES_STORAGE_KEY, this.categoriesByFolder);
    this.emit("categoriesUpdate", this.categoriesByFolder);
  }

  setStatus(status: ManagerStatus) {
    this.status = status;
    this.emit("statusUpdate", status);
  }
}

export const manager = new Manager();
