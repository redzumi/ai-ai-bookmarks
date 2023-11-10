import { useEffect, useState } from "react";
import { Bookmark, manager } from "./manager/Manager";

import "./App.css";

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(manager.getBookmarks());
  }, []);

  return (
    <>
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
    </>
  );
}

export default App;
