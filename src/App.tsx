import { useEffect, useState } from "react";
import { Bookmark, manager } from "./manager/Manager";

import "./App.css";

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    manager.getBookmarks().then((items) => {
      setBookmarks(items);
    });
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
