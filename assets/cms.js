(() => {
  const config = window.ELIAS_CMS;
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) return;

  const readPath = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeHref = value => {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.origin);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };

  const applyText = data => {
    document.querySelectorAll('[data-cms]').forEach(element => {
      const value = readPath(data, element.dataset.cms);
      if (typeof value === 'string' && value.trim()) element.textContent = value;
    });
  };

  const renderProjects = projects => {
    const list = document.querySelector('[data-cms-projects]');
    if (!list || !Array.isArray(projects)) return;

    const visible = projects
      .filter(project => project && project.published !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    if (!visible.length) return;

    list.innerHTML = visible.map((project, index) => {
      const slug = escapeHtml(project.slug || `project-${index + 1}`);
      const title = escapeHtml(project.title || 'Untitled project');
      const category = escapeHtml(project.category || 'Project');
      const year = escapeHtml(project.year || '');
      const status = escapeHtml(project.status || '');
      const summary = escapeHtml(project.summary || '');
      const focus = escapeHtml(project.focus || '');
      const stack = escapeHtml(project.stack || '');
      const href = safeHref(project.url);
      const cover = safeHref(project.coverUrl);
      const number = String(index + 1).padStart(2, '0');
      const meta = [year, status].filter(Boolean).join(' / ');

      return `
        <details id="${slug}" class="project-accordion" data-reveal>
          <summary>
            <span class="project-accordion-number">${number}</span>
            <div class="project-accordion-title">
              <span class="eyebrow">${category}</span>
              <h2>${title}</h2>
            </div>
            <span class="project-accordion-meta">${meta}</span>
            <span class="project-accordion-toggle" aria-hidden="true"></span>
          </summary>
          <div class="project-accordion-body">
            ${cover ? `<img class="project-cms-cover" src="${cover}" alt="">` : ''}
            <div class="project-accordion-copy">
              <p>${summary}</p>
              ${href ? `<a class="text-link" href="${href}">Open project <span aria-hidden="true">↗</span></a>` : ''}
            </div>
            <div class="project-facts">
              <div><span class="eyebrow">Focus</span><p>${focus || '—'}</p></div>
              <div><span class="eyebrow">Stack</span><p>${stack || '—'}</p></div>
              <div><span class="eyebrow">Status</span><p>${status || '—'}</p></div>
            </div>
          </div>
        </details>`;
    }).join('');
  };

  const endpoint = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/site_content?site_key=eq.${encodeURIComponent(config.siteKey || 'main')}&published=eq.true&select=data&limit=1`;

  fetch(endpoint, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  })
    .then(response => {
      if (!response.ok) throw new Error(`CMS request failed: ${response.status}`);
      return response.json();
    })
    .then(rows => {
      const data = rows?.[0]?.data;
      if (!data || typeof data !== 'object') return;
      applyText(data);
      renderProjects(data.projects);
      document.dispatchEvent(new CustomEvent('cms:updated'));
    })
    .catch(() => {
      // Static HTML remains the source of truth whenever the CMS is unavailable.
    });
})();
