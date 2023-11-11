import { useEffect, useState } from "react";
import { Bookmark, Categories, manager } from "./manager/Manager";
import fullLogo from "./assets/full-logo.svg";

import "./App.css";

// TODO: Manager status
function App() {
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Categories | null>(null);

  useEffect(() => {
    setBookmarks(manager.getBookmarks());
  }, []);

  useEffect(() => {
    setCategories(manager.getCategories());
  }, []);

  const handleCategoryClick = (category: string) => {
    setCurrentName(category);
  };

  return (
    <div>
      <img src={chrome.runtime.getURL(fullLogo)} className="logo" alt="AI AI Bookmarks logo" />
      <button
        className="btn btn-neutral"
        onClick={() => manager.handleBookmarks()}
      >
        Update bookmarks categories
      </button>
      <div className="divider">Bookmarks</div>

      {categories !== null && currentName && (
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
              {categories[currentName]
                .map((bookmark) =>
                  bookmarks.find((b) => b.id === `${bookmark}`)
                )
                .filter((bookmark) => bookmark?.folder === false)
                .map((bookmark) => (
                  <tr>
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
                              {bookmark?.title.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <a
                            href={bookmark?.url}
                            className="link link-secondary font-bold"
                          >
                            {bookmark?.title}
                          </a>
                          <div className="text-sm opacity-50">
                            {bookmark?.url && new URL(bookmark?.url).hostname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {bookmark?.dateAdded && (
                        <div className="text-sm opacity-50">
                          {new Date(bookmark?.dateAdded).toISOString()}
                        </div>
                      )}
                      <br />
                    </td>
                    {/* <th>
                      <button className="btn btn-ghost btn-xs">details</button>
                    </th> */}
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
        {Object.entries(categories || {}).map(([key, value]) => (
          <div className="indicator">
            <span className="indicator-item badge badge-primary">
              {value.length}
            </span>
            <div className="grid place-items-center">
              <div
                className="card  bg-base-100 shadow-xl"
                onClick={() => handleCategoryClick(key)}
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
      <div style={{ display: "none" }}>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id}>
            {bookmark?.folder === true ? (
              <b>📁 {bookmark.title}</b>
            ) : (
              `${bookmark.title}`
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
