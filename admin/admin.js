(() => {
  const config = window.ELIAS_CMS;
  const setupPanel = document.getElementById('setup-panel');
  const authPanel = document.getElementById('auth-panel');
  const editor = document.getElementById('editor');
  const status = document.getElementById('connection-status');
  const signOutButton = document.getElementById('sign-out');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const authMessage = document.getElementById('auth-message');
  const contentForm = document.getElementById('content-form');
  const saveMessage = document.getElementById('save-message');
  const projectsEditor = document.getElementById('projects-editor');
  const projectTemplate = document.getElementById('project-template');
  const addProjectButton = document.getElementById('add-project');

  const defaultData = {
    home: {
      primary: 'Solutions architecture and systems design.',
      secondary: 'Design, travel, photography, and independent work.',
      areas: 'Systems, design, travel, and photography.',
      workSummary: 'Architecture, automation, and platforms.',
      designSummary: 'Interiors, clothing, and objects.',
      travelSummary: 'Places, hotels, and photographs.'
    },
    about: {
      deck: 'Systems, design, travel, and photography.',
      work: 'Architecture, automation, platforms, and data.',
      design: 'Traditional interiors, classic clothing, and well-made objects.',
      travel: 'Architecture, hotels, landscapes, and photographs.'
    },
    contact: {
      deck: 'Consulting and independent systems work.',
      prompt: 'Send me the context and what you’re trying to solve.',
      focus: 'Systems architecture, automation, platforms, and selected digital projects.'
    },
    projects: [
      {
        slug: 'personal-site',
        title: 'Personal site.',
        category: 'Design & development',
        year: '2026',
        status: 'Ongoing',
        summary: 'Designed and built by me.',
        focus: 'Design / Front-end',
        stack: 'HTML / CSS / JavaScript',
        url: 'https://github.com/eliasespi/elias-espinosa-web',
        coverUrl: '',
        order: 1,
        published: true
      }
    ]
  };

  if (!config?.supabaseUrl || !config?.supabaseAnonKey || !window.supabase) {
    setupPanel.hidden = false;
    status.textContent = 'Backend not connected';
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  let workingData = structuredClone(defaultData);

  const getPath = (source, path) => path.split('.').reduce((value, key) => value?.[key], source);
  const setPath = (source, path, value) => {
    const keys = path.split('.');
    const finalKey = keys.pop();
    const parent = keys.reduce((target, key) => target[key] ??= {}, source);
    parent[finalKey] = value;
  };

  const showSignedOut = () => {
    authPanel.hidden = false;
    editor.hidden = true;
    signOutButton.hidden = true;
    status.textContent = 'Signed out';
  };

  const showSignedIn = email => {
    authPanel.hidden = true;
    editor.hidden = false;
    signOutButton.hidden = false;
    status.textContent = email || 'Signed in';
  };

  const slugify = value => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const renderProjects = () => {
    projectsEditor.innerHTML = '';
    (workingData.projects || []).forEach((project, index) => {
      const card = projectTemplate.content.firstElementChild.cloneNode(true);
      card.dataset.index = String(index);
      card.querySelector('.project-label').textContent = project.title || `Project ${index + 1}`;
      card.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        if (input.type === 'checkbox') input.checked = project[field] !== false;
        else input.value = project[field] ?? '';
      });

      const titleInput = card.querySelector('[data-field="title"]');
      const slugInput = card.querySelector('[data-field="slug"]');
      let slugWasEdited = Boolean(project.slug);

      titleInput.addEventListener('input', () => {
        card.querySelector('.project-label').textContent = titleInput.value || `Project ${index + 1}`;
        if (!slugWasEdited) slugInput.value = slugify(titleInput.value);
      });
      slugInput.addEventListener('input', () => { slugWasEdited = true; });
      card.querySelector('.remove-project').addEventListener('click', () => {
        workingData.projects.splice(index, 1);
        renderProjects();
      });

      projectsEditor.appendChild(card);
    });
  };

  const hydrateForm = data => {
    contentForm.querySelectorAll('input[name]').forEach(input => {
      const value = getPath(data, input.name);
      input.value = typeof value === 'string' ? value : '';
    });
    renderProjects();
  };

  const collectForm = () => {
    contentForm.querySelectorAll('input[name]').forEach(input => setPath(workingData, input.name, input.value.trim()));

    workingData.projects = [...projectsEditor.querySelectorAll('.project-card')].map((card, index) => {
      const project = {};
      card.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        if (input.type === 'checkbox') project[field] = input.checked;
        else if (input.type === 'number') project[field] = Number(input.value) || index + 1;
        else project[field] = input.value.trim();
      });
      project.slug = project.slug || slugify(project.title) || `project-${index + 1}`;
      return project;
    });

    return workingData;
  };

  const loadContent = async () => {
    saveMessage.textContent = 'Loading…';
    const { data, error } = await client
      .from('site_content')
      .select('data')
      .eq('site_key', config.siteKey || 'main')
      .maybeSingle();

    if (error) {
      saveMessage.textContent = error.message;
      return;
    }

    workingData = data?.data ? structuredClone(data.data) : structuredClone(defaultData);
    workingData.projects ??= [];
    hydrateForm(workingData);
    saveMessage.textContent = '';
  };

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    authMessage.textContent = 'Sending…';
    const { error } = await client.auth.signInWithOtp({
      email: loginEmail.value.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin/` }
    });
    authMessage.textContent = error ? error.message : 'Magic link sent. Check your email.';
  });

  signOutButton.addEventListener('click', async () => {
    await client.auth.signOut();
    showSignedOut();
  });

  addProjectButton.addEventListener('click', () => {
    workingData.projects ??= [];
    workingData.projects.push({
      slug: '', title: '', category: 'Project', year: String(new Date().getFullYear()), status: 'Ongoing',
      summary: '', focus: '', stack: '', url: '', coverUrl: '', order: workingData.projects.length + 1, published: true
    });
    renderProjects();
    projectsEditor.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  contentForm.addEventListener('submit', async event => {
    event.preventDefault();
    saveMessage.textContent = 'Saving…';
    const data = collectForm();
    const { error } = await client
      .from('site_content')
      .upsert({
        site_key: config.siteKey || 'main',
        data,
        published: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'site_key' });

    saveMessage.textContent = error ? error.message : `Saved ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  });

  const { data: { session } } = await client.auth.getSession();
  if (session?.user) {
    showSignedIn(session.user.email);
    await loadContent();
  } else {
    showSignedOut();
  }

  client.auth.onAuthStateChange(async (_event, nextSession) => {
    if (nextSession?.user) {
      showSignedIn(nextSession.user.email);
      await loadContent();
    } else {
      showSignedOut();
    }
  });
})();
