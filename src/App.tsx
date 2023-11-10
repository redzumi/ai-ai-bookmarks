import { useEffect, useState } from "react";
import "./App.css";
import { Bookmark, manager } from "./manager/Manager";

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
          <div key={bookmark.id}>{bookmark.title}</div>
        ))}
      </div>
    </>
  );
}

export default App;
