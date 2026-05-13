import { useEffect, useMemo, useState } from "react";
import { manager, type Bookmark, type Categories } from "../manager/Manager";
import {
  collectLeafBookmarks,
  findNodeById,
  getChildFolders,
  getRootFolders,
} from "../utils/bookmarkTree";

export const useBookmarkWorkspace = () => {
  const [bookmarkTree, setBookmarkTree] = useState<Bookmark[]>(
    manager.getBookmarkTree()
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeSubfolderId, setActiveSubfolderId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Categories>({});

  const rootFolders = useMemo(() => getRootFolders(bookmarkTree), [bookmarkTree]);
  const activeRootFolder = useMemo(
    () => findNodeById(bookmarkTree, activeFolderId) ?? rootFolders[0] ?? null,
    [activeFolderId, bookmarkTree, rootFolders]
  );
  const activeNode = useMemo(
    () =>
      activeSubfolderId !== null
        ? findNodeById(bookmarkTree, activeSubfolderId) ?? activeRootFolder
        : activeRootFolder,
    [activeSubfolderId, activeRootFolder, bookmarkTree]
  );
  const currentFolderId = activeNode?.id ?? "all";
  const folderPathIds = useMemo(() => {
    const path: string[] = [];
    const walk = (nodes: Bookmark[], trail: string[]): boolean => {
      for (const node of nodes) {
        const nextTrail = node.folder ? [...trail, node.id] : trail;

        if (node.id === activeNode?.id) {
          path.splice(0, path.length, ...nextTrail);
          return true;
        }

        if (node.children?.length && walk(node.children as Bookmark[], nextTrail)) {
          return true;
        }
      }

      return false;
    };

    walk(bookmarkTree, []);
    return path;
  }, [bookmarkTree, activeNode?.id]);
  const childFolders = useMemo(() => getChildFolders(activeNode), [activeNode]);
  const currentBookmarks = useMemo(
    () => collectLeafBookmarks(activeNode),
    [activeNode]
  );

  useEffect(() => {
    const handleTreeUpdate = (nextTree: Bookmark[]) => {
      setBookmarkTree(nextTree);
    };

    manager.on("treeUpdate", handleTreeUpdate);

    return () => {
      manager.off("treeUpdate", handleTreeUpdate);
    };
  }, []);

  useEffect(() => {
    const handleCategoriesUpdate = () => {
      setCategories(manager.getCategories(currentFolderId));
    };

    manager.on("categoriesUpdate", handleCategoriesUpdate);
    handleCategoriesUpdate();

    return () => {
      manager.off("categoriesUpdate", handleCategoriesUpdate);
    };
  }, [currentFolderId]);

  useEffect(() => {
    if (!activeFolderId && rootFolders[0]) {
      setActiveFolderId(rootFolders[0].id);
    }
  }, [activeFolderId, rootFolders]);

  useEffect(() => {
    if (activeFolderId && !findNodeById(bookmarkTree, activeFolderId)) {
      setActiveFolderId(rootFolders[0]?.id ?? null);
      setActiveSubfolderId(null);
    }
  }, [activeFolderId, bookmarkTree, rootFolders]);

  useEffect(() => {
    if (activeSubfolderId && !findNodeById(bookmarkTree, activeSubfolderId)) {
      setActiveSubfolderId(null);
    }
  }, [activeSubfolderId, bookmarkTree]);

  const handleFolderChange = (folderId: string) => {
    setActiveFolderId(folderId);
    setActiveSubfolderId(null);
  };

  return {
    activeNode,
    activeFolderId,
    activeSubfolderId,
    bookmarkTree,
    categories,
    childFolders,
    currentBookmarks,
    currentFolderId,
    folderPathIds,
    handleFolderChange,
    rootFolders,
    setActiveSubfolderId,
  };
};
