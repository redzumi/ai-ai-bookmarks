import type { Bookmark } from "../manager/Manager";
import { countLeafBookmarks } from "../utils/bookmarkTree";

type Props = {
  activeFolderId: string | null;
  activeSubfolderId: string | null;
  activePathIds: string[];
  isOpen: boolean;
  onImportClick: () => void;
  onFolderSelect: (folderId: string) => void;
  onSubfolderSelect: (folderId: string | null) => void;
  onClose: () => void;
  rootFolders: Bookmark[];
};

const folderLabel = (folder: Bookmark) => folder.title || "Untitled folder";

const FolderItem = ({
  folder,
  depth,
  activeFolderId,
  activeSubfolderId,
  activePathIds,
  onFolderSelect,
}: {
  folder: Bookmark;
  depth: number;
  activeFolderId: string | null;
  activeSubfolderId: string | null;
  activePathIds: string[];
  onFolderSelect: (folderId: string) => void;
}) => {
  const isCurrent = activeSubfolderId === folder.id || activeFolderId === folder.id;
  const isInPath = activePathIds.includes(folder.id);

  return (
    <button
      className={
        isCurrent
          ? "sidebar-folder sidebar-folder--active"
          : isInPath
            ? "sidebar-folder sidebar-folder--path"
            : "sidebar-folder"
      }
      style={{ paddingLeft: `${0.75 + depth * 0.8}rem` }}
      type="button"
      onClick={() => onFolderSelect(folder.id)}
    >
      <span className="sidebar-folder__title">{folderLabel(folder)}</span>
      <span className="sidebar-folder__count">{countLeafBookmarks(folder)}</span>
    </button>
  );
};

const FolderBranch = ({
  folders,
  depth,
  activeFolderId,
  activeSubfolderId,
  activePathIds,
  onFolderSelect,
}: {
  folders: Bookmark[];
  depth: number;
  activeFolderId: string | null;
  activeSubfolderId: string | null;
  activePathIds: string[];
  onFolderSelect: (folderId: string) => void;
}) => {
  return (
    <>
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={
            activePathIds.includes(folder.id)
              ? "sidebar-branch sidebar-branch--path"
              : "sidebar-branch"
          }
        >
          <FolderItem
            folder={folder}
            depth={depth}
            activeFolderId={activeFolderId}
            activeSubfolderId={activeSubfolderId}
            activePathIds={activePathIds}
            onFolderSelect={onFolderSelect}
          />
          {folder.children?.some((child) => child.folder) ? (
            <FolderBranch
              folders={folder.children.filter((child) => child.folder) as Bookmark[]}
              depth={depth + 1}
              activeFolderId={activeFolderId}
              activeSubfolderId={activeSubfolderId}
              activePathIds={activePathIds}
              onFolderSelect={onFolderSelect}
            />
          ) : null}
        </div>
      ))}
    </>
  );
};

export function FolderSidebar({
  activeFolderId,
  activeSubfolderId,
  activePathIds,
  isOpen,
  onImportClick,
  onFolderSelect,
  onSubfolderSelect,
  onClose,
  rootFolders,
}: Props) {
  return (
    <>
      <button
        className={
          isOpen
            ? "folder-sidebar-backdrop folder-sidebar-backdrop--open"
            : "folder-sidebar-backdrop"
        }
        type="button"
        aria-label="Close folders"
        onClick={onClose}
      />

      <aside className={isOpen ? "folder-sidebar folder-sidebar--open" : "folder-sidebar"}>
        <div className="folder-sidebar__header">
          <span>Folders</span>
          <div className="folder-sidebar__header-actions">
            <button
              className="folder-sidebar__import"
              type="button"
              onClick={onImportClick}
            >
              Import
            </button>
            <button
              className="folder-sidebar__all"
              type="button"
              onClick={() => onSubfolderSelect(null)}
            >
              All
            </button>
            <button
              className="folder-sidebar__close"
              type="button"
              aria-label="Close folders"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="folder-sidebar__content">
          <div className="folder-sidebar__list">
            <FolderBranch
              folders={rootFolders}
              depth={0}
              activeFolderId={activeFolderId}
              activeSubfolderId={activeSubfolderId}
              activePathIds={activePathIds}
              onFolderSelect={onFolderSelect}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
