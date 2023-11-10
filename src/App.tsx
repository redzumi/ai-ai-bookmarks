import { useEffect, useState } from "react";
import { Bookmark, Categories, manager } from "./manager/Manager";

import "./App.css";

// TODO: Manager status
function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<Categories | null>(null);

  useEffect(() => {
    setBookmarks(manager.getBookmarks());
  }, []);

  useEffect(() => {
    setCategories(manager.getCategories());
  }, []);

  return (
    <div>
      {Object.entries(categories || {}).map(([key, value]) => (
        <div>
          <b>{key}</b>
          <div>
            {bookmarks
              ?.filter((bookmark) => value?.includes(parseInt(bookmark?.id)))
              .map((bookmark) => (
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
      ))}
      <button onClick={() => manager.handleBookmarks()}>
        Handle bookmarks
      </button>
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
