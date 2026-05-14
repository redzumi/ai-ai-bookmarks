import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectRoot, "dist");
const outputDir = path.join(projectRoot, "docs", "assets");

const ensureBuild = () => {
  const manifestPath = path.join(distDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    execFileSync("npm", ["run", "build"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
  }
};

const findBrowserExecutable = () => {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.BROWSER_PATH,
    process.env.GOOGLE_CHROME_PATH,
    process.env.PLAYWRIGHT_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Brave Browser Beta.app/Contents/MacOS/Brave Browser Beta",
    "/Applications/Brave Browser Nightly.app/Contents/MacOS/Brave Browser Nightly",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (typeof candidate === "string" && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const makeBookmark = (title, url) => ({ title, url });

const makeDemoBookmarks = () => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  root: [
    {
      title: "Research",
      children: [
        {
          title: "OpenAI",
          children: [
            makeBookmark("Platform docs", "https://platform.openai.com/docs"),
            makeBookmark("API reference", "https://platform.openai.com/docs/api-reference"),
            makeBookmark("Prompting guide", "https://platform.openai.com/docs/guides/prompt-engineering"),
            makeBookmark("Pricing", "https://openai.com/pricing"),
          ],
        },
        {
          title: "Model hubs",
          children: [
            makeBookmark("OpenRouter models", "https://openrouter.ai/models"),
            makeBookmark("Groq console", "https://console.groq.com"),
            makeBookmark("ProxyAPI docs", "https://proxyapi.ru"),
            makeBookmark("Together AI", "https://www.together.ai"),
            makeBookmark("Fireworks AI", "https://fireworks.ai"),
          ],
        },
        {
          title: "Benchmarks",
          children: [
            makeBookmark("Hugging Face", "https://huggingface.co"),
            makeBookmark("LMSYS Chatbot Arena", "https://chat.lmsys.org"),
            makeBookmark("Papers with Code", "https://paperswithcode.com"),
          ],
        },
      ],
    },
    {
      title: "Product",
      children: [
        {
          title: "Extensions",
          children: [
            makeBookmark("Chromium Extensions", "https://developer.chrome.com/docs/extensions/"),
            makeBookmark(
              "Manifest V3 guide",
              "https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3"
            ),
            makeBookmark("Web Store publishing", "https://developer.chrome.com/docs/webstore/publish"),
          ],
        },
        {
          title: "Shipping",
          children: [
            makeBookmark("Roadmap", "https://linear.app"),
            makeBookmark("Release notes", "https://docs.google.com"),
            makeBookmark("Launch checklist", "https://notion.so"),
            makeBookmark("Support inbox", "https://gmail.com"),
          ],
        },
      ],
    },
    {
      title: "Design",
      children: [
        {
          title: "System",
          children: [
            makeBookmark("DaisyUI", "https://daisyui.com"),
            makeBookmark("Tailwind CSS", "https://tailwindcss.com"),
            makeBookmark("Radix UI", "https://www.radix-ui.com"),
            makeBookmark("Lucide", "https://lucide.dev"),
          ],
        },
        {
          title: "Inspiration",
          children: [
            makeBookmark("Awwwards", "https://www.awwwards.com"),
            makeBookmark("Mobbin", "https://mobbin.com"),
            makeBookmark("Godly", "https://godly.website"),
            makeBookmark("Land-book", "https://land-book.com"),
            makeBookmark("Pageflows", "https://pageflows.com"),
          ],
        },
      ],
    },
    {
      title: "Reading",
      children: [
        makeBookmark("The Pragmatic Engineer", "https://newsletter.pragmaticengineer.com"),
        makeBookmark("Stratechery", "https://stratechery.com"),
        makeBookmark("TLDR", "https://tldr.tech"),
        makeBookmark("Paul Graham Essays", "https://paulgraham.com/articles.html"),
        makeBookmark("First Round Review", "https://review.firstround.com"),
      ],
    },
  ],
});

const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clickIfPresent = async (locator) => {
  if ((await locator.count()) > 0) {
    await locator.first().click();
    return true;
  }

  return false;
};

const waitForEnabled = async (locator, timeoutMs = 5000) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await locator.isEnabled()) {
      return;
    }

    await waitFor(100);
  }

  throw new Error("Timed out waiting for the workspace to become interactive");
};

const main = async () => {
  ensureBuild();

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    throw new Error(
      "Playwright is not installed. Add it as a dev dependency or run the script in an environment that already has it."
    );
  }

  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      "Chrome/Chromium executable not found. Set CHROME_PATH or install Google Chrome/Chromium."
    );
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const demoFile = path.join(
    os.tmpdir(),
    `ai-ai-bookmarks-demo-${Date.now()}.json`
  );
  fs.writeFileSync(demoFile, JSON.stringify(makeDemoBookmarks(), null, 2));

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-ai-bookmarks-profile-"));

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 1,
    args: [
      `--disable-extensions-except=${distDir}`,
      `--load-extension=${distDir}`,
      "--start-maximized",
    ],
  });

  try {
    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    const extensionId = new URL(serviceWorker.url()).host;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/index.html`, {
      waitUntil: "domcontentloaded",
    });
    await page.locator('input[type="file"]').waitFor({ state: "attached" });

    await page.locator('input[type="file"]').setInputFiles(demoFile);
    await waitFor(1200);

    await page.getByRole("button", { name: "Folders" }).click();
    await page.locator(".folder-sidebar--open").waitFor({ state: "visible" });

    await clickIfPresent(page.locator(".sidebar-folder").filter({ hasText: "Research" }));
    await waitFor(400);

    const exportButton = page.getByRole("button", { name: "Export JSON" });
    await exportButton.waitFor({ state: "visible" });
    await waitForEnabled(exportButton);

    await page.screenshot({
      path: path.join(outputDir, "ai-ai-bookmarks-workspace.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: "Settings" }).click();
    await waitFor(400);

    await clickIfPresent(
      page.locator("label.endpoint-option").filter({ hasText: "ProxyAPI OpenRouter" })
    );
    await waitFor(200);

    await page.screenshot({
      path: path.join(outputDir, "ai-ai-bookmarks-settings.png"),
      fullPage: false,
    });

    console.log(`Saved screenshots to ${outputDir}`);
  } finally {
    await context.close();
    fs.rmSync(demoFile, { force: true });
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
