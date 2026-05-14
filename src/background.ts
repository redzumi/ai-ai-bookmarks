chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL("index.html");
  void chrome.tabs.create({ url, active: true });
});

type FetchFaviconMessage = {
  type: "FETCH_FAVICON";
  url: string;
};

type FetchFaviconResponse =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

const blobToDataUrl = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  return `data:${blob.type || "image/png"};base64,${arrayBufferToBase64(buffer)}`;
};

const fetchDataUrl = async (url: string) => {
  const response = await fetch(url, { credentials: "omit", redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return blobToDataUrl(await response.blob());
};

const extractIconCandidates = (html: string, pageUrl: string) => {
  const candidates = new Set<string>();
  const linkPattern =
    /<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];

    try {
      candidates.add(new URL(href, pageUrl).toString());
    } catch {
      continue;
    }
  }

  try {
    candidates.add(new URL("/favicon.ico", pageUrl).toString());
  } catch {
    // Ignore invalid bookmark URLs.
  }

  return [...candidates];
};

const resolveFavicon = async (pageUrl: string) => {
  const pageResponse = await fetch(pageUrl, {
    credentials: "omit",
    redirect: "follow",
  });

  if (pageResponse.ok) {
    const html = await pageResponse.text();
    const iconCandidates = extractIconCandidates(html, pageUrl);

    for (const iconUrl of iconCandidates) {
      try {
        return await fetchDataUrl(iconUrl);
      } catch {
        continue;
      }
    }
  }

  const fallbackFavicon = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
    pageUrl
  )}`;

  return fetchDataUrl(fallbackFavicon);
};

chrome.runtime.onMessage.addListener(
  (message: FetchFaviconMessage, _sender, sendResponse) => {
    if (message?.type !== "FETCH_FAVICON") {
      return false;
    }

    void (async () => {
      try {
        const dataUrl = await resolveFavicon(message.url);
        sendResponse({ ok: true, dataUrl } satisfies FetchFaviconResponse);
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Failed to fetch favicon",
        } satisfies FetchFaviconResponse);
      }
    })();

    return true;
  }
);
