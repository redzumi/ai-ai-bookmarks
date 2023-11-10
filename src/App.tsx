import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

type Bookmark = chrome.bookmarks.BookmarkTreeNode;

const readBookmarks = (tree: Bookmark[], items: Bookmark[]) => {
  tree.forEach((item) => {
    if (item.children) {
      readBookmarks(item.children, items);
    } else {
      items.push(item);
    }
  });

  return items;
};

function App() {
  const [count, setCount] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    chrome?.bookmarks?.getTree((tree) => {
      const items = readBookmarks(tree, []);
      setBookmarks(items);
    });
  }, []);

  return (
    <>
      <div>
        {bookmarks.map((bookmark) => (
          <div>{bookmark.title}</div>
        ))}
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
