// DrinkedIn for Business — page behaviour.
//
// Deliberately small. The hero animates via CSS (staggered animation-delay);
// JS only handles the mobile menu and form state. There is no scroll-in
// reveal: content hidden until an IntersectionObserver fired left the figures
// band and the cards blank in full-page captures, link previews and fast
// scrolling. There is no stats counter: the numbers on this page are database
// facts, and animating them up from zero makes measurements feel like
// decoration.

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

    /* ── contact form ─────────────────────────────────────────────────── */
    const form = document.querySelector('.form');
    if (!form) return;

    // Deep links like /?interest=Data%20licence preselect the dropdown, so a link
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
