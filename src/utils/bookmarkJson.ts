import type { Bookmark } from "../manager/Manager";

export type BookmarkJsonNode = {
  title: string;
  url?: string;
  children?: BookmarkJsonNode[];
};

export type BookmarkJsonDocument = {
  exportedAt: string;
  root: BookmarkJsonNode | BookmarkJsonNode[];
  version: 1;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isBookmarkJsonNode = (value: unknown): value is BookmarkJsonNode => {
  if (!isObject(value) || typeof value.title !== "string") {
    return false;
  }

  if (value.url !== undefined && typeof value.url !== "string") {
    return false;
  }

  if (value.children !== undefined) {
    return Array.isArray(value.children) && value.children.every(isBookmarkJsonNode);
  }

  return true;
};

export const serializeBookmarkNode = (
  node: Bookmark
): BookmarkJsonNode | null => {
  if (!node.folder) {
    return {
      title: node.title || "Untitled bookmark",
      url: node.url ?? "",
    };
  }

  return {
    title: node.title || "Untitled folder",
    children: (node.children ?? [])
      .map((child) => serializeBookmarkNode(child as Bookmark))
      .filter((child): child is BookmarkJsonNode => child !== null),
  };
};

export const serializeBookmarkTree = (nodes: Bookmark[]) =>
  nodes
    .map((node) => serializeBookmarkNode(node))
    .filter((node): node is BookmarkJsonNode => node !== null);

export const normalizeBookmarkImport = (raw: unknown): BookmarkJsonNode[] => {
  if (Array.isArray(raw)) {
    return raw.filter(isBookmarkJsonNode);
  }

  if (isObject(raw)) {
    if ("root" in raw) {
      return normalizeBookmarkImport(raw.root);
    }

    if ("version" in raw && raw.version !== 1) {
      throw new Error("Unsupported JSON version");
    }

    if ("title" in raw || "url" in raw || "children" in raw) {
      if (!isBookmarkJsonNode(raw)) {
        throw new Error("Invalid bookmark JSON structure");
      }

      return [raw];
    }
  }

  throw new Error("Invalid bookmark JSON structure");
};
