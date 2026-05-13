import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Bookmark, Categories, ManagerStatus, manager } from "./manager/Manager";
import {
  DEFAULT_OPENAI_SETTINGS,
  type OpenAISettings,
} from "./settings/openai";
import { openAIClient } from "./utils/OpenAIClient";
import fullLogo from "./assets/full-logo.svg";

import "./App.css";

type View = "bookmarks" | "settings";

function App() {
  const [status, setStatus] = useState(manager.status);
  const [view, setView] = useState<View>("bookmarks");
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(manager.getBookmarks());
  const [categories, setCategories] = useState<Categories>(manager.getCategories());
  const [settings, setSettings] = useState<OpenAISettings>(
    DEFAULT_OPENAI_SETTINGS
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = (nextStatus: ManagerStatus) => {
      setStatus(nextStatus);
    };
    const handleCategoriesUpdate = (nextCategories: Categories) => {
      setCategories(nextCategories);
    };
    const handleBookmarksUpdate = (nextBookmarks: Bookmark[]) => {
      setBookmarks(nextBookmarks);
    };

    manager.on("statusUpdate", handleStatusUpdate);
    manager.on("categoriesUpdate", handleCategoriesUpdate);
    manager.on("bookmarksUpdate", handleBookmarksUpdate);

    return () => {
      manager.off("statusUpdate", handleStatusUpdate);
      manager.off("categoriesUpdate", handleCategoriesUpdate);
      manager.off("bookmarksUpdate", handleBookmarksUpdate);
    };
  }, []);

  useEffect(() => {
    void openAIClient.getSettings().then(setSettings).catch(console.error);
  }, []);

  const logoSrc =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL(fullLogo)
      : fullLogo;

  const handledBookmarksCount = Object.values(categories).reduce(
    (total, category) => total + category.length,
    0
  );

  const nonFolderBookmarksCount = bookmarks.filter((b) => b.folder === false).length;

  const selectedBookmarks =
    currentName && categories[currentName]
      ? categories[currentName]
          .map((bookmarkId) =>
            bookmarks.find((bookmark) => bookmark.id === `${bookmarkId}`)
          )
          .filter((bookmark): bookmark is Bookmark => bookmark?.folder === false)
      : [];

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingSettings(true);
    setErrorMessage(null);

    try {
      const nextSettings = {
        baseUrl: settings.baseUrl.trim().replace(/\/$/, ""),
        model: settings.model.trim(),
        token: settings.token.trim(),
      };

      setSettings(nextSettings);
      await openAIClient.saveSettings(nextSettings);
    } catch (error) {
      console.error(error);
      setErrorMessage("Не удалось сохранить настройки");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const updateSetting = (key: keyof OpenAISettings) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  const runClassification = async () => {
    setErrorMessage(null);

    try {
      await manager.handleBookmarks();
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Не удалось обработать закладки"
      );
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
        <img src={logoSrc} className="logo" alt="AI AI Bookmarks logo" />

        <div className="flex flex-wrap justify-center gap-3">
          <button
            className={view === "bookmarks" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => {
              setView("bookmarks");
              setCurrentName(null);
            }}
          >
            Bookmarks
          </button>
          <button
            className={view === "settings" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setView("settings")}
          >
            Settings
          </button>
        </div>

        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

        {view === "settings" ? (
          <form className="settings-form" onSubmit={saveSettings}>
            <label className="form-control">
              <span className="label-text">OpenAI URL</span>
              <input
                type="url"
                className="input input-bordered"
                value={settings.baseUrl}
                onChange={updateSetting("baseUrl")}
                placeholder="https://api.openai.com/v1"
              />
            </label>

            <label className="form-control">
              <span className="label-text">Model</span>
              <input
                type="text"
                className="input input-bordered"
                value={settings.model}
                onChange={updateSetting("model")}
                placeholder="gpt-4o-mini"
              />
            </label>

            <label className="form-control">
              <span className="label-text">API token</span>
              <input
                type="password"
                className="input input-bordered"
                value={settings.token}
                onChange={updateSetting("token")}
                placeholder="sk-..."
              />
            </label>

            <div className="text-sm opacity-70">
              Settings are stored locally in the extension.
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => setSettings(DEFAULT_OPENAI_SETTINGS)}
              >
                Reset
              </button>
              <button className="btn btn-primary" type="submit" disabled={isSavingSettings}>
                {isSavingSettings ? "Saving..." : "Save settings"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {currentName ? (
              <button
                className="btn btn-outline btn-info"
                onClick={() => setCurrentName(null)}
              >
                Back to bookmarks
              </button>
            ) : (
              <button className="btn btn-neutral" onClick={runClassification}>
                Update bookmarks categories
              </button>
            )}

            <div className="divider">
              Bookmarks handled: {handledBookmarksCount}/{nonFolderBookmarksCount}
            </div>

            {currentName && (
              <div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <label>
                          <input type="checkbox" className="checkbox" />
                        </label>
                      </th>
                      <th>Name</th>
                      <th>Added At</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBookmarks.map((bookmark) => (
                      <tr key={bookmark.id}>
                        <th>
                          <label>
                            <input type="checkbox" className="checkbox" />
                          </label>
                        </th>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="avatar online placeholder">
                              <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                                <span className="text-xl">
                                  {(bookmark.title ?? "").slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <a
                                href={bookmark.url}
                                className="link link-secondary font-bold"
                              >
                                {bookmark.title}
                              </a>
                              <div className="text-sm opacity-50">
                                {bookmark.url && new URL(bookmark.url).hostname}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {bookmark.dateAdded && (
                            <div className="text-sm opacity-50">
                              {new Date(bookmark.dateAdded).toISOString()}
                            </div>
                          )}
                          <br />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              className="grid grid-cols-4 gap-8 gap-x-8"
              style={{ display: currentName ? "none" : "grid" }}
            >
              {Object.entries(categories).map(([key, value]) => (
                <div key={key} className="indicator">
                  <span className="indicator-item badge badge-primary">
                    {value.length}
                  </span>
                  <div className="grid place-items-center cursor-pointer">
                    <div
                      className="card bg-base-100 shadow-xl"
                      onClick={() => setCurrentName(key)}
                    >
                      <div className="card-body">
                        <h2 className="card-title">{key}</h2>
                        <p>With {value.length} bookmarks</p>
                        <div className="card-actions justify-end">
                          <button className="btn btn-primary">See</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
