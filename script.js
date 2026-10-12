/* Osama Jamal portfolio, version 2: the motion engine.
   build.py writes the page and the data in #site-data; this file animates it. */
(() => {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const root = document.documentElement;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    let DATA = {};
    try { DATA = JSON.parse($('#site-data').textContent); } catch (e) { DATA = {}; }
    const EMAIL = DATA.email || 'osamajamal0868@gmail.com';

    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
    };

    const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
    const darkMQ = matchMedia('(prefers-color-scheme: dark)');
    const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
    const ACCENTS = ['kigali', 'aurora', 'ember', 'jade'];

    let mode = store.get('oj-mode', 'dark');       // light | dark | system
    let accent = store.get('oj-accent', 'kigali');
    let fx = store.get('oj-fx', 'on') === 'on';
    const effectsOn = () => fx && !reduceMQ.matches;

    let netRGB = '0,161,222';
    let netRGB2 = '250,204,21';
    let netRefresh = () => {};
    const scrollHooks = [];

    /* =====================================================
       Theme, accent and effects
       ===================================================== */
    const themeMeta = $('meta[name="theme-color"]');
    const resolved = () => (mode === 'system' ? (darkMQ.matches ? 'dark' : 'light') : mode);

    function readAccent() {
        const cs = getComputedStyle(root);
        const a = cs.getPropertyValue('--a1').trim().split(/\s+/).join(',');
        const b = cs.getPropertyValue('--a2').trim().split(/\s+/).join(',');
        if (a) netRGB = a;
        if (b) netRGB2 = b;
    }

    function applyTheme() {
        const theme = resolved();
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-accent', accent);
        if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#070b14' : '#f4f7fb');
        $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
        $$('.swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.accent === accent)));
        readAccent();
    }

    function applyFx() {
        root.classList.toggle('no-fx', !effectsOn());
        const sw = $('#fxSwitch');
        if (sw) sw.setAttribute('aria-checked', String(fx));
        netRefresh();
    }

    // Changes the mode with a circular wipe from `origin` where the browser supports it.
    function setMode(next, origin) {
        const change = () => { mode = next; store.set('oj-mode', mode); applyTheme(); };
        if (origin && document.startViewTransition && effectsOn()) {
            const t = document.startViewTransition(change);
            t.ready.then(() => {
                const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
                root.animate(
                    { clipPath: ['circle(0px at ' + origin.x + 'px ' + origin.y + 'px)', 'circle(' + r + 'px at ' + origin.x + 'px ' + origin.y + 'px)'] },
                    { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
                );
            }).catch(() => {});
        } else {
            change();
        }
    }

    function setAccent(next) {
        accent = next;
        store.set('oj-accent', accent);
        applyTheme();
    }

    function setFx(on) {
        fx = on;
        store.set('oj-fx', fx ? 'on' : 'off');
        applyFx();
    }

    $('#themeToggle').addEventListener('click', e => {
        const r = e.currentTarget.getBoundingClientRect();
        setMode(resolved() === 'dark' ? 'light' : 'dark', { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
    $$('.seg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, null)));
    $$('.swatch').forEach(b => b.addEventListener('click', () => setAccent(b.dataset.accent)));
    $('#fxSwitch').addEventListener('click', () => setFx(!fx));

    if (darkMQ.addEventListener) darkMQ.addEventListener('change', () => { if (mode === 'system') applyTheme(); });
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', applyFx);

    /* =====================================================
       Settings panel and mobile menu
       ===================================================== */
    const panel = $('#settingsPanel');
    const sBtn = $('#settingsToggle');
    const header = $('#header');
    const menuBtn = $('#menuBtn');

    function setPanel(open) {
        panel.classList.toggle('open', open);
        panel.setAttribute('aria-hidden', String(!open));
        sBtn.setAttribute('aria-expanded', String(open));
    }
    function closeMenu() {
        header.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Open menu');
    }

    sBtn.addEventListener('click', e => { e.stopPropagation(); setPanel(!panel.classList.contains('open')); });
    document.addEventListener('click', e => { if (!panel.contains(e.target)) setPanel(false); });

    menuBtn.addEventListener('click', () => {
        const open = header.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('.nav-link').forEach(a => a.addEventListener('click', closeMenu));

    /* =====================================================
       Boot intro (plays once per visit)
       ===================================================== */
    const bootEl = $('#boot');

    function runBoot() {
        return new Promise(resolve => {
            const linesEl = $('#bootLines');
            const bar = $('#bootBar');
            const skip = $('#bootSkip');
            const script = [
                ['cmd', 'python build.py'],
                ['out', 'reading content.py'],
                ['out', 'writing index.html'],
                ['cmd', 'java Portfolio'],
                ['out', 'loading projects, skills, education'],
                ['out', 'starting the motion engine']
            ];
            const timers = [];
            let finished = false;
            try { sessionStorage.setItem('oj-booted', '1'); } catch (e) { /* ignore */ }

            const finish = () => {
                if (finished) return;
                finished = true;
                timers.forEach(clearTimeout);
                bootEl.classList.add('open');
                setTimeout(() => { bootEl.remove(); resolve(); }, 980);
            };

            script.forEach(([kind, text], i) => {
                timers.push(setTimeout(() => {
                    const d = document.createElement('div');
                    d.className = 'bl ' + kind;
                    d.textContent = (kind === 'cmd' ? '$ ' : '  ') + text;
                    linesEl.appendChild(d);
                    bar.style.width = Math.round(((i + 1) / script.length) * 100) + '%';
                }, 250 + i * 320));
            });
            timers.push(setTimeout(finish, 250 + script.length * 320 + 400));

            skip.addEventListener('click', finish);
            window.addEventListener('keydown', finish, { once: true });
        });
    }

    /* =====================================================
       Reveal on scroll
       ===================================================== */
    function startReveals() {
        const els = $$('.reveal');
        if (!('IntersectionObserver' in window) || reduceMQ.matches) {
            els.forEach(el => el.classList.add('in'));
            return;
        }
        $$('.hero-copy').forEach(group => {
            $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', (i * 0.09) + 's'));
        });
        const io = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        els.forEach(el => io.observe(el));
    }

    /* =====================================================
       Hero: decoded role line, kinetic letters
       ===================================================== */
    function decodeRole() {
        const el = $('#heroRole');
        if (!el || !effectsOn()) return;
        const finalText = el.textContent.trim();
        const glyphs = '01<>/{}[]=+*#%&$';
        const dur = 1100;
        const start = performance.now();
        el.setAttribute('aria-label', finalText);
        const tick = now => {
            const p = clamp((now - start) / dur);
            const settled = Math.floor(p * finalText.length);
            let out = '';
            for (let i = 0; i < finalText.length; i++) {
                const c = finalText[i];
                out += (i < settled || c === ' ') ? c : glyphs[Math.floor(Math.random() * glyphs.length)];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(tick); else el.textContent = finalText;
        };
        setTimeout(() => requestAnimationFrame(tick), 450);
    }

    const heroEl = $('#home');
    const letters = $$('.hero-name .ch');
    if (heroEl && letters.length && fineMQ.matches) {
        let px = -1e4, py = -1e4, raf = 0, cache = [];
        const measure = () => {
            cache = letters.map(el => {
                const r = el.getBoundingClientRect();
                return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY, k: 0 };
            });
        };
        // Measure once the name has settled, and again if the window or scroll position changes.
        setTimeout(measure, 2500);
        addEventListener('resize', () => setTimeout(measure, 200));
        const update = () => {
            raf = 0;
            const on = effectsOn();
            if (!cache.length) measure();
            cache.forEach(c => {
                const k = on ? Math.round(clamp(1 - Math.hypot(px - c.x, py + scrollY - c.y) / 240) * 20) / 20 : 0;
                if (k === c.k) return;
                c.k = k;
                c.el.style.fontVariationSettings = '"wght" ' + Math.round(600 + 160 * k);
                c.el.style.scale = (1 + 0.06 * k).toFixed(3);
            });
        };
        heroEl.addEventListener('pointermove', e => {
            px = e.clientX; py = e.clientY;
            if (!raf) raf = requestAnimationFrame(update);
        }, { passive: true });
        heroEl.addEventListener('pointerleave', () => {
            px = py = -1e4;
            if (!raf) raf = requestAnimationFrame(update);
        });
    }

    /* =====================================================
       Hero code card (Java and Python)
       ===================================================== */
    const codeEl = $('#codeEl');
    const tabs = $$('.code-tab');
    let currentLang = 'java';
    let userPicked = false;

    function renderCode(lang) {
        const lines = (DATA.code && DATA.code[lang]) || [];
        currentLang = lang;
        codeEl.innerHTML = lines.map((line, i) => {
            const caret = i === lines.length - 1 ? '<span class="caret"></span>' : '';
            return '<span class="ln" style="--i:' + i + '">' + line + caret + '</span>';
        }).join('');
        tabs.forEach(t => {
            const on = t.dataset.lang === lang;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', String(on));
        });
    }
    tabs.forEach(t => t.addEventListener('click', () => {
        userPicked = true;
        if (t.dataset.lang !== currentLang) renderCode(t.dataset.lang);
    }));
    renderCode('java');
    setInterval(() => {
        if (!userPicked && !document.hidden && effectsOn()) renderCode(currentLang === 'java' ? 'python' : 'java');
    }, 7000);

    /* =====================================================
       Hero background: a small neural network with signals
       ===================================================== */
    const canvas = $('#net');
    if (canvas && heroEl) {
        const ctx = canvas.getContext('2d');
        const LAYER_SIZES = [3, 5, 6, 5, 4, 2];
        let W = 1, H = 1, dpr = 1, raf = 0, visible = true;
        let layers = [], edges = [], signals = [];
        const mouse = { x: -1e4, y: -1e4 };

        const build = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            const r = heroEl.getBoundingClientRect();
            W = Math.max(1, Math.floor(r.width * dpr));
            H = Math.max(1, Math.floor(r.height * dpr));
            canvas.width = W;
            canvas.height = H;
            const narrow = r.width < 760;
            const cols = narrow ? 4 : 6;
            const x0 = W * (narrow ? 0.06 : 0.42);
            const x1 = W * 0.96;
            layers = []; edges = []; signals = [];
            for (let c = 0; c < cols; c++) {
                const n = LAYER_SIZES[c % LAYER_SIZES.length];
                const x = x0 + ((x1 - x0) * c) / (cols - 1);
                const layer = [];
                for (let k = 0; k < n; k++) {
                    const y = H * 0.14 + (H * 0.72 * k) / Math.max(1, n - 1);
                    layer.push({ x, y, bx: x, by: y, ph: Math.random() * 6.28, glow: 0, r: (3.2 + Math.random() * 1.6) * dpr, out: [] });
                }
                layers.push(layer);
            }
            for (let c = 0; c < cols - 1; c++) {
                for (const a of layers[c]) {
                    for (const b of layers[c + 1]) {
                        const e = { a, b };
                        edges.push(e);
                        a.out.push(e);
                    }
                }
            }
        };

        const draw = now => {
            ctx.clearRect(0, 0, W, H);
            const light = root.getAttribute('data-theme') === 'light';
            const alpha = light ? 0.6 : 0.9;
            const R = 170 * dpr;
            const time = now / 1000;

            for (const L of layers) {
                for (const n of L) {
                    n.x = n.bx + Math.sin(time * 0.6 + n.ph) * 6 * dpr;
                    n.y = n.by + Math.cos(time * 0.5 + n.ph * 1.3) * 8 * dpr;
                    n.glow *= 0.94;
                }
            }

            ctx.lineWidth = dpr;
            for (const e of edges) {
                const d = Math.hypot((e.a.x + e.b.x) / 2 - mouse.x, (e.a.y + e.b.y) / 2 - mouse.y);
                const near = clamp(1 - d / R);
                ctx.strokeStyle = 'rgba(' + netRGB + ',' + ((0.09 + 0.4 * near) * alpha).toFixed(3) + ')';
                ctx.beginPath();
                ctx.moveTo(e.a.x, e.a.y);
                ctx.lineTo(e.b.x, e.b.y);
                ctx.stroke();
            }

            if (effectsOn() && signals.length < 18 && edges.length && Math.random() < 0.09) {
                signals.push({ e: edges[(Math.random() * edges.length) | 0], p: 0, sp: 0.006 + Math.random() * 0.008 });
            }
            for (let i = signals.length - 1; i >= 0; i--) {
                const s = signals[i];
                s.p += s.sp;
                if (s.p >= 1) {
                    s.e.b.glow = 1;
                    if (s.e.b.out.length) { s.e = s.e.b.out[(Math.random() * s.e.b.out.length) | 0]; s.p = 0; }
                    else { signals.splice(i, 1); }
                    continue;
                }
                const x = lerp(s.e.a.x, s.e.b.x, s.p);
                const y = lerp(s.e.a.y, s.e.b.y, s.p);
                ctx.fillStyle = 'rgba(' + netRGB2 + ',' + (0.18 * alpha).toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(x, y, 8 * dpr, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(' + netRGB2 + ',' + alpha + ')';
                ctx.beginPath();
                ctx.arc(x, y, 3 * dpr, 0, Math.PI * 2);
                ctx.fill();
            }

            for (const L of layers) {
                for (const n of L) {
                    const near = clamp(1 - Math.hypot(n.x - mouse.x, n.y - mouse.y) / R);
                    const rad = n.r * (1 + near * 1.2 + n.glow * 0.8);
                    ctx.fillStyle = 'rgba(' + netRGB + ',' + clamp((0.35 + 0.5 * near + 0.4 * n.glow) * alpha).toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
                    ctx.fill();
                    if (n.glow > 0.05) {
                        ctx.strokeStyle = 'rgba(' + netRGB2 + ',' + (n.glow * 0.6 * alpha).toFixed(3) + ')';
                        ctx.beginPath();
                        ctx.arc(n.x, n.y, rad + 5 * dpr * (1 - n.glow), 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
            }
        };

        const loop = now => { draw(now); raf = requestAnimationFrame(loop); };
        const stop = () => { cancelAnimationFrame(raf); raf = 0; };
        const start = () => { if (!raf && effectsOn() && visible && !document.hidden) raf = requestAnimationFrame(loop); };

        netRefresh = () => {
            stop();
            build();
            if (effectsOn()) start(); else draw(0); // one still frame when motion is off
        };

        heroEl.addEventListener('pointermove', e => {
            const r = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - r.left) * dpr;
            mouse.y = (e.clientY - r.top) * dpr;
        }, { passive: true });
        heroEl.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(es => {
                visible = es[0].isIntersecting;
                if (visible) start(); else stop();
            }).observe(heroEl);
        }
        document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    }

    /* =====================================================
       Marquee strips: speed and skew follow the scroll
       ===================================================== */
    const marqEls = $$('.marq');
    const marqs = marqEls.map((el, i) => ({ el, track: $('.marq-track', el), dir: i % 2 ? 1 : -1, x: 0, w: 1 }));
    let marqVisible = false, marqRaf = 0, lastY = window.scrollY, vel = 0;

    const marqMeasure = () => marqs.forEach(m => {
        const unit = m.track.firstElementChild;
        m.w = unit ? unit.getBoundingClientRect().width : 1;
        m.x = m.dir < 0 ? 0 : -m.w;
    });
    const marqLoop = () => {
        const y = window.scrollY;
        vel = lerp(vel, y - lastY, 0.12);
        lastY = y;
        const flip = vel < -0.5 ? -1 : 1;
        const speed = 0.7 + Math.min(Math.abs(vel) * 0.35, 14);
        const skew = clamp(vel * -0.3, -8, 8);
        marqs.forEach(m => {
            m.x += m.dir * speed * flip;
            if (m.x <= -m.w) m.x += m.w;
            if (m.x > 0) m.x -= m.w;
            m.track.style.transform = 'translate3d(' + m.x.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
        });
        marqRaf = requestAnimationFrame(marqLoop);
    };
    const marqStart = () => { if (!marqRaf && marqVisible && effectsOn() && !document.hidden) marqRaf = requestAnimationFrame(marqLoop); };
    const marqStop = () => { cancelAnimationFrame(marqRaf); marqRaf = 0; };

    const marqSection = $('.marquee');
    if (marqSection && 'IntersectionObserver' in window) {
        new IntersectionObserver(es => {
            marqVisible = es[0].isIntersecting;
            if (marqVisible) marqStart(); else marqStop();
        }).observe(marqSection);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) marqStop(); else marqStart(); });

    /* =====================================================
       Scroll-driven pieces
       ===================================================== */
    // About: words light up as you scroll
    const stmt = $('#statement');
    const stmtWords = stmt ? $$('.w', stmt) : [];
    scrollHooks.push(() => {
        if (!stmtWords.length) return;
        if (reduceMQ.matches) { stmtWords.forEach(w => { w.style.opacity = 1; }); return; }
        const r = stmt.getBoundingClientRect();
        const p = clamp((innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.4));
        const active = p * (stmtWords.length + 3);
        stmtWords.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(active - i)).toFixed(3); });
    });

    // Education: the line draws itself, dots light up
    const timeline = $('.timeline');
    const tItems = $$('.t-item');
    scrollHooks.push(() => {
        if (!timeline) return;
        if (reduceMQ.matches) {
            timeline.style.setProperty('--p', 1);
            tItems.forEach(it => it.classList.add('on'));
            return;
        }
        const r = timeline.getBoundingClientRect();
        timeline.style.setProperty('--p', clamp((innerHeight * 0.62 - r.top) / r.height).toFixed(3));
        tItems.forEach(it => it.classList.toggle('on', it.getBoundingClientRect().top < innerHeight * 0.62));
    });

    // Footer: the big name fills in
    const bigName = $('#bigName');
    scrollHooks.push(() => {
        if (!bigName) return;
        const r = bigName.getBoundingClientRect();
        bigName.style.setProperty('--p', reduceMQ.matches ? 1 : clamp((innerHeight - r.top) / (r.height + innerHeight * 0.25)).toFixed(3));
    });

    // Projects: pinned horizontal gallery
    const hs = $('[data-hscroll]');
    if (hs) {
        const track = $('.hscroll-track', hs);
        const barEl = $('.hprogress span', hs);
        const countEl = $('#hcount', hs);
        const projectPanels = $$('.panel:not(.panel-end)', hs);
        const allPanels = $$('.panel', hs);
        let dist = 0, pinned = false;

        const layout = () => {
            const wide = innerWidth > 900 && !reduceMQ.matches;
            pinned = wide;
            hs.classList.toggle('static', !wide);
            if (!wide) {
                hs.style.height = '';
                track.style.transform = '';
                allPanels.forEach(p => p.style.removeProperty('--px'));
                return;
            }
            dist = Math.max(0, track.scrollWidth - innerWidth);
            hs.style.height = (dist + innerHeight) + 'px';
        };
        const update = () => {
            if (!pinned) return;
            const r = hs.getBoundingClientRect();
            const span = Math.max(1, r.height - innerHeight);
            const p = clamp(-r.top / span);
            track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
            if (barEl) barEl.style.transform = 'scaleX(' + p.toFixed(3) + ')';
            if (countEl) countEl.textContent = (Math.min(projectPanels.length, Math.round(p * (projectPanels.length - 1)) + 1)) + ' / ' + projectPanels.length;
            allPanels.forEach(panelEl => {
                const pr = panelEl.getBoundingClientRect();
                panelEl.style.setProperty('--px', ((pr.left + pr.width / 2 - innerWidth / 2) / innerWidth).toFixed(3));
            });
        };
        scrollHooks.push(update);
        layout();
        window.addEventListener('load', () => { layout(); update(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); update(); });
        let hsResize;
        window.addEventListener('resize', () => { clearTimeout(hsResize); hsResize = setTimeout(() => { layout(); update(); }, 150); });
    }

    // Header, progress bar and the scroll hooks above
    const progressBar = $('#progress');
    let ticking = false;
    function onScroll() {
        ticking = false;
        const y = window.scrollY;
        header.classList.toggle('scrolled', y > 12);
        const h = document.documentElement.scrollHeight - innerHeight;
        progressBar.style.transform = 'scaleX(' + (h > 0 ? clamp(y / h) : 0) + ')';
        scrollHooks.forEach(fn => fn());
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { marqMeasure(); netRefresh(); onScroll(); }, 200);
    });

    // Active section in the nav and the side dots
    const navLinks = $$('.nav-link, .dot-link');
    const sections = $$('main > section[id]');
    if ('IntersectionObserver' in window) {
        const so = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => so.observe(s));
    }

    /* =====================================================
       Pointer effects: magnetic buttons, tilt, spotlight, cursor
       ===================================================== */
    if (fineMQ.matches) {
        $$('.magnetic').forEach(el => {
            el.addEventListener('pointermove', e => {
                if (!effectsOn()) return;
                const r = el.getBoundingClientRect();
                const x = e.clientX - (r.left + r.width / 2);
                const y = e.clientY - (r.top + r.height / 2);
                el.style.transform = 'translate(' + (x * 0.22) + 'px,' + (y * 0.3) + 'px)';
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });
    }

    $$('[data-tilt]').forEach(el => {
        const max = parseFloat(el.dataset.tilt) || 4;
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            el.style.setProperty('--mx', (px * 100) + '%');
            el.style.setProperty('--my', (py * 100) + '%');
            if (fineMQ.matches && effectsOn()) {
                el.style.setProperty('--rx', ((0.5 - py) * max) + 'deg');
                el.style.setProperty('--ry', ((px - 0.5) * max) + 'deg');
            }
        });
        el.addEventListener('pointerleave', () => {
            el.style.setProperty('--rx', '0deg');
            el.style.setProperty('--ry', '0deg');
        });
    });

    const glow = $('#glow');
    const ring = $('#cursorRing');
    const dot = $('#cursorDot');
    if (fineMQ.matches && (glow || ring)) {
        let tx = innerWidth / 2, ty = innerHeight / 2;
        let gx = tx, gy = ty, rx = tx, ry = ty, running = false;
        const step = () => {
            gx = lerp(gx, tx, 0.1); gy = lerp(gy, ty, 0.1);
            rx = lerp(rx, tx, 0.2); ry = lerp(ry, ty, 0.2);
            if (glow) glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0) translate(-50%,-50%)';
            if (ring) ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
            const moving = Math.abs(tx - gx) + Math.abs(ty - gy) + Math.abs(tx - rx) + Math.abs(ty - ry) > 1;
            if (moving && effectsOn()) requestAnimationFrame(step); else running = false;
        };
        window.addEventListener('pointermove', e => {
            tx = e.clientX; ty = e.clientY;
            if (glow) glow.classList.add('on');
            if (ring) ring.classList.add('on');
            if (dot) { dot.classList.add('on'); dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)'; }
            if (!running && effectsOn()) { running = true; requestAnimationFrame(step); }
        }, { passive: true });
        document.addEventListener('pointerover', e => {
            if (!ring || !e.target.closest) return;
            ring.classList.toggle('hot', !!e.target.closest('a, button, input, textarea, .skill, [role="tab"]'));
        });
    }

    /* =====================================================
       Sparkles, copy email, contact form
       ===================================================== */
    function burst(x, y) {
        if (reduceMQ.matches || !document.body.animate) return;
        for (let i = 0; i < 18; i++) {
            const s = document.createElement('i');
            s.className = 'spark';
            s.style.left = x + 'px';
            s.style.top = y + 'px';
            const a = Math.random() * Math.PI * 2;
            const d = 50 + Math.random() * 70;
            const anim = s.animate([
                { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                { transform: 'translate(calc(-50% + ' + Math.cos(a) * d + 'px), calc(-50% + ' + Math.sin(a) * d + 'px)) scale(0)', opacity: 0 }
            ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
            anim.onfinish = () => s.remove();
            document.body.appendChild(s);
        }
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                ta.remove();
                return ok;
            } catch (err) {
                return false;
            }
        }
    }

    const copyBtn = $('#copyEmail');
    const copyLabel = $('#copyLabel');
    const copyStatus = $('#copyStatus');
    let copyTimer;
    copyBtn.addEventListener('click', async () => {
        const ok = await copyText(EMAIL);
        if (ok) {
            const r = copyBtn.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2);
        }
        copyLabel.textContent = ok ? 'Email copied' : 'Copy failed. Use the address below';
        copyStatus.textContent = ok ? 'Email address copied to clipboard' : 'Could not copy the email address';
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => { copyLabel.textContent = 'Copy email'; }, 2400);
    });

    const form = $('#contactForm');
    const note = $('#formNote');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const f = new FormData(form);
        const name = String(f.get('name') || '').trim();
        const from = String(f.get('email') || '').trim();
        const subject = String(f.get('subject') || '').trim() || 'Hello from your portfolio';
        const message = String(f.get('message') || '').trim();
        const body = message + '\n\n' + name + (from ? ' (' + from + ')' : '');
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        note.textContent = 'Opening your email app. If nothing opens, write to ' + EMAIL + '.';
    });

    /* =====================================================
       Terminal
       ===================================================== */
    const term = $('#term');
    const termOut = $('#termOut');
    const termInput = $('#termInput');
    const termForm = $('#termForm');
    const termBtn = $('#termToggle');
    const termHistory = [];
    let histIndex = 0;
    let greeted = false;

    const print = (text, cls) => {
        const d = document.createElement('div');
        d.className = 'tl' + (cls ? ' ' + cls : '');
        d.textContent = text;
        termOut.appendChild(d);
        termOut.scrollTop = termOut.scrollHeight;
    };
    const printAll = (lines, cls) => lines.forEach(l => print(l, cls));

    function openTerm() {
        term.classList.add('open');
        term.setAttribute('aria-hidden', 'false');
        termBtn.setAttribute('aria-expanded', 'true');
        if (!greeted) {
            greeted = true;
            printAll(['Welcome. This terminal knows everything on this page.', 'Type help to see what it can do.', ''], 'dim');
        }
        setTimeout(() => termInput.focus(), 50);
    }
    function closeTerm() {
        const hadFocus = term.contains(document.activeElement);
        term.classList.remove('open');
        term.setAttribute('aria-hidden', 'true');
        termBtn.setAttribute('aria-expanded', 'false');
        if (hadFocus) termBtn.focus();
    }
    const toggleTerm = () => (term.classList.contains('open') ? closeTerm() : openTerm());

    const projectsList = () => DATA.projects || [];
    const findProject = key => {
        const list = projectsList();
        const n = parseInt(key, 10);
        if (!Number.isNaN(n) && list[n - 1]) return list[n - 1];
        return list.find(p => p.slug === key || p.title.toLowerCase() === key);
    };

    const COMMANDS = {
        help() {
            return [
                'Commands:',
                '  about              who I am',
                '  skills             what I work with',
                '  projects           things I have built',
                '  open <number>      open a project',
                '  education          where I study and learn',
                '  contact            how to reach me',
                '  java               the Java snippet',
                '  python             the Python snippet',
                '  theme <light|dark|auto>',
                '  accent <kigali|aurora|ember|jade>',
                '  fx <on|off>        animated effects',
                '  clear              clear the screen',
                '  sudo hire osama    try it'
            ];
        },
        about() { return [DATA.name, DATA.role, DATA.location + '. ' + DATA.status + '.']; },
        whoami() { return ['a visitor who found the terminal. Nice.']; },
        skills() {
            return (DATA.skills || []).map(g => g.group.padEnd(14) + g.items.join(', '));
        },
        projects() {
            const out = projectsList().map((p, i) => (i + 1) + '. ' + p.title + '\n   ' + p.blurb);
            out.push('', 'Type open 1, open 2 or open 3 to visit one.');
            return out;
        },
        education() {
            return (DATA.education || []).map(e => e.title + ', ' + e.place + '\n   ' + e.text);
        },
        contact() { return ['Email     ' + DATA.email, 'GitHub    ' + DATA.github, 'LinkedIn  ' + DATA.linkedin]; },
        java() { return (DATA.plain && DATA.plain.java) || []; },
        python() { return (DATA.plain && DATA.plain.python) || []; },
        clear() { termOut.textContent = ''; return []; },
        ls() { return ['about  skills  projects  education  contact']; },
        open(arg) {
            const p = findProject((arg || '').toLowerCase());
            if (!p) return { err: 'No project "' + (arg || '') + '". Type projects to see the list.' };
            window.open(p.url, '_blank', 'noopener');
            return { ok: 'Opening ' + p.title + '...' };
        },
        theme(arg) {
            const map = { light: 'light', dark: 'dark', auto: 'system', system: 'system' };
            if (!map[arg]) return { err: 'Usage: theme light, theme dark or theme auto' };
            setMode(map[arg], null);
            return { ok: 'Theme set to ' + arg + '.' };
        },
        accent(arg) {
            if (!ACCENTS.includes(arg)) return { err: 'Usage: accent ' + ACCENTS.join(', ') };
            setAccent(arg);
            return { ok: 'Accent set to ' + arg + '.' };
        },
        fx(arg) {
            if (arg !== 'on' && arg !== 'off') return { err: 'Usage: fx on or fx off' };
            setFx(arg === 'on');
            return { ok: 'Animated effects ' + arg + '.' };
        },
        sudo(arg) {
            if (arg !== 'hire osama') return { err: 'sudo: nice try. Did you mean: sudo hire osama' };
            const r = term.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2);
            setTimeout(() => { window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Let us talk'); }, 700);
            return { ok: 'Permission granted. Opening your email app...' };
        }
    };

    function runCommand(raw) {
        const line = raw.trim();
        if (!line) return;
        termHistory.push(line);
        histIndex = termHistory.length;
        print(line, 'cmd');
        const parts = line.split(/\s+/);
        const name = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ').toLowerCase();
        const fn = COMMANDS[name];
        if (!fn) { print('command not found: ' + name + '. Type help.', 'err'); return; }
        const result = fn(arg);
        if (Array.isArray(result)) printAll(result);
        else if (result && result.err) print(result.err, 'err');
        else if (result && result.ok) print(result.ok, 'ok');
    }

    termForm.addEventListener('submit', e => {
        e.preventDefault();
        const v = termInput.value;
        termInput.value = '';
        runCommand(v);
    });
    termInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIndex > 0) { histIndex--; termInput.value = termHistory[histIndex] || ''; }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIndex < termHistory.length - 1) { histIndex++; termInput.value = termHistory[histIndex]; }
            else { histIndex = termHistory.length; termInput.value = ''; }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const v = termInput.value.trim().toLowerCase();
            if (v && !v.includes(' ')) {
                const match = Object.keys(COMMANDS).find(c => c.startsWith(v));
                if (match) termInput.value = match + ' ';
            }
        }
    });

    termBtn.addEventListener('click', toggleTerm);
    $('#termClose').addEventListener('click', closeTerm);
    const hint = $('#hintTerm');
    if (hint) hint.addEventListener('click', openTerm);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { setPanel(false); closeMenu(); if (term.classList.contains('open')) closeTerm(); return; }
        const t = e.target;
        const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
        if (e.key === '`' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); toggleTerm(); }
    });

    /* =====================================================
       Start
       ===================================================== */
    function ready() {
        root.classList.add('ready');
        startReveals();
        decodeRole();
        onScroll();
    }

    applyTheme();
    applyFx();
    marqMeasure();
    window.addEventListener('load', () => { marqMeasure(); netRefresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(marqMeasure);

    if (bootEl && !root.classList.contains('no-boot') && effectsOn()) {
        runBoot().then(ready);
    } else {
        if (bootEl) bootEl.remove();
        ready();
    }

    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
