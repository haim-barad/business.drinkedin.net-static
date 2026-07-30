// DrinkedIn for Brands — page behaviour.
//
// Deliberately small. The hero animates via CSS (staggered animation-delay);
// JS only handles the mobile menu, scroll-in reveals, and form state. There is
// no stats counter: the numbers on this page are database facts, and animating
// them up from zero makes measurements feel like decoration.

document.addEventListener('DOMContentLoaded', () => {
    /* ── mobile menu ──────────────────────────────────────────────────── */
    const burger = document.querySelector('.burger');
    const navList = document.querySelector('.nav-list');

    if (burger && navList) {
        burger.addEventListener('click', () => {
            const open = navList.classList.toggle('open');
            burger.setAttribute('aria-expanded', String(open));
            const [a, b] = burger.querySelectorAll('span');
            if (a && b) {
                a.style.transform = open ? 'translateY(3px) rotate(45deg)' : '';
                b.style.transform = open ? 'translateY(-3px) rotate(-45deg)' : '';
            }
        });

        navList.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navList.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
                burger.querySelectorAll('span').forEach((s) => { s.style.transform = ''; });
            });
        });
    }

    /* ── scroll reveals ───────────────────────────────────────────────── */
    // Anything below the fold fades up once. Guarded on IntersectionObserver
    // so that without it the content is simply visible rather than invisible.
    const targets = document.querySelectorAll('.card, .limit-list li, .steps li, .ledger-row li');

    if ('IntersectionObserver' in window && targets.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('seen');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        targets.forEach((el, i) => {
            el.classList.add('watch');
            el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
            io.observe(el);
        });
    }

    /* ── contact form ─────────────────────────────────────────────────── */
    const form = document.querySelector('.form');
    if (!form) return;

    // Deep links like /?interest=Research preselect the dropdown, so a link
    // from elsewhere can drop someone into the right conversation.
    const select = form.querySelector('#interest');
    const wanted = new URLSearchParams(window.location.search).get('interest');
    if (select && wanted) {
        const match = Array.from(select.options).find((o) => o.value === wanted);
        if (match) select.value = match.value;
    }

    form.addEventListener('submit', () => {
        const button = form.querySelector('button[type="submit"]');
        if (!button) return;
        button.textContent = 'Sending…';
        button.disabled = true;
        // Formspree navigates away on success; this only matters if it doesn't.
        setTimeout(() => {
            button.textContent = 'Send';
            button.disabled = false;
        }, 4000);
    });
});
