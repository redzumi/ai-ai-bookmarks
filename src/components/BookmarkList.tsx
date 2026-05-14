import { useEffect, useRef, useState } from "react";
import type { Bookmark, BookmarkIcon, BookmarkIconsById } from "../manager/Manager";

type Props = {
  bookmarks: Bookmark[];
  bookmarkIcons: BookmarkIconsById;
  onSetBookmarkIcon: (bookmarkId: string, value: string | null) => Promise<void>;
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

const faviconDataUrlCache = new Map<string, string | null>();

const getInitial = (bookmark: Bookmark) => {
  const host = getHost(bookmark.url);

  if (host) {
    return host[0]?.toUpperCase() ?? "•";
  }

  return (bookmark.title || "•")[0]?.toUpperCase() ?? "•";
};

const getBookmarkIconLabel = (bookmark: Bookmark, icon?: BookmarkIcon) => {
  if (icon?.kind === "emoji") {
    return icon.value;
  }

  return getInitial(bookmark);
};

const fetchBookmarkFaviconDataUrl = async (url: string | undefined) => {
  if (!url) {
    return null;
  }

  const cached = faviconDataUrlCache.get(url);

  if (cached !== undefined) {
    return cached;
  }

  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    faviconDataUrlCache.set(url, null);
    return null;
  }

  const dataUrl = await new Promise<string | null>((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: "FETCH_FAVICON",
        url,
      },
      (response) => {
        const lastError = chrome.runtime?.lastError;

        if (lastError || !response?.ok) {
          resolve(null);
          return;
        }

        resolve(response.dataUrl ?? null);
      }
    );
  });

  faviconDataUrlCache.set(url, dataUrl);
  return dataUrl;
};

const useInView = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "120px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { isVisible, ref };
};

const BookmarkRow = ({
  bookmark,
  bookmarkIcon,
  onSetBookmarkIcon,
}: {
  bookmark: Bookmark;
  bookmarkIcon?: BookmarkIcon;
  onSetBookmarkIcon: (bookmarkId: string, value: string | null) => Promise<void>;
}) => {
  const host = getHost(bookmark.url);
  const { isVisible, ref } = useInView();
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const iconLabel = getBookmarkIconLabel(bookmark, bookmarkIcon);
  const isCustomImage = bookmarkIcon?.kind === "url";

  useEffect(() => {
    let cancelled = false;

    if (!isVisible || isCustomImage) {
      setFaviconUrl(null);
      return () => {
        cancelled = true;
      };
    }

    void fetchBookmarkFaviconDataUrl(bookmark.url).then((nextFaviconUrl) => {
      if (!cancelled) {
        setFaviconUrl(nextFaviconUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bookmark.url, isVisible, isCustomImage]);

  const handleIconClick = () => {
    const currentValue = bookmarkIcon?.value ?? "";
    const nextValue = window.prompt(
      "Enter an emoji or image URL for this bookmark",
      currentValue
    );

    if (nextValue === null) {
      return;
    }

    void onSetBookmarkIcon(bookmark.id, nextValue);
  };

  return (
    <div ref={ref} className="bookmark-row">
      <input type="checkbox" className="checkbox checkbox-sm" />
      <button
        type="button"
        className="bookmark-row__icon"
        title="Set custom icon"
        aria-label={`Set custom icon for ${bookmark.title || "Untitled"}`}
        onClick={handleIconClick}
      >
        <span className="bookmark-row__icon-fallback">{iconLabel}</span>
        {isCustomImage && isVisible ? (
          <img
            alt=""
            className="bookmark-row__icon-image"
            src={bookmarkIcon.value}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : faviconUrl ? (
          <img
            alt=""
            className="bookmark-row__icon-image"
            src={faviconUrl}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
      </button>
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
    </div>
  );
};

export function BookmarkList({
  bookmarks,
  bookmarkIcons,
  onSetBookmarkIcon,
}: Props) {
  if (bookmarks.length === 0) {
    return <div className="empty-state">No bookmarks in this folder.</div>;
  }

  return (
    <div className="bookmark-list">
      {bookmarks.map((bookmark) => {
        return (
          <BookmarkRow
            key={bookmark.id}
            bookmark={bookmark}
            bookmarkIcon={bookmarkIcons[bookmark.id]}
            onSetBookmarkIcon={onSetBookmarkIcon}
          />
        );
      })}
    </div>
  );
}
