(() => {
    const bootstrap = document.currentScript;
    const root = document.documentElement;
    const versionKey = 'nobody-lab-version';
    const themeKey = 'nobody-lab-theme';
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let storage;
    try {
        storage = window.localStorage;
    } catch {
        // Some browser privacy settings deny access to localStorage.
    }

    function read(key) {
        try {
            return storage?.getItem(key);
        } catch {
            return null;
        }
    }

    function save(key, value) {
        try {
            storage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    const getVersion = () => read(versionKey) === 'v2' ? 'v2' : 'v3';
    function getTheme() {
        const stored = read(themeKey);
        return stored === 'light' || stored === 'dark' ? stored : null;
    }

    const version = getVersion();
    const apple = version === 'v2';
    const variantStyle = document.createElement('link');
    variantStyle.rel = 'stylesheet';
    variantStyle.href = apple ? bootstrap.dataset.appleStyle : bootstrap.dataset.acidStyle;
    variantStyle.id = 'variant-style';
    bootstrap.after(variantStyle);
    root.dataset.uiVersion = version;

    let themePreference = getTheme();
    let themeToggle;
    function applyTheme() {
        const theme = themePreference ?? (systemTheme.matches ? 'light' : 'dark');
        root.dataset.theme = theme;
        themeToggle?.setAttribute('aria-pressed', String(theme === 'light'));
    }
    applyTheme();

    function initializeControls() {
        themeToggle = document.getElementById('themeToggle');
        themeToggle.disabled = false;
        applyTheme();
        themeToggle.addEventListener('click', () => {
            themePreference = root.dataset.theme === 'light' ? 'dark' : 'light';
            save(themeKey, themePreference);
            applyTheme();
            if (!reducedMotion.matches) {
                themeToggle.classList.add('rotating');
                setTimeout(() => themeToggle.classList.remove('rotating'), 400);
            }
        });
        systemTheme.addEventListener('change', applyTheme);
        document.addEventListener('keydown', event => {
            if (event.key.toLowerCase() === 't' && !event.repeat &&
                !event.ctrlKey && !event.metaKey && !event.altKey &&
                !event.target.closest?.('input, textarea, select, [contenteditable]')) {
                themeToggle.click();
            }
        });

        const versionToggle = document.getElementById('versionToggle');
        document.getElementById('versionSwitchContainer').classList.toggle('version-v3-active', !apple);
        versionToggle.setAttribute('aria-pressed', String(!apple));
        function disableVersionSwitch() {
            versionToggle.disabled = true;
            versionToggle.title = '浏览器存储不可用';
        }
        if (storage) versionToggle.disabled = false;
        else disableVersionSwitch();
        versionToggle.addEventListener('click', () => {
            if (save(versionKey, apple ? 'v3' : 'v2')) location.reload();
            else disableVersionSwitch();
        });

        function synchronize() {
            if (version !== getVersion()) {
                location.reload();
                return;
            }
            themePreference = getTheme();
            applyTheme();
        }
        window.addEventListener('pageshow', event => {
            if (event.persisted) synchronize();
        });
        window.addEventListener('storage', event => {
            if (event.storageArea === storage && [null, themeKey, versionKey].includes(event.key)) synchronize();
        });
    }

    function initializeArchive() {
        const archive = document.querySelector('[data-article-archive]');
        if (!archive) return;
        const filters = archive.querySelector('.archive-filters');
        const tree = archive.querySelector('#articlesTree');
        if (!filters || !tree) return;

        const cards = [...archive.querySelectorAll('.article-card-waterfall')];
        const empty = archive.querySelector('[data-filter-empty]');
        filters.addEventListener('click', event => {
            const button = event.target.closest('.filter-pill');
            if (!button) return;
            for (const filter of filters.querySelectorAll('.filter-pill')) {
                filter.classList.toggle('active', filter === button);
                filter.setAttribute('aria-pressed', String(filter === button));
            }
            cards.forEach(card => {
                card.hidden = button.dataset.filter !== 'all' &&
                    !card.dataset.category.split(' ').includes(button.dataset.filter);
            });
            empty.hidden = cards.some(card => !card.hidden);
        });
        filters.hidden = false;

        let active;
        let pinned = false;
        function open(category) {
            if (active) {
                active.button.setAttribute('aria-expanded', 'false');
                active.panel.hidden = true;
            }
            active = category;
            pinned = false;
            if (active) {
                active.button.setAttribute('aria-expanded', 'true');
                active.panel.hidden = false;
            }
        }

        for (const group of tree.querySelectorAll('.tree-category')) {
            const button = group.querySelector('.tree-tag-btn');
            const panel = document.getElementById(button.getAttribute('aria-controls'));
            const category = { button, panel };
            group.addEventListener('pointerenter', event => {
                if (event.pointerType === 'mouse' && !pinned && active !== category &&
                    !active?.panel.contains(document.activeElement)) open(category);
            });
            group.addEventListener('pointerleave', () => {
                if (active === category && !pinned && !group.contains(document.activeElement)) open(null);
            });
            group.addEventListener('focusout', event => {
                if (active === category && !pinned && !group.contains(event.relatedTarget) && !group.matches(':hover')) open(null);
            });
            button.addEventListener('click', () => {
                if (active === category && pinned) open(null);
                else {
                    if (active !== category) open(category);
                    pinned = true;
                }
            });
        }
        tree.addEventListener('keydown', event => {
            if (event.key === 'Escape' && active) {
                event.preventDefault();
                active.button.focus();
                open(null);
            }
        });
        document.addEventListener('click', event => {
            if (active && !tree.contains(event.target)) open(null);
        });
        tree.hidden = false;
    }

    function initializeProjects() {
        const buttons = [...document.querySelectorAll('.project-tag-btn')];
        if (!buttons.length) return;
        const panels = document.querySelectorAll('.project-default-panel, .project-category-panel');
        const overlay = document.getElementById('circleRevealOverlay');
        let current = null;
        let revealing = false;

        function show(button) {
            const selectedPanel = button?.getAttribute('aria-controls') ?? 'panel-default';
            for (const panel of panels) {
                panel.classList.toggle('active', panel.id === selectedPanel);
                panel.setAttribute('aria-hidden', String(panel.id !== selectedPanel));
            }
            for (const tag of buttons) {
                tag.classList.toggle('tag-active', tag === button);
                tag.setAttribute('aria-pressed', String(tag === button));
            }
            current = button;
        }

        for (const button of buttons) {
            button.disabled = false;
            button.addEventListener('click', () => {
                if (revealing) return;
                const next = current === button ? null : button;
                if (!overlay || reducedMotion.matches) {
                    show(next);
                    return;
                }
                revealing = true;
                const rect = button.getBoundingClientRect();
                overlay.style.left = rect.left + rect.width / 2 + 'px';
                overlay.style.top = rect.top + rect.height / 2 + 'px';
                overlay.classList.add('expanding');
                setTimeout(() => {
                    show(next);
                    overlay.classList.replace('expanding', 'collapsing');
                    setTimeout(() => {
                        overlay.classList.remove('collapsing');
                        revealing = false;
                    }, 350);
                }, 250);
            });
        }
    }

    function initializeDecorations() {
        if (reducedMotion.matches) return;
        const particles = document.getElementById('particlesContainer');
        const count = window.matchMedia('(max-width: 768px)').matches ? 40 : 80;
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < count; index++) {
            const particle = document.createElement('div');
            particle.className = 'star-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.setProperty('--dur', (2 + Math.random() * 6) + 's');
            particle.style.setProperty('--delay', Math.random() * 5 + 's');
            fragment.append(particle);
        }
        particles.append(fragment);

        const counter = document.querySelector('.stat-num-glitch[data-target]');
        const total = Number(counter?.dataset.target);
        if (!total || !window.IntersectionObserver) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            const start = performance.now();
            function animate(now) {
                const progress = reducedMotion.matches ? 1 : Math.min(1, (now - start) / 600);
                counter.textContent = Math.floor(total * progress);
                if (progress < 1) requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        });
        observer.observe(counter);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initializeControls();
        initializeArchive();
        initializeProjects();
        initializeDecorations();

        const progress = document.getElementById('progress-bar');
        function updateProgress() {
            const distance = root.scrollHeight - window.innerHeight;
            const percent = distance > 0 ? Math.max(0, Math.min(100, window.scrollY / distance * 100)) : 0;
            progress.style.width = percent + '%';
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        window.addEventListener('pageshow', updateProgress);
        updateProgress();

        const variantScript = document.createElement('script');
        variantScript.src = apple ? bootstrap.dataset.appleScript : bootstrap.dataset.acidScript;
        variantScript.id = 'variant-script';
        document.body.append(variantScript);
    });
})();
