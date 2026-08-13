import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = path.resolve(projectRoot, process.argv[2] || ".site/sitemap.xml");
const keyPath = path.join(projectRoot, "deploy/indexnow-key.txt");
const origin = new URL("https://iconicchargers.com/");
const endpoint = new URL(process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow");
const MAX_ATTEMPTS = 4;

function decodeXml(value) {
  return value.replace(/&(?:#(x[0-9a-f]+|\d+)|amp|apos|gt|lt|quot);/gi, (entity, numeric) => {
    if (numeric) {
      const radix = numeric[0].toLowerCase() === "x" ? 16 : 10;
      const digits = radix === 16 ? numeric.slice(1) : numeric;
      return String.fromCodePoint(Number.parseInt(digits, radix));
    }
    return { "&amp;": "&", "&apos;": "'", "&gt;": ">", "&lt;": "<", "&quot;": '"' }[
      entity.toLowerCase()
    ];
  });
}

function sitemapUrls(xml) {
  const urls = [];
  for (const match of xml.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)) {
    const url = new URL(decodeXml(match[1]));
    if (url.origin !== origin.origin) {
      throw new Error(`Sitemap URL is outside the canonical origin: ${url.origin}`);
    }
    if (url.hash) throw new Error(`Sitemap URL contains a fragment: ${url.pathname}`);
    urls.push(url.href);
  }
  return [...new Set(urls)];
}

const [xml, keyFile] = await Promise.all([
  readFile(sitemapPath, "utf8"),
  readFile(keyPath, "utf8"),
]);
const key = keyFile.trim();
if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error("deploy/indexnow-key.txt is not a valid IndexNow key");
}

const urls = sitemapUrls(xml);
if (urls.length === 0) throw new Error("Sitemap has no canonical URLs to submit");

const keyLocation = new URL("indexnow-key.txt", origin).href;
const batches = [];
for (let i = 0; i < urls.length; i += 10_000) batches.push(urls.slice(i, i + 10_000));

if (process.env.INDEXNOW_DRY_RUN === "1") {
  console.log(`IndexNow dry run: ${urls.length} canonical URLs in ${batches.length} batch(es)`);
  process.exit(0);
}

for (const [index, urlList] of batches.entries()) {
  let accepted;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: origin.hostname,
          key,
          keyLocation,
          urlList,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 200 || response.status === 202) {
        accepted = response.status;
        break;
      }
      const retryable = [408, 425, 429].includes(response.status) || response.status >= 500;
      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw new Error(`IndexNow rejected batch ${index + 1}/${batches.length} with HTTP ${response.status}`);
      }
      await delay(retryDelay(response.headers.get("retry-after"), attempt));
    } catch (error) {
      if (attempt === MAX_ATTEMPTS || /IndexNow rejected/.test(error.message)) throw error;
      await delay(retryDelay(null, attempt));
    }
  }
  if (!accepted) throw new Error(`IndexNow did not accept batch ${index + 1}/${batches.length}`);
  console.log(
    `IndexNow accepted batch ${index + 1}/${batches.length}: ${urlList.length} URLs (HTTP ${accepted})`,
  );
}

function retryDelay(retryAfter, attempt) {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const milliseconds = Number.isFinite(seconds)
      ? seconds * 1000
      : Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(milliseconds) && milliseconds > 0) return Math.min(milliseconds, 10_000);
  }
  return Math.min(500 * (2 ** (attempt - 1)), 4_000);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
