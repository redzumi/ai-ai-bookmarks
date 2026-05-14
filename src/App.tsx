import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { manager, ManagerStatus } from "./manager/Manager";
import {
  DEFAULT_OPENAI_SETTINGS,
  sanitizeOpenAISettings,
  type OpenAISettings,
} from "./settings/openai";
import { openAIClient } from "./utils/OpenAIClient";
import { useBookmarkWorkspace } from "./hooks/useBookmarkWorkspace";
import { FolderSidebar } from "./components/FolderSidebar";
import { BookmarkList } from "./components/BookmarkList";
import { SettingsPanel } from "./components/SettingsPanel";
import fullLogo from "./assets/full-logo.svg";

import "./App.css";

type View = "bookmarks" | "settings";

function App() {
  const [status, setStatus] = useState(manager.status);
  const [view, setView] = useState<View>("bookmarks");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<OpenAISettings>(
    DEFAULT_OPENAI_SETTINGS
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    activeNode,
    activeFolderId,
    activeSubfolderId,
    bookmarkIcons,
    categories,
    currentBookmarks,
    folderPathIds,
    handleFolderChange,
    rootFolders,
    setBookmarkIcon,
    setActiveSubfolderId,
  } = useBookmarkWorkspace();

  useEffect(() => {
    const handleStatusUpdate = (nextStatus: ManagerStatus) => {
      setStatus(nextStatus);
    };

    manager.on("statusUpdate", handleStatusUpdate);

    return () => {
      manager.off("statusUpdate", handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    void openAIClient.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handledBookmarksCount = Object.values(categories).reduce(
    (total, category) => total + category.length,
    0
  );

  const nonFolderBookmarksCount = currentBookmarks.length;

  const handleViewChange = (nextView: View) => {
    setView(nextView);
    if (nextView !== "bookmarks") {
      setIsSidebarOpen(false);
    }
  };

  const handleFolderSelect = (folderId: string) => {
    handleFolderChange(folderId);
    setIsSidebarOpen(false);
  };

  const handleSubfolderSelect = (folderId: string | null) => {
    setActiveSubfolderId(folderId);
    setIsSidebarOpen(false);
  };

  const exportCurrentFolder = async () => {
    if (!activeNode) {
      setErrorMessage("Нечего экспортировать");
      return;
    }

    try {
      const json = await manager.exportBookmarksAsJson(activeNode);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const fileName = `${(activeNode.title || "bookmarks")
        .toLowerCase()
        .replace(/[^a-z0-9а-яё._-]+/gi, "-")
        .replace(/^-+|-+$/g, "") || "bookmarks"}.json`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Не удалось экспортировать JSON"
      );
    }
  };

  const openImportPicker = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      await manager.importBookmarksFromJson(raw, activeNode?.id ?? undefined);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Не удалось импортировать JSON"
      );
    }
  };

  const updateSetting = (key: keyof OpenAISettings) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingSettings(true);
    setErrorMessage(null);

    try {
      const nextSettings = sanitizeOpenAISettings(settings);

      setSettings(nextSettings);
      await openAIClient.saveSettings(nextSettings);
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось сохранить настройки");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="app">
      {status === ManagerStatus.processing && (
        <progress className="app-progress progress w-56"></progress>
      )}
      <div
        className={
          status === ManagerStatus.processing
            ? "app app-blocked"
            : "app app-content"
        }
      >
        <img src={fullLogo} className="logo" alt="AI AI Bookmarks logo" />

        <div className="app-topbar">
          <div className="tabs tabs-boxed">
            <button
              type="button"
              className={view === "bookmarks" ? "tab tab-active" : "tab"}
              onClick={() => handleViewChange("bookmarks")}
            >
              Bookmarks
            </button>
            <button
              type="button"
              className={view === "settings" ? "tab tab-active" : "tab"}
              onClick={() => handleViewChange("settings")}
            >
              Settings
            </button>
          </div>

          <div className="app-topbar__actions">
            {view === "bookmarks" && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm workspace-sidebar-toggle"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  Folders
                </button>

                <span className="tooltip tooltip-bottom" data-tip="Скоро">
                  <button
                    type="button"
                    className="btn btn-neutral btn-sm app-ai-button"
                    disabled
                  >
                    Update with AI
                  </button>
                </span>
              </>
            )}
          </div>
        </div>

        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

        {view === "settings" ? (
          <SettingsPanel
            isSaving={isSavingSettings}
            onReset={() => setSettings(DEFAULT_OPENAI_SETTINGS)}
            onSave={saveSettings}
            settings={settings}
            onUpdate={updateSetting}
          />
        ) : (
          <div className="workspace">
            <FolderSidebar
              activeFolderId={activeFolderId}
              activeSubfolderId={activeSubfolderId}
              activePathIds={folderPathIds}
              isOpen={isSidebarOpen}
              onImportClick={openImportPicker}
              onClose={() => setIsSidebarOpen(false)}
              onFolderSelect={handleFolderSelect}
              onSubfolderSelect={handleSubfolderSelect}
              rootFolders={rootFolders}
            />

            <section className="workspace-main">
              <div className="workspace-actions">
                <div className="workspace-actions__meta">
                  <span className="workspace-actions__label">Current folder</span>
                  <span className="workspace-actions__value">
                    {activeNode?.title || "Bookmarks"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={exportCurrentFolder}
                  disabled={!activeNode}
                >
                  Export JSON
                </button>
              </div>

              <div className="stats-row">
                <div className="stat-pill">
                  <span className="stat-pill__label">Current</span>
                  <span className="stat-pill__value">
                    {activeNode?.title || "Bookmarks"}
                  </span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill__label">Items</span>
                  <span className="stat-pill__value">{nonFolderBookmarksCount}</span>
                </div>
                <div className="stat-pill">
                  <span className="stat-pill__label">AI done</span>
                  <span className="stat-pill__value">{handledBookmarksCount}</span>
                </div>
              </div>

              <BookmarkList
                bookmarks={currentBookmarks}
                bookmarkIcons={bookmarkIcons}
                onSetBookmarkIcon={setBookmarkIcon}
              />

              {Object.keys(categories).length > 0 && (
                <div className="categories-strip">
                  {Object.entries(categories).map(([key, value]) => (
                    <div key={key} className="category-chip">
                      <span>{key}</span>
                      <b>{value.length}</b>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
        <input
          ref={importInputRef}
          accept="application/json,.json"
          className="hidden"
          type="file"
          onChange={handleImportFile}
        />
      </div>
    </div>
  );
}

export default App;
