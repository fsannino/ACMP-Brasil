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

    // --- LGPD Cookie Consent ---
    (function () {
        var banner = document.getElementById('cookie-banner');
        var acceptBtn = document.getElementById('cookie-accept');
        var rejectBtn = document.getElementById('cookie-reject');
        if (!banner) return;

        var consent = localStorage.getItem('acmp-cookie-consent');
        if (consent === null) {
            setTimeout(function () { banner.classList.add('active'); }, 1500);
        } else if (consent === 'accepted') {
            loadAnalytics();
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', function () {
                localStorage.setItem('acmp-cookie-consent', 'accepted');
                banner.classList.remove('active');
                loadAnalytics();
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', function () {
                localStorage.setItem('acmp-cookie-consent', 'rejected');
                banner.classList.remove('active');
            });
        }

        function loadAnalytics() {
            // Google Analytics - Replace G-XXXXXXXXXX with your GA4 Measurement ID
            if (window.gtag) return;
            var gaId = 'G-XXXXXXXXXX'; // TODO: Replace with real GA4 ID
            var s = document.createElement('script');
            s.async = true;
            s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
            document.head.appendChild(s);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () { dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', gaId, { anonymize_ip: true });
        }
    })();

    // --- Site Search ---
    (function () {
        var toggle = document.getElementById('search-toggle');
        var box = document.getElementById('search-box');
        var input = document.getElementById('search-input');
        var results = document.getElementById('search-results');
        if (!toggle || !box) return;

        var pages = [
            { title: 'Sobre a ACMP Brasil', desc: 'Missão, visão, valores e história', url: '#sobre' },
            { title: 'O que é Gestão de Mudanças', desc: 'Disciplina profissional de change management', url: '#gestao-mudancas' },
            { title: 'Associe-se / Benefícios', desc: 'Networking, certificações, eventos exclusivos', url: '#associe-se' },
            { title: 'Certificações CCMP e MCMP', desc: 'Credenciais profissionais reconhecidas', url: '#credenciais' },
            { title: 'Standard ACMP', desc: 'Documento de referência em gestão de mudanças', url: '#standard' },
            { title: 'Eventos', desc: 'Change Orlando 2026, webinars, conferências', url: '#eventos' },
            { title: 'Recursos para Membros', desc: 'Biblioteca, white papers, carreiras', url: '#recursos' },
            { title: 'Diversidade e Inclusão (DEIB)', desc: 'Equidade, pertencimento na comunidade', url: '#deib' },
            { title: 'Código de Ética', desc: 'Padrões de conduta profissional', url: '#etica' },
            { title: 'Por que o Brasil?', desc: 'Mercado, oportunidades, contexto brasileiro', url: '#brasil' },
            { title: 'Nossa História', desc: 'Linha do tempo da ACMP no Brasil', url: 'pages/historia.html' },
            { title: 'Branches Regionais', desc: 'Capítulos por região do Brasil', url: 'pages/branches.html' },
            { title: 'Voluntariado', desc: 'Seja voluntário, comitês, formulário', url: 'pages/voluntarios.html' },
            { title: 'FAQ', desc: 'Perguntas frequentes sobre ACMP e CCMP', url: 'pages/faq.html' },
            { title: 'Change Orlando 2026', desc: 'Conferência global mai 17-20', url: 'pages/change-orlando-2026.html' },
            { title: 'Dia Global da Gestão de Mudanças', desc: 'Celebração mundial da profissão', url: 'pages/global-cm-day.html' },
            { title: 'Podcast', desc: 'The Way Change Works', url: 'pages/podcast.html' },
            { title: 'QEP - Provedores de Treinamento', desc: 'Qualified Education Provider', url: 'pages/qep.html' },
            { title: 'Pacotes Corporativos', desc: 'CCMP + associação para empresas', url: 'pages/pacotes-corporativos.html' },
            { title: 'Standard em Português', desc: 'Tradução do Standard ACMP', url: 'pages/standard-portugues.html' },
            { title: 'Soluções para Empresas', desc: 'Treinamento, consultoria corporativa', url: 'pages/business-solutions.html' }
        ];

        toggle.addEventListener('click', function () {
            box.classList.toggle('active');
            if (box.classList.contains('active')) {
                input.focus();
            }
        });

        document.addEventListener('click', function (e) {
            if (!box.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
                box.classList.remove('active');
            }
        });

        input.addEventListener('input', function () {
            var q = this.value.toLowerCase().trim();
            if (q.length < 2) {
                results.innerHTML = '';
                return;
            }
            var matches = pages.filter(function (p) {
                return p.title.toLowerCase().indexOf(q) > -1 || p.desc.toLowerCase().indexOf(q) > -1;
            });
            if (matches.length === 0) {
                results.innerHTML = '<div class="no-results">Nenhum resultado para "' + q + '"</div>';
            } else {
                results.innerHTML = matches.map(function (p) {
                    return '<a href="' + p.url + '"><strong>' + p.title + '</strong><br><small>' + p.desc + '</small></a>';
                }).join('');
            }
        });
    })();

    // --- Event Countdown Timer ---
    (function () {
        var el = document.getElementById('orlando-countdown');
        if (!el) return;
        var target = new Date('2026-05-17T09:00:00-04:00').getTime();
        function update() {
            var now = Date.now();
            var diff = target - now;
            if (diff <= 0) {
                el.innerHTML = '<span style="font-weight:700;color:var(--primary);">Evento em andamento!</span>';
                return;
            }
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            el.innerHTML =
                '<div class="countdown-unit"><div class="countdown-value">' + d + '</div><div class="countdown-label">dias</div></div>' +
                '<div class="countdown-unit"><div class="countdown-value">' + h + '</div><div class="countdown-label">horas</div></div>' +
                '<div class="countdown-unit"><div class="countdown-value">' + m + '</div><div class="countdown-label">min</div></div>' +
                '<div class="countdown-unit"><div class="countdown-value">' + s + '</div><div class="countdown-label">seg</div></div>';
        }
        update();
        setInterval(update, 1000);
    })();

    // --- WhatsApp Tooltip auto-show ---
    (function () {
        var tooltip = document.getElementById('whatsapp-tooltip');
        if (!tooltip) return;
        if (!sessionStorage.getItem('wa-shown')) {
            setTimeout(function () {
                tooltip.classList.add('show');
                setTimeout(function () { tooltip.classList.remove('show'); }, 4000);
                sessionStorage.setItem('wa-shown', '1');
            }, 3000);
        }
    })();

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
