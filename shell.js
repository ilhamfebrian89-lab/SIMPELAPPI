document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('.dashboard-shell');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const brandBlock = document.querySelector('.brand-block');
  const topbarTools = document.querySelector('.topbar-tools');
  const sideMenu = document.querySelector('.side-menu');
  let menuLinks = [];

  if (!shell || !sidebar || !topbarTools) {
    return;
  }

  if (!sidebar.id) {
    sidebar.id = 'appSidebar';
  }

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('aria-label', 'Tutup menu');
    document.body.appendChild(overlay);
  }

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'menu-toggle';
  toggleButton.setAttribute('aria-label', 'Buka atau tutup menu');
  toggleButton.setAttribute('aria-controls', sidebar.id);
  toggleButton.setAttribute('aria-expanded', 'false');
  toggleButton.innerHTML = '<span></span><span></span><span></span>';

  topbarTools.prepend(toggleButton);

  const setOpen = (open) => {
    const shouldLock = open && isMobile();
    shell.classList.toggle('sidebar-open', open);
    toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('sidebar-lock', shouldLock);
    syncBrandCondense();
  };

  const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

  const renderBrand = () => {
    if (!brandBlock) {
      return;
    }

    brandBlock.innerHTML = '<img class="brand-logo-image" src="assets/kemenkes-upload.png" alt="Kemenkes RS Mata Cicendo" />';
  };

  const syncBrandCondense = () => {
    sidebar.classList.remove('sidebar-condensed');
  };

  const icons = {
    dashboard:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path></svg>',
    isolation:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 7v10"></path><path d="M8 12h8"></path></svg>',
    bundle:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M8 9h8"></path><path d="M8 13h8"></path></svg>',
    surveilans:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l3 6 6 .8-4.5 4.2 1.1 6L12 17l-5.6 3 1.1-6L3 9.8 9 9z"></path></svg>',
    rtl:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12"></path><path d="M6 12h8"></path><path d="M6 17h10"></path><circle cx="18" cy="12" r="2"></circle></svg>',
    logbook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2z"></path><path d="M6 4v16"></path><path d="M10 9h6"></path></svg>',
    report:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H7z"></path><path d="M15 3v4h4"></path><path d="M10 13h6"></path><path d="M10 17h6"></path></svg>',
    settings:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"></path></svg>',
    profile:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 20a8 8 0 0 1 16 0"></path></svg>'
  };

  const menuSchema = [
    { href: 'index.html', icon: icons.dashboard, label: 'Dashboard' },
    { href: 'monitoring.html', icon: icons.isolation, label: 'Kewaspadaan Isolasi', caret: true },
    { href: 'audit.html', icon: icons.bundle, label: 'Bundles HAIs', caret: true },
    { href: 'surveilans.html', icon: icons.surveilans, label: 'Surveilans HAIs', caret: true },
    { href: 'rtl.html', icon: icons.rtl, label: 'PPRA / RTL', caret: true },
    { href: 'notification.html', icon: icons.logbook, label: 'Logbook IPCN' },
    { href: 'report.html', icon: icons.report, label: 'Laporan' },
    { href: 'admin.html', icon: icons.settings, label: 'Pengaturan' },
    { href: 'profile.html', icon: icons.profile, label: 'Profile' }
  ];

  const renderMenu = () => {
    if (!sideMenu) {
      return;
    }

    sideMenu.innerHTML = menuSchema
      .map((item) => {
        const caret = item.caret ? '<span class="side-menu-caret">⌄</span>' : '';
        return `<a class="side-menu-item" href="${item.href}"><span class="side-menu-icon">${item.icon}</span><span>${item.label}</span>${caret}</a>`;
      })
      .join('');

    menuLinks = Array.from(sideMenu.querySelectorAll('.side-menu-item'));
  };

  const syncActiveMenu = () => {
    if (menuLinks.length === 0) {
      return;
    }

    const currentPath = window.location.pathname.split('/').pop() || '';
    menuLinks.forEach((link) => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    });

    const matched = menuLinks.find((link) => {
      const href = link.getAttribute('href');
      if (!href) {
        return false;
      }

      const target = href.split('/').pop();
      return target === currentPath;
    });

    if (matched) {
      matched.classList.add('active');
      matched.setAttribute('aria-current', 'page');
    }
  };

  const bindMenuInteractions = () => {
    menuLinks.forEach((item) => {
      item.addEventListener('click', () => {
        if (isMobile()) {
          setOpen(false);
        }
      });
    });
  };

  toggleButton.addEventListener('click', () => {
    setOpen(!shell.classList.contains('sidebar-open'));
  });

  overlay.addEventListener('click', () => {
    setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && shell.classList.contains('sidebar-open')) {
      setOpen(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!isMobile() || !shell.classList.contains('sidebar-open')) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest('.dashboard-sidebar') || target.closest('.menu-toggle')) {
      return;
    }

    setOpen(false);
  });

  const syncByViewport = () => {
    if (!isMobile()) {
      setOpen(false);
    }

    syncBrandCondense();
  };

  renderBrand();
  renderMenu();
  bindMenuInteractions();
  window.addEventListener('resize', syncByViewport);
  syncActiveMenu();
  syncByViewport();
});
