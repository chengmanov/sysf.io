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
