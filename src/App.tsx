import { useEffect, useState } from "react";
import { Bookmark, manager } from "./manager/Manager";

import "./App.css";

// TODO: Manager status
function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(manager.getBookmarks());
  }, []);

  return (
    <div>
      <button onClick={() => manager.handleBookmarks()}>
        Handle bookmarks
      </button>
      <div>
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
