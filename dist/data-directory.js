'use strict';

// Filters are view preferences only. The tracker state and backup schema stay unchanged.
const initialDataSourceFilters = () => ({query: '', category: 'All', format: 'All', access: 'All', level: 'All'});
let dataSourceFilters = initialDataSourceFilters();

function findDataSources(filters = dataSourceFilters) {
  const words = String(filters.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return window.DATA_DIRECTORY.sources.filter(source => {
    const searchable = [source.name, source.category, source.description, source.projectIdea, ...source.topics, ...source.formats].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word)) &&
      (filters.category === 'All' || source.category === filters.category) &&
      (filters.format === 'All' || source.formats.includes(filters.format)) &&
      (filters.access === 'All' || source.access === filters.access) &&
      (filters.level === 'All' || source.level === filters.level);
  });
}

function dataFilter(label, key, values) {
  return `<label class="field">${esc(label)}<select id="data-filter-${key}" data-data-filter="${key}">${values.map(value => `<option value="${esc(value)}" ${dataSourceFilters[key] === value ? 'selected' : ''}>${esc(value === 'All' ? 'Any ' + label.toLowerCase() : value === 'XLSX' ? 'Excel (XLSX)' : value)}</option>`).join('')}</select></label>`;
}

function dataSourceCard(source) {
  return `<article class="card data-source-card" id="dataset-${esc(source.id)}">
    <div class="data-source-top">${badge(source.category, 'gray')}${badge(source.level, source.level === 'Beginner' ? 'green' : 'gray')}</div>
    <h3>${esc(source.name)}</h3>
    <p class="data-source-description">${esc(source.description)}</p>
    <div class="data-source-access">${icon(source.access === 'No account' ? 'download' : 'user')}<strong>${esc(source.access)}</strong></div>
    <div class="data-source-formats" aria-label="Available file formats">${source.formats.map(format => badge(format === 'XLSX' ? 'Excel' : format, 'gray')).join('')}</div>
    <p class="data-source-terms">${esc(source.terms)}</p>
    <div class="data-source-idea"><strong>Try this project</strong><p>${esc(source.projectIdea)}</p></div>
    <details class="data-source-evidence"><summary>Access notes · checked ${fmt(source.checkedOn, {day: 'numeric', month: 'short', year: 'numeric'})}</summary><p>${esc(source.evidenceNote)}</p>${ext(source.evidenceUrl, 'Read provider guidance')}</details>
    <div class="data-source-actions">${ext(source.url, 'Open data website')}${btn('Use for a project', 'data-project', 'plus', 'soft', `data-id="${source.id}"`)}</div>
  </article>`;
}

function dataSourceResults() {
  const results = findDataSources();
  return `<div class="data-results-heading"><h2>Find your dataset source</h2><p id="data-source-count" role="status" aria-live="polite">${results.length} of ${window.DATA_DIRECTORY.sources.length} sources</p></div>` +
    (results.length ? `<div class="data-source-grid">${results.map(dataSourceCard).join('')}</div>` :
      `<div class="card page-empty"><div class="empty-icon">${icon('search')}</div><h3>No sources match these filters</h3><p>Try a broader topic or clear the format, account and subject filters.</p>${btn('Clear filters', 'data-reset', 'close', 'primary')}</div>`);
}

function renderDataSourceResults() {
  const container = $('#data-source-results');
  if (container) container.innerHTML = dataSourceResults();
}

function resetDataSourceFilters() {
  dataSourceFilters = initialDataSourceFilters();
  render();
}

function beginnerDataSources() {
  dataSourceFilters = {...initialDataSourceFilters(), level: 'Beginner'};
  render();
}

function focusDataSource(sourceId) {
  const source = window.DATA_DIRECTORY.sources.find(item => item.id === sourceId);
  if (source) dataSourceFilters = {...initialDataSourceFilters(), query: source.name};
}

function dataSources() {
  const directory = window.DATA_DIRECTORY;
  const formats = [...new Set(directory.sources.flatMap(source => source.formats))].sort();
  const starts = [
    {id: 'ms-financial', step: '01', title: 'Your first Excel / Power BI report', text: 'Start with Microsoft’s Financial Sample workbook. Check sales and profit totals before building visuals.', label: 'Open a small sample'},
    {id: 'maven-data-playground', step: '02', title: 'Build on your operations experience', text: 'Look for inventory, manufacturing downtime or sales data in Maven’s free Data Playground.', label: 'Find an operations dataset'},
    {id: 'world-bank', step: '03', title: 'Explore India and global trends', text: 'Choose one indicator and a few countries from World Bank Open Data. Keep the years and units consistent.', label: 'Find country indicators'}
  ];
  return heading('Find the data. Build the proof.', 'Free sources for your Excel, SQL and Power BI projects — and room to explore other data types.', btn('Export this view', 'data-csv', 'download'), 'FREE DATA DIRECTORY') +
    `<div class="data-directory-intro"><div><span class="data-free-label">₹0 DATA ACCESS</span><h2>${directory.sources.length} sources. ${directory.categories.length} subject areas.</h2><p>Public downloads and free-access plans, with account requirements and limits shown on every source. Start with a small CSV or Excel file that works on your laptop.</p></div><div class="data-directory-meta">${icon('database')}<strong>Pick a source → ask a question → save a project</strong><span>Access notes checked ${fmt(directory.checkedOn, {day: 'numeric', month: 'long', year: 'numeric'})}</span></div></div>
    <div class="data-start-grid">${starts.map(start => `<article class="card data-start-card"><span class="eyebrow">START ${start.step}</span><h3>${start.title}</h3><p>${start.text}</p>${btn(start.label, 'data-focus', 'arrow', 'ghost', `data-id="${start.id}"`)}</article>`).join('')}</div>
    <div class="callout data-access-note">${icon('info')}<div><strong>Free access can still have conditions.</strong> Some sources need a free account or API key, limit request volumes, or restrict commercial reuse. On mixed catalogues, choose public, open or ungated files. Optional paid services and cloud computing are separate from the free data routes listed here.</div></div>
    <section class="card data-filter-panel" aria-label="Filter free dataset sources">
      <label class="field data-source-search">Search topics or providers<input id="data-source-search" type="search" value="${esc(dataSourceFilters.query)}" placeholder="Try delivery, inventory, India, cricket, images…" aria-controls="data-source-results"></label>
      <div class="data-filter-grid">${dataFilter('Subject', 'category', ['All', ...directory.categories])}${dataFilter('Format', 'format', ['All', ...formats])}${dataFilter('Account requirement', 'access', ['All', 'No account', 'Free account / key', 'Varies by dataset'])}${dataFilter('Experience level', 'level', ['All', 'Beginner', 'Intermediate'])}</div>
      <div class="data-filter-actions">${btn('Beginner picks', 'data-beginner', 'spark', 'soft')}${btn('Clear filters', 'data-reset', 'close', 'ghost')}<span>Combine subject and format. Account labels describe downloads; check each source’s notes for API-key requirements.</span></div>
    </section>
    <section id="data-source-results" aria-label="Matching data sources">${dataSourceResults()}</section>
    <section class="data-discovery-section">${section('Need something more specific?', 'Discovery tools help you find original publishers. Their results need a separate free-access check.')}<div class="data-discovery-grid">${directory.discoveryTools.map(tool => `<article class="card data-discovery-card">${badge('Discovery only', 'amber')}<h3>${esc(tool.name)}</h3><p>${esc(tool.description)}</p><p class="data-source-terms">${esc(tool.terms)}</p>${ext(tool.url, 'Search for datasets')}<details class="data-source-evidence"><summary>About this search tool</summary><p>${esc(tool.evidenceNote)}</p>${ext(tool.evidenceUrl, 'Read provider guidance')}</details></article>`).join('')}</div></section>
    <div class="note-box"><strong>${icon('file')}Turn a download into evidence.</strong><p>Choose a question before downloading. Save the source URL, licence, date, data dictionary and cleaning decisions. Check totals, explain three findings and label public, sample or synthetic data accurately. For very large collections, start with one month, one country or just the metadata.</p></div>`;
}

function openDataProject(sourceId) {
  const source = window.DATA_DIRECTORY.sources.find(item => item.id === sourceId);
  if (!source) return;
  const tabular = source.formats.some(format => ['CSV', 'XLSX', 'TSV', 'JSON', 'Parquet'].includes(format));
  const tools = source.formats.includes('SQL') ? ['SQL'] : tabular ? ['Excel', 'SQL', 'Power BI'] : ['Python'];
  openProjectBrief(undefined, {
    title: 'Analysis: ' + source.name,
    description: `Business question: ${source.projectIdea}\n\nDataset source: ${source.url}\nChoose one dataset or subset; record its title, source date, coverage and licence before analysis.\n\nProvider access / reuse notes: ${source.terms}\n\nIndependent learning project. Describe only the work you actually complete.`,
    tools,
    deliverables: ['Source, licence, access date and data dictionary', 'Cleaning steps, data-quality checks and validated totals', 'Analysis files and three evidence-backed findings', 'Charts or dashboard and a README with limitations'],
    estimated: 'Your own pace'
  });
}

function exportDataSources() {
  const sources = findDataSources();
  if (!sources.length) { toast('Clear or broaden your filters before exporting.'); return; }
  const columns = ['Source', 'Subject', 'Topics', 'Formats', 'Account requirement', 'Level', 'Website', 'Project idea', 'Access and reuse notes', 'Provider guidance', 'Checked on'];
  const rows = sources.map(source => [source.name, source.category, source.topics.join('; '), source.formats.join('; '), source.access, source.level, source.url, source.projectIdea, source.terms, source.evidenceUrl, source.checkedOn]);
  const cell = value => {
    let text = String(value ?? '');
    if (/^\s*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const csv = '\uFEFF' + [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
  download('analyst-path-data-sources-' + today() + '.csv', csv, 'text/csv;charset=utf-8');
  toast(`${sources.length} data sources exported for offline reference`);
}
