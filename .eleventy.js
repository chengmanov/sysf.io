module.exports = function (eleventyConfig) {
  // Copy static assets (images, svg, favicon). Tailwind writes styles.css separately.
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "assets/img" });

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
