# sysf.io

Source of **[sysf.io](https://sysf.io)** — a Swiss sovereign-AI engineering
studio. We fine-tune Apertus (Switzerland's open LLM) and other open-weight
models on a client's own documents and run them inside their infrastructure:
on-prem, Swiss cloud, or fully air-gapped. Open weights their auditors can
inspect, no US API in the loop, and the client owns the resulting model.

This repository is the marketing site. The engineering work it points to lives
elsewhere — e.g. the reproducible evaluation behind
[sysf.io/reports/finma-ablation](https://sysf.io/reports/finma-ablation/):
**[github.com/chengmanov/apertus-finma-eval](https://github.com/chengmanov/apertus-finma-eval)**.

## Stack

- **[Eleventy](https://www.11ty.dev/)** (Nunjucks templates) + **[Tailwind CSS](https://tailwindcss.com/)**
- Static output, deployed to **GitHub Pages** via `.github/workflows/static.yml`
  on every push to `main` (custom domain `sysf.io`, see `src/CNAME`)

## Develop

```bash
npm install
npm run dev      # build + watch, serves at http://localhost:8080
npm run build    # one-off production build to _site/
```

## Layout

```
src/
├── *.njk                     top-level pages (index, platform, industries,
│                             pricing, about, contact, news)
├── concepts/                 the engineering-depth section
│   ├── small-models.njk      why task-tuned small models win regulated work
│   ├── quantization.njk      how a datacentre model fits in one server
│   ├── evaluation.njk        evaluation-first delivery
│   ├── sovereign-architecture.njk   deployment shapes + the local router
│   └── orchestration.njk     LangChain/LangGraph, hardened for production
├── reports/                  worked-example reports (tagged into /news/)
├── _data/site.json           brand copy, nav, base-model metadata
├── _includes/                base layout + partials (nav, footer, diagram)
├── assets/                   Tailwind input + images
├── llms.txt / llms-full.txt  machine-readable profile for AI/answer engines
├── robots.txt, sitemap.njk, CNAME
.eleventy.js                  collections (pages, writing), filters
tailwind.config.js            design tokens (Swiss-red accent, ink neutrals)
```

Content is plain text in the `.njk` templates and `src/_data/site.json`;
the site is fully static with no client-side framework.

## License

Code is MIT-licensed (see `LICENSE`). Site copy and brand assets © sysf.io.
