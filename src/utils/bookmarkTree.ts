import type { Bookmark } from "../manager/Manager";

export const isFolder = (bookmark: Bookmark | null | undefined): bookmark is Bookmark =>
  Boolean(bookmark?.folder);

export const getRootFolders = (tree: Bookmark[]) => {
  const root = tree[0];
  const children = root?.children ?? tree;

  return children.filter(isFolder);
};

export const findNodeById = (tree: Bookmark[], targetId: string | null) => {
  if (!targetId) {
    return null;
  }

  const stack = [...tree];

  while (stack.length > 0) {
    const node = stack.shift();

    if (!node) {
      continue;
    }

    if (node.id === targetId) {
      return node;
    }

    if (node.children?.length) {
      stack.unshift(...(node.children as Bookmark[]));
    }
  }

  return null;
};

export const collectLeafBookmarks = (node: Bookmark | null | undefined): Bookmark[] => {
  if (!node) {
    return [];
  }

  if (!node.children?.length) {
    return node.folder ? [] : [node];
  }

  return node.children.flatMap((child) => collectLeafBookmarks(child as Bookmark));
};

export const getChildFolders = (node: Bookmark | null | undefined) => {
  if (!node?.children?.length) {
    return [];
  }

  return node.children.filter(isFolder);
};

export const getFolderPath = (
  tree: Bookmark[],
  targetId: string | null
): Bookmark[] => {
  if (!targetId) {
    return [];
  }

  const path: Bookmark[] = [];

  const walk = (nodes: Bookmark[], trail: Bookmark[]) => {
    for (const node of nodes) {
      const nextTrail = node.folder ? [...trail, node] : trail;

      if (node.id === targetId) {
        path.splice(0, path.length, ...nextTrail);
        return true;
      }

      if (node.children?.length && walk(node.children as Bookmark[], nextTrail)) {
        return true;
      }
    }

    return false;
  };

  walk(tree, []);
  return path;
};

export const countLeafBookmarks = (node: Bookmark | null | undefined): number => {
  if (!node) {
    return 0;
  }

  if (!node.children?.length) {
    return node.folder ? 0 : 1;
  }

  return node.children.reduce(
    (total, child) => total + countLeafBookmarks(child as Bookmark),
    0
  );
};
