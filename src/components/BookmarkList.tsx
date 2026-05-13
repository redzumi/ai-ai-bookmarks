import type { Bookmark } from "../manager/Manager";

type Props = {
  bookmarks: Bookmark[];
};

const getHost = (url: string | undefined) => {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export function BookmarkList({ bookmarks }: Props) {
  if (bookmarks.length === 0) {
    return <div className="empty-state">No bookmarks in this folder.</div>;
  }

  return (
    <div className="bookmark-list">
      {bookmarks.map((bookmark) => {
        const host = getHost(bookmark.url);

        return (
          <label key={bookmark.id} className="bookmark-row">
            <input type="checkbox" className="checkbox checkbox-sm" />
            <div className="bookmark-row__meta">
              <a
                href={bookmark.url}
                className="bookmark-row__title"
                title={bookmark.title || "Untitled"}
              >
                {bookmark.title || "Untitled"}
              </a>
              <div className="bookmark-row__subline">
                {host && <span>{host}</span>}
                {bookmark.dateAdded && (
                  <span>{new Date(bookmark.dateAdded).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
