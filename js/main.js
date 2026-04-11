/* ===================================
   ACMP Brasil - JavaScript Principal
   =================================== */

document.addEventListener('DOMContentLoaded', function () {

    // --- Mobile Menu Toggle ---
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function () {
            mobileToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        });
    }

    // --- Mobile Dropdown Toggle ---
    const dropdownItems = document.querySelectorAll('.has-dropdown');
    dropdownItems.forEach(function (item) {
        item.querySelector('a').addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                item.classList.toggle('open');
            }
        });
    });

    // Close mobile menu on link click
    document.querySelectorAll('.dropdown a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) {
                mainNav.classList.remove('active');
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // --- Header Scroll Effect ---
    const header = document.getElementById('main-header');
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        if (header) {
            if (scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        lastScroll = scrollY;
    });

    // --- Back to Top Button ---
    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 400) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Animated Counter ---
    function animateCounters() {
        var counters = document.querySelectorAll('.stat-number[data-count]');
        counters.forEach(function (counter) {
            if (counter.dataset.animated) return;

            var rect = counter.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                counter.dataset.animated = 'true';
                var target = parseInt(counter.dataset.count, 10);
                var duration = 2000;
                var start = 0;
                var startTime = null;

                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min((timestamp - startTime) / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 3);
                    counter.textContent = Math.floor(eased * target);
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        counter.textContent = target;
                    }
                }

                requestAnimationFrame(step);
            }
        });
    }

    window.addEventListener('scroll', animateCounters);
    animateCounters();

    // --- Scroll Animations ---
    function initScrollAnimations() {
        var elements = document.querySelectorAll(
            '.about-card, .membership-card, .credential-card, .event-card, ' +
            '.resource-card, .news-card, .visual-card, .section-header'
        );

        elements.forEach(function (el) {
            el.classList.add('animate-on-scroll');
        });

        function checkVisibility() {
            var animated = document.querySelectorAll('.animate-on-scroll');
            animated.forEach(function (el) {
                var rect = el.getBoundingClientRect();
                var windowHeight = window.innerHeight;
                if (rect.top < windowHeight - 60) {
                    el.classList.add('visible');
                }
            });
        }

        window.addEventListener('scroll', checkVisibility);
        checkVisibility();
    }

    initScrollAnimations();

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#') return;

            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                var offset = header ? header.offsetHeight + 20 : 80;
                var top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });

                // Close mobile menu if open
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    });

    // --- Dark Mode Toggle ---
    var darkToggle = document.getElementById('dark-mode-toggle');
    if (darkToggle) {
        var savedTheme = localStorage.getItem('acmp-theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }

        darkToggle.addEventListener('click', function () {
            var icon = darkToggle.querySelector('i');
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('acmp-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('acmp-theme', 'dark');
            }
        });
    }

});
