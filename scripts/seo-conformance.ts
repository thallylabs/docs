import fs from "node:fs";
import path from "node:path";
import sitemap from "@/app/sitemap";
import { getI18nConfig } from "@/data/docs";
import { buildLanguageAlternates } from "@/lib/i18n-seo";
import { getSiteUrl } from "@/lib/site-url";

function renderedFiles(directory: string): Array<string> {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return renderedFiles(target);
    return /\.(?:html|body)$/.test(entry.name) ? [target] : [];
  });
}

async function main() {
  const failures: Array<string> = [];
  const siteUrl = getSiteUrl();
  const parsedSiteUrl = new URL(siteUrl);

  if (["localhost", "127.0.0.1", "::1"].includes(parsedSiteUrl.hostname)) {
    failures.push(
      "THALLY_SITE_URL must be a public origin for the release SEO check",
    );
  }

  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);
  if (new Set(urls).size !== urls.length)
    failures.push("sitemap contains duplicate URLs");
  if (urls.some((url) => !url.startsWith(`${siteUrl}/`) && url !== siteUrl)) {
    failures.push("sitemap contains URLs outside the canonical origin");
  }

  const i18n = getI18nConfig();
  if (i18n && i18n.locales.length > 1) {
    for (const locale of i18n.locales.filter(
      ({ code }) => code !== i18n.defaultLocale,
    )) {
      if (
        !urls.some((url) =>
          new URL(url).pathname.startsWith(`/${locale.code}/`),
        )
      ) {
        failures.push(`sitemap is missing ${locale.code} locale URLs`);
      }
    }
    const alternates = buildLanguageAlternates(siteUrl, "/quickstart", i18n);
    if (!alternates?.["x-default"])
      failures.push("language alternates are missing x-default");
  }

  const builtFiles = renderedFiles(
    path.join(process.cwd(), ".next/server/app"),
  );
  for (const file of builtFiles) {
    const contents = fs.readFileSync(file, "utf8");
    if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(contents)) {
      failures.push(
        `rendered output contains a local origin: ${path.relative(process.cwd(), file)}`,
      );
    }
  }

  if (failures.length) {
    console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
    process.exit(1);
  }

  console.log(
    `SEO conformance passed for ${entries.length} sitemap URLs and ${builtFiles.length} rendered files.`,
  );
}

void main();
