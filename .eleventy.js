module.exports = function (eleventyConfig) {
  // Copy static assets (images, svg, favicon). Tailwind writes styles.css separately.
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });

  // Live in-browser demo (self-contained WebGPU app) served at /demo/app/.
  // Passthrough-copy it verbatim and DO NOT process it as a Nunjucks template
  // (its inlined JS/WGSL contains `{{`/`{%`-like sequences).
  eleventyConfig.addPassthroughCopy({ "src/demo-app": "demo/app" });
  eleventyConfig.ignores.add("src/demo-app/index.html");

  // Root files for AEO/SEO + GitHub Pages custom domain.
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/llms.txt": "llms.txt" });
  eleventyConfig.addPassthroughCopy({ "src/llms-full.txt": "llms-full.txt" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });

  // Current year, absolute-url helper.
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    try {
      return new URL(path, base).toString();
    } catch (e) {
      return path;
    }
  });

  // Pages collection for nav + sitemap (anything with `order` in front matter).
  eleventyConfig.addCollection("pages", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.data.eleventyNavigation || item.data.order !== undefined)
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  // Writing collection (reports, notes) for the News index — newest first.
  eleventyConfig.addCollection("writing", (collectionApi) =>
    collectionApi
      .getFilteredByTag("writing")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
  );

  // Resources collection — the unified knowledge library (concepts + reports +
  // demo + notes). Any page with a `resType` joins it. Ordered for the "All"
  // view: concepts first (by resOrder), then demo, then reports (newest first).
  eleventyConfig.addCollection("resources", (collectionApi) => {
    const rank = { concept: 0, demo: 1, report: 2, note: 3 };
    return collectionApi
      .getAll()
      .filter((item) => item.data.resType)
      .sort((a, b) => {
        const ra = rank[a.data.resType] ?? 9;
        const rb = rank[b.data.resType] ?? 9;
        if (ra !== rb) return ra - rb;
        if (a.data.date && b.data.date) return new Date(b.data.date) - new Date(a.data.date);
        return (a.data.resOrder || 0) - (b.data.resOrder || 0);
      });
  });

  // Readable date for post listings, e.g. "19 July 2026" — locale-aware.
  const DATE_LOCALES = { en: "en-GB", de: "de-CH", fr: "fr-CH", it: "it-CH" };
  eleventyConfig.addFilter("readableDate", (value, loc) => {
    const d = value ? new Date(value) : new Date();
    return d.toLocaleDateString(DATE_LOCALES[loc] || "en-GB", { day: "numeric", month: "long", year: "numeric" });
  });

  // --- i18n helpers -----------------------------------------------------
  // The four site locales. English lives at the root; de/fr/it under a prefix.
  const LOCALES = ["en", "de", "fr", "it"];
  eleventyConfig.addGlobalData("locales", LOCALES);

  // Strip a leading /de|/fr|/it locale segment → the shared "translation key"
  // path. "/de/platform/" → "/platform/", "/de/" → "/", "/platform/" → "/platform/".
  eleventyConfig.addFilter("localeBase", (url) => {
    const m = /^\/(de|fr|it)(\/.*)?$/.exec(url || "/");
    return m ? m[2] || "/" : url;
  });

  // Build the URL for a translation-key path in a given locale.
  // ("/platform/", "de") → "/de/platform/"; ("/", "de") → "/de/"; loc "en" → unchanged.
  eleventyConfig.addFilter("localeUrl", (base, loc) => {
    if (!loc || loc === "en") return base;
    return base === "/" ? `/${loc}/` : `/${loc}${base}`;
  });

  // Keep only the collection items belonging to a given locale (default "en").
  eleventyConfig.addFilter("byLocale", (arr, loc) =>
    (arr || []).filter((p) => (p.data.locale || "en") === (loc || "en"))
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
