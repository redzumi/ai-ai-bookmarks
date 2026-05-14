import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectRoot, "dist");
const outputDir = path.join(projectRoot, "docs", "assets", "preview");

const DEFAULT_PREVIEW_NAMES = ["workspace", "settings"];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    format: "png",
    maxShots: 2,
    size: "1280x800",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--format" && args[index + 1]) {
      options.format = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--format=")) {
      options.format = arg.split("=", 2)[1] ?? options.format;
      continue;
    }

    if (arg === "--size" && args[index + 1]) {
      options.size = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--size=")) {
      options.size = arg.split("=", 2)[1] ?? options.size;
      continue;
    }

    if (arg === "--max-shots" && args[index + 1]) {
      options.maxShots = Number(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--max-shots=")) {
      options.maxShots = Number(arg.split("=", 2)[1] ?? options.maxShots);
      continue;
    }
  }

  if (!["png", "jpeg", "jpg"].includes(options.format)) {
    throw new Error("Format must be png, jpeg, or jpg");
  }

  if (!Number.isInteger(options.maxShots) || options.maxShots < 1 || options.maxShots > 5) {
    throw new Error("max-shots must be between 1 and 5");
  }

  const sizeMatch = /^(\d+)x(\d+)$/.exec(options.size);
  if (!sizeMatch) {
    throw new Error("size must be formatted as WIDTHxHEIGHT, for example 1280x800");
  }

  const width = Number(sizeMatch[1]);
  const height = Number(sizeMatch[2]);

  if (width <= 0 || height <= 0) {
    throw new Error("size dimensions must be positive numbers");
  }

  return {
    format: options.format === "jpg" ? "jpeg" : options.format,
    maxShots: options.maxShots,
    width,
    height,
  };
};

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
            makeBookmark("Lucide", "https://lucide.dev"),
          ],
        },
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

const capturePreview = async (page, spec, format, outputIndex) => {
  const fileName = `ai-ai-bookmarks-preview-${outputIndex + 1}-${spec.name}.${format}`;
  await page.setViewportSize({ width: spec.width, height: spec.height });
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: false,
    type: format,
  });
};

const main = async () => {
  const { format, maxShots, width, height } = parseArgs();
  ensureBuild();

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
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
    `ai-ai-bookmarks-preview-demo-${Date.now()}.json`
  );
  fs.writeFileSync(demoFile, JSON.stringify(makeDemoBookmarks(), null, 2));

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-ai-bookmarks-preview-profile-"));

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: false,
    viewport: { width, height },
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

    const previewSpecs = DEFAULT_PREVIEW_NAMES.slice(0, maxShots).map((name) => ({
      name,
      width,
      height,
    }));
    for (let index = 0; index < previewSpecs.length; index += 1) {
      const spec = previewSpecs[index];

      if (spec.name === "settings") {
        await page.getByRole("button", { name: "Settings" }).click();
        await waitFor(400);
      }

      await capturePreview(page, spec, format, index);
    }

    console.log(`Saved preview screenshots to ${outputDir}`);
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
