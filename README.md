# Analyst Path — Data Analytics Career Workspace

A practical workspace for a BA graduate and Operations Supervisor who uses Excel daily and is learning SQL and Power BI. Plan learning, build honest evidence, compare roles and track genuine applications using free resources.

## What's included

- 18 guided Excel, SQL and Power BI practice steps with saved completion and self assessment.
- Curated free learning resources, clear certificate/badge distinctions and an earned credential shelf.
- Three suggested independent projects plus custom project briefs, deliverables, status and evidence links.
- Official opportunity sources and user-added leads with source, eligibility, fee, deadline and verification checks.
- Application list and board views, status history, follow-ups, notes and CSV export.
- Dated progress entries, learning time, evidence links and next actions.
- Comparisons for Data Analyst, Govt MIS/DEO/Computer Operator, Govt Project/Programme Assistant and Govt contractual Operations/MIS.
- Reusable CV summary, STAR, weekly review, project README and eligibility templates.
- JSON backup and restore.
- A searchable free-data directory with 64 source entries across 14 subject areas, plus a clearly separate dataset-discovery tool. Filter by subject, file format, access requirements and beginner suitability; export the filtered directory to CSV or turn a source into a project brief.

The app starts without completed learning, earned credentials, job applications or live vacancy claims. Independent projects are labelled as learning work rather than employment or internships.

## GitHub Pages deployment

The repository's `main` branch deploys `dist/` through `.github/workflows/pages.yml`. No paid hosting, dependencies, build step, API key or custom secret is required.

One-time repository setup:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy Analyst Path to GitHub Pages** and run the workflow, or push a change to `main`.

The workflow checks JavaScript syntax and runs the functional checks before uploading and deploying the static files. Its deployment summary returns the live URL. The expected project URL is `https://subhatitm.github.io/Data-Analytics-Projects/` once the deployment succeeds.

## Your records and privacy

GitHub Pages serves the app publicly. Your tracker records remain in `localStorage` in the browser where you enter them; they are not committed to GitHub or sent to an application server. This is a personal browser workspace, not a shared or cloud-synced database. Anyone using the same browser profile and site can access that browser's records.

To move existing progress from the original Sites address to GitHub Pages:

1. At the original address, open **Backup & restore → Export full backup**.
2. At the GitHub Pages address, open **Backup & restore → Restore a backup** and choose that JSON file.
3. Restore replaces records on the destination browser. Export any destination records first if you need them.

Different site origins have separate browser storage. Keep backups somewhere private; do not commit personal backups, applications, confidential employer data or evidence files to this public repository. An evidence link opens its destination; its access permissions depend on that service.

External learning links have their own account requirements and terms. Free training achievements are distinct from paid professional certification. Government recruitment or exam fees can exist; verify the original notice and use the app's ₹0 filter when needed.

## Local development and checks

The website is plain HTML, CSS and JavaScript. Edit the files in `dist/` directly. A standard local static server can serve that folder.

With Node.js 18 or later:

```sh
node --check dist/app.js
node --check dist/data.js
node --check dist/data-sources.js
node --check dist/data-directory.js
node tests/check-workspace.cjs
```

The functional suite uses Node with a mocked DOM. It covers record creation/editing, project checklists, application stages, persistence, backup validation, safe rendering and CSV output. It does not verify browser rendering or responsive layout.

## Files

```text
dist/
  index.html
  styles.css
  data.js
  data-sources.js
  data-directory.js
  app.js
tests/
  check-workspace.cjs
.github/workflows/
  pages.yml
```

The original Sites hosting configuration is intentionally excluded from this GitHub Pages copy. The deployed app uses relative asset paths and hash routes so it works under the repository URL.

## Free data directory

Open **Free data sources** in the sidebar, or use `#datasets` in the website URL. The 64 entries include open catalogues and useful specific dataset collections; a provider can have more than one entry. Google Dataset Search is listed separately as discovery only because its results are not guaranteed to be free.

The directory covers business/retail, transport/logistics, India/government, economy/finance, general data, population/society, health, food/agriculture, energy, climate/environment, maps/geography, science/education, text/images/audio/video and sports. Each entry includes the provider URL, typical formats, account requirements, a project idea, reuse or free-tier limits, an official evidence link and a checked date. Access notes were checked on 18 November 2026; terms can change.

Free means the stated public downloads or stated free plan can be used without paying for data. It does not promise unrestricted licences, unlimited API requests, free cloud computation, or a free copy of every dataset a catalogue links to. No paid-only providers, credit-card trials or automatic API calls are needed. Use public/ungated records; optional premium services are separate. Small CSV/Excel files are the best starting point on a laptop or mobile hotspot.

Directory filters only affect this view. **Use for a project** prepares an editable independent-project brief; it creates a saved project only after you select **Save project brief**. Existing tracker records, storage keys and backups retain their current format. To maintain the catalogue, edit `dist/data-sources.js` and update the specific source's evidence link and checked date.
