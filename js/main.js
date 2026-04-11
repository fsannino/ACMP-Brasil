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

    // --- External Link Translation Interceptor ---
    // Intercepts clicks on acmpglobal.org links and offers Portuguese translation
    (function () {
        var modal = document.createElement('div');
        modal.id = 'translate-modal';
        modal.innerHTML =
            '<div class="translate-overlay"></div>' +
            '<div class="translate-box">' +
            '<div class="translate-header">' +
            '<i class="fas fa-language"></i>' +
            '<h3>Você está saindo do site ACMP Brasil</h3>' +
            '</div>' +
            '<p>Esta página está no site da <strong>ACMP Global</strong> e o conteúdo original está em <strong>inglês</strong>.</p>' +
            '<p>Como deseja visualizar?</p>' +
            '<div class="translate-buttons">' +
            '<button id="btn-pt" class="btn btn-primary"><i class="fas fa-globe-americas"></i> Ver em Português</button>' +
            '<button id="btn-en" class="btn btn-outline"><i class="fas fa-globe"></i> Ver em Inglês (original)</button>' +
            '</div>' +
            '<label class="translate-remember"><input type="checkbox" id="translate-remember"> Lembrar minha escolha</label>' +
            '</div>';
        document.body.appendChild(modal);

        var savedPref = localStorage.getItem('acmp-lang-pref');
        var pendingUrl = '';

        function showModal(url) {
            pendingUrl = url;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function hideModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function openTranslated(url) {
            window.open('https://translate.google.com/translate?sl=en&tl=pt&u=' + encodeURIComponent(url), '_blank');
        }

        function openOriginal(url) {
            window.open(url, '_blank');
        }

        modal.querySelector('.translate-overlay').addEventListener('click', hideModal);

        document.getElementById('btn-pt').addEventListener('click', function () {
            if (document.getElementById('translate-remember').checked) {
                localStorage.setItem('acmp-lang-pref', 'pt');
            }
            hideModal();
            openTranslated(pendingUrl);
        });

        document.getElementById('btn-en').addEventListener('click', function () {
            if (document.getElementById('translate-remember').checked) {
                localStorage.setItem('acmp-lang-pref', 'en');
            }
            hideModal();
            openOriginal(pendingUrl);
        });

        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[href*="acmpglobal.org"]');
            if (!link) return;

            var url = link.getAttribute('href');
            if (!url || url.indexOf('acmpglobal.org') === -1) return;

            e.preventDefault();

            if (savedPref === 'pt') {
                openTranslated(url);
            } else if (savedPref === 'en') {
                openOriginal(url);
            } else {
                showModal(url);
            }
        });
    })();

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
