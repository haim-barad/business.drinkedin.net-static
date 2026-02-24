// DrinkedIn Business Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DrinkedIn Business Platform loaded');

    // Mobile menu functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');

            // Animate hamburger icon
            const spans = mobileMenuToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Smooth scrolling for anchor links
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');

            // Skip if it's just "#" or empty
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();

                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const spans = mobileMenuToggle.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }

                // Calculate offset for sticky header
                const header = document.querySelector('.main-header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Update URL hash without jumping
                history.pushState(null, null, targetId);
            }
        });
    });

    // Contact form handling
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        // Pre-select interest based on which CTA was clicked
        const urlParams = new URLSearchParams(window.location.search);
        const interestParam = urlParams.get('interest');
        const interestSelect = contactForm.querySelector('#interest');

        if (interestParam && interestSelect) {
            const option = interestSelect.querySelector(`option[value="${interestParam}"]`);
            if (option) {
                interestSelect.value = interestParam;
            }
        }

        contactForm.addEventListener('submit', function(e) {
            // Let Formspree handle the submission, just show loading state
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;

            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            // Reset button state after a delay (Formspree will redirect)
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 3000);
        });
    }

    // Scroll animations using Intersection Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .testimonial-card, .stat-item');
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // Add animate-in class styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number');

    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;

                // Check if it's a number we can animate
                const match = text.match(/^(\d+[,\.]?\d*)/);
                if (match) {
                    const finalNum = parseFloat(match[1].replace(/,/g, ''));
                    const suffix = text.replace(match[1], '');
                    animateCounter(target, finalNum, suffix);
                }

                statsObserver.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    function animateCounter(element, target, suffix) {
        const duration = 2000;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);

            element.textContent = formatNumber(currentValue) + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = formatNumber(target) + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    function formatNumber(num) {
        if (num >= 1000) {
            return num.toLocaleString();
        }
        return num;
    }

    statNumbers.forEach(stat => {
        statsObserver.observe(stat);
    });

    // Add subtle hover effect to cards
    const cards = document.querySelectorAll('.feature-card, .testimonial-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Header scroll effect
    const header = document.querySelector('.main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    // Update CTA links to pass interest parameter
    const ctaLinks = document.querySelectorAll('a[href="#contact"]');
    ctaLinks.forEach(link => {
        // Find the nearest section to determine context
        const section = link.closest('section');
        if (section) {
            const sectionId = section.id;
            let interestParam = '';

            if (sectionId === 'bar-listings') {
                interestParam = '?interest=Bar Listing';
            } else if (sectionId === 'brand-listings') {
                interestParam = '?interest=Brand Listing';
            } else if (sectionId === 'ai-agents') {
                interestParam = '?interest=AI Agents';
            }

            if (interestParam) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    // Update the select dropdown
                    if (interestSelect) {
                        const option = interestSelect.querySelector(`option[value="${interestParam.split('=')[1]}"]`);
                        if (option) {
                            interestSelect.value = option.value;
                        }
                    }

                    // Scroll to contact
                    const contactSection = document.querySelector('#contact');
                    if (contactSection) {
                        const headerHeight = header ? header.offsetHeight : 0;
                        const targetPosition = contactSection.offsetTop - headerHeight - 20;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            }
        }
    });
});

// Utility function for mobile menu (backward compatibility)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}
