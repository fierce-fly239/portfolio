// Game-style effects for the portfolio. Everything here is extra: with JavaScript off,
// the page still shows all its content (the "js" class is never added).

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Scroll-in reveal ----------
const revealTargets = document.querySelectorAll(
    '.reveal, .job, .project-card, .skill-box, .stat-box, .timeline-item, .degree, .ticker, .achievement'
);

if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('in'));
} else {
    const revealer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // small stagger for items that sit side by side
    revealTargets.forEach((el) => {
        const siblings = Array.from(el.parentElement.children);
        el.style.transitionDelay = (Math.min(siblings.indexOf(el), 5) * 0.08) + 's';
        revealer.observe(el);
    });
}

// ---------- Name drops in letter by letter ----------
const letters = document.querySelectorAll('.hero-name .letter');
if (window.gsap && !reduceMotion) {
    gsap.fromTo(letters,
        { y: -160, opacity: 0, rotate: () => gsap.utils.random(-25, 25) },
        { y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.07, delay: 0.2 }
    );
    gsap.from(['.kicker', '.hero-sub', '.hero-buttons'], {
        y: 20, opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.9, ease: 'power2.out'
    });
} else {
    letters.forEach((l) => { l.style.opacity = 1; });
}

// ---------- Numbers count up from 0 ----------
function countUp(el) {
    const target = parseInt(el.textContent, 10);
    if (isNaN(target) || target === 0 || reduceMotion || !window.gsap) return;
    const counter = { n: 0 };
    gsap.to(counter, {
        n: target,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(counter.n); },
        onComplete: () => { el.textContent = target; }
    });
}

if ('IntersectionObserver' in window) {
    const counterWatcher = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                countUp(entry.target);
                counterWatcher.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-number').forEach((el) => counterWatcher.observe(el));
}

// ---------- XP bar fills as you scroll ----------
const xp = document.querySelector('.xp-bar span');
function updateXp() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    xp.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
}
window.addEventListener('scroll', updateXp, { passive: true });
updateXp();

// ---------- Mouse effects (mouse devices only) ----------
if (finePointer && !reduceMotion) {
    // glowing dot
    const dot = document.querySelector('.cursor-dot');
    window.addEventListener('mousemove', (e) => {
        dot.classList.add('on');
        dot.style.transform = 'translate(' + e.clientX + 'px, ' + e.clientY + 'px)';
    });
    document.addEventListener('mouseleave', () => dot.classList.remove('on'));
    document.querySelectorAll('a, button, summary, .project-card').forEach((el) => {
        el.addEventListener('mouseenter', () => dot.classList.add('big'));
        el.addEventListener('mouseleave', () => dot.classList.remove('big'));
    });

    // project cards tilt towards the mouse, with a shine that follows it
    document.querySelectorAll('.project-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const box = card.getBoundingClientRect();
            const x = (e.clientX - box.left) / box.width;
            const y = (e.clientY - box.top) / box.height;
            card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 12) + 'deg) rotateY(' + ((x - 0.5) * 14) + 'deg) translateY(-6px)';
            card.style.setProperty('--mx', (x * 100) + '%');
            card.style.setProperty('--my', (y * 100) + '%');
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ---------- 3D loop on the start screen ----------
function startLoop() {
    const canvas = document.getElementById('hero-canvas');
    if (!window.THREE || !canvas) return;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (err) {
        return; // no WebGL: the start screen simply has no 3D shape
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 11;

    // the loop: a knot drawn as glowing lines, with a cloud of dots around it
    const group = new THREE.Group();
    const knot = new THREE.TorusKnotGeometry(2.2, 0.55, 220, 18, 2, 3);
    group.add(new THREE.Mesh(knot, new THREE.MeshBasicMaterial({
        color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.22
    })));
    group.add(new THREE.Points(knot, new THREE.PointsMaterial({
        color: 0x7dd3fc, size: 0.035, transparent: true, opacity: 0.9
    })));

    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < positions.length; i++) {
        positions[i] = (Math.random() - 0.5) * 30;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0x94a3b8, size: 0.03, transparent: true, opacity: 0.6
    }));
    scene.add(stars);
    scene.add(group);

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // keep the knot a sensible size on narrow phones
        group.scale.setScalar(w < 600 ? 0.65 : 1);
    }
    window.addEventListener('resize', resize);
    resize();

    // the knot turns towards the mouse
    let targetX = 0;
    let targetY = 0;
    window.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 1.2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 1.2;
    });

    if (reduceMotion) {
        renderer.render(scene, camera); // one still frame
        return;
    }

    // only animate while the start screen is on screen
    let visible = true;
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; })
        .observe(canvas);

    function frame(time) {
        requestAnimationFrame(frame);
        if (!visible) return;
        const t = time * 0.001;
        group.rotation.y += (targetX + t * 0.25 - group.rotation.y) * 0.05;
        group.rotation.x += (targetY + Math.sin(t * 0.4) * 0.2 - group.rotation.x) * 0.05;
        stars.rotation.y = t * 0.02;
        renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
}
startLoop();

// ---------- Learning: semester tabs, and only one month open at a time ----------
(function learningTabs() {
    const wrap = document.querySelector('.timeline-sems');
    if (!wrap) return;
    const sems = Array.from(wrap.querySelectorAll('.timeline-sem'));

    // each month shows how many subjects it covers
    wrap.querySelectorAll('details.timeline-item').forEach((month) => {
        const n = month.querySelectorAll('.subjects > li').length;
        const summary = month.querySelector('summary');
        if (n && summary && !summary.querySelector('.month-count')) {
            const count = document.createElement('span');
            count.className = 'month-count';
            count.textContent = n + (n === 1 ? ' subject' : ' subjects');
            summary.appendChild(count);
        }
        // The HTML's name attribute keeps one month open even without JavaScript. Here we take
        // over so the months can slide open and shut, so the instant browser version is removed.
        month.removeAttribute('name');
        summary.addEventListener('click', (e) => {
            e.preventDefault();
            if (month.dataset.moving) return;
            if (month.open) {
                slide(month, false);
            } else {
                month.parentElement.querySelectorAll('details.timeline-item[open]').forEach((other) => {
                    if (other !== month) slide(other, false);
                });
                slide(month, true);
            }
        });
    });

    // Slide a month open or shut by animating its height; the bullets fade in as it opens.
    function slide(month, opening) {
        const summary = month.querySelector('summary');
        const body = month.querySelector('.subjects');
        if (reduceMotion || !month.animate) {
            month.open = opening;
            return;
        }
        month.dataset.moving = '1';
        month.style.overflow = 'hidden';
        const from = month.offsetHeight;
        if (opening) month.open = true;
        const to = opening ? month.offsetHeight : summary.offsetHeight;
        const motion = month.animate(
            [{ height: from + 'px' }, { height: to + 'px' }],
            { duration: opening ? 420 : 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
        );
        if (body && opening) {
            body.animate(
                [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
                { duration: 380, delay: 80, easing: 'ease-out', fill: 'backwards' }
            );
        }
        motion.onfinish = () => {
            if (!opening) month.open = false;
            month.style.overflow = '';
            delete month.dataset.moving;
        };
    }

    const bar = document.createElement('div');
    bar.className = 'sem-tabs';
    bar.setAttribute('role', 'tablist');
    const tabs = sems.map((sem, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'sem-tab';
        tab.setAttribute('role', 'tab');
        tab.textContent = sem.dataset.label || ('Semester ' + (i + 1));
        tab.addEventListener('click', () => show(i));
        bar.appendChild(tab);
        return tab;
    });
    wrap.insertBefore(bar, wrap.firstChild);
    wrap.classList.add('has-tabs');

    function show(index) {
        sems.forEach((sem, i) => {
            sem.hidden = i !== index;
            tabs[i].setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
    }
    // open on the newest semester
    show(sems.length - 1);
})();

// ---------- Semester bars worked out live from the academic calendar ----------
// The dates live in index.html (data-semesters on .degree), copied only from Vedam's official
// academic calendar. Each new yearly calendar adds two semesters there; nothing is guessed.
(function liveSemesters() {
    const degree = document.querySelector('.degree');
    if (!degree || !degree.dataset.semesters) return;
    const total = parseInt(degree.dataset.total, 10) || 8;
    const day = 24 * 60 * 60 * 1000;
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];
    function toUTC(text) {
        const p = text.split('-');
        return Date.UTC(+p[0], +p[1] - 1, +p[2]);
    }
    function nice(ms, withYear) {
        const d = new Date(ms);
        return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + (withYear ? ' ' + d.getUTCFullYear() : '');
    }

    const sems = degree.dataset.semesters.split(';').map((row) => {
        const p = row.split('|');
        return { n: +p[0], start: toUTC(p[1]), end: toUTC(p[2]) };
    });

    let done = 0;
    const rows = [];
    let nextShown = false;
    sems.forEach((s) => {
        let frac;
        if (today >= s.end) frac = 1;
        else if (today < s.start) frac = 0;
        else frac = (today - s.start) / (s.end - s.start);
        done += frac;
        if (today >= s.start) {
            rows.push({ s: s, pct: Math.round(frac * 100) });
        } else if (!nextShown) {
            rows.push({ s: s, pct: 0, upcoming: true });
            nextShown = true;
        }
    });
    if (!rows.length) return;

    const overall = Math.round((done / total) * 100);
    const summary = degree.querySelector('.degree-text strong');
    const summaryText = degree.querySelector('.degree-text');
    const summaryBar = degree.querySelector('summary .bar-fill');
    if (summary && summaryText) {
        summary.textContent = overall + '% done';
        summaryText.lastChild.textContent = ' as of today';
    }
    if (summaryBar) summaryBar.style.width = overall + '%';

    degree.querySelectorAll('.semester').forEach((el) => el.remove());
    rows.forEach((row) => {
        const box = document.createElement('div');
        box.className = 'semester';
        const label = document.createElement('p');
        label.textContent = 'Semester ' + row.s.n + ' (' + nice(row.s.start) + ' to ' + nice(row.s.end, true) + '): ';
        const strong = document.createElement('strong');
        if (row.upcoming) {
            strong.textContent = 'starts ' + nice(row.s.start);
            strong.className = 'upcoming';
        } else {
            strong.textContent = row.pct + '% done';
        }
        label.appendChild(strong);
        const bar = document.createElement('div');
        bar.className = 'bar';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = row.pct + '%';
        bar.appendChild(fill);
        box.appendChild(label);
        box.appendChild(bar);
        degree.appendChild(box);
    });
})();

window.siteReady = true;
