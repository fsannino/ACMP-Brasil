/* ===================================
   ACMP Brasil - JavaScript Principal
   =================================== */

document.addEventListener('DOMContentLoaded', function () {

    // --- Inject Full Navigation on Sub-pages ---
    // Sub-pages under /pages/ ship with only a logo in the header. Without the
    // dropdown menu the user gets stuck on the page. Inject the full nav so
    // every page exposes the same top-level navigation.
    (function injectSubPageNav() {
        var headerContent = document.querySelector('.main-header .header-content');
        if (!headerContent) return;
        if (headerContent.querySelector('.main-nav')) return;

        var headerEl = headerContent.parentElement;
        if (headerEl && !headerEl.id) headerEl.id = 'main-header';

        var navHTML =
            '<nav class="main-nav" id="main-nav" role="navigation" aria-label="Menu principal">' +
                '<ul class="nav-list">' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#sobre">Sobre <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="/#sobre">Sobre a ACMP Brasil</a></li>' +
                            '<li><a href="/pages/historia.html">Nossa História</a></li>' +
                            '<li><a href="/#sobre">Missão e Visão</a></li>' +
                            '<li><a href="/pages/diretoria.html">Nossa Diretoria BR</a></li>' +
                            '<li><a href="/pages/nossos-voluntarios.html">Nossos Voluntários</a></li>' +
                            '<li><a href="/pages/parceiros.html">Nossos Parceiros</a></li>' +
                            '<li><a href="/pages/estatuto.html">Nosso Estatuto</a></li>' +
                            '<li><a href="/#deib">Diversidade e Inclusão</a></li>' +
                            '<li><a href="/pages/branches.html">Branches Regionais</a></li>' +
                            '<li><a href="/#gestao-mudancas">O que é Gestão de Mudanças</a></li>' +
                            '<li><a href="/#etica">Código de Ética</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#associe-se">Associe-se <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="/#associe-se">Por que se Associar</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/join_acmp" target="_blank" rel="noopener">Associe-se / Renove</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/corporate-member-organizations" target="_blank" rel="noopener">Membros Corporativos</a></li>' +
                            '<li><a href="/pages/pacotes-corporativos.html">Pacotes Corporativos</a></li>' +
                            '<li><a href="/pages/voluntarios.html">Seja Voluntário</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#credenciais">Credenciais <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="/#credenciais">Visão Geral</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/ccmp" target="_blank" rel="noopener">Sobre o CCMP&reg;</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/mcmp" target="_blank" rel="noopener">MCMP&trade;</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/credentials-and-training-resources" target="_blank" rel="noopener">Encontre Treinamento</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/renew-your-ccmp" target="_blank" rel="noopener">Renove seu CCMP&reg;</a></li>' +
                            '<li><a href="/pages/qep.html">QEP - Provedores de Treinamento</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/faqs_ccmp" target="_blank" rel="noopener">Perguntas Frequentes</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#standard">Standard <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="/#standard">Sobre o Standard&copy;</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/ACMPStandard" target="_blank" rel="noopener">Standard 1&ordf; Edição</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/ACMPStandard-2nd-edition" target="_blank" rel="noopener">Standard 2&ordf; Edição</a></li>' +
                            '<li><a href="/pages/standard-portugues.html">Standard em Português</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#recursos">Recursos <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="https://www.acmpglobal.org/page/resource_library" target="_blank" rel="noopener">Biblioteca de Recursos</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/page/discover-whats-next-in-change-management" target="_blank" rel="noopener">White Paper 2025</a></li>' +
                            '<li><a href="https://www.acmpglobal.org/networking/" target="_blank" rel="noopener">Centro de Carreiras</a></li>' +
                            '<li><a href="/pages/business-solutions.html">Soluções para Empresas</a></li>' +
                            '<li><a href="/pages/carreiras.html">Carreiras em CM</a></li>' +
                            '<li><a href="/pages/podcast.html">Podcast - The Way Change Works</a></li>' +
                            '<li><a href="/blog/">Blog ACMP Brasil</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/#eventos">Eventos <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="https://www.acmpglobal.org/events/event_list.asp" target="_blank" rel="noopener">Calendário de Eventos</a></li>' +
                            '<li><a href="/pages/change-orlando-2026.html">Change Orlando 2026</a></li>' +
                            '<li><a href="/pages/global-cm-day.html">Dia Global da Gestão de Mudanças</a></li>' +
                            '<li><a href="/#eventos">Próximos Eventos</a></li>' +
                        '</ul>' +
                    '</li>' +
                    '<li class="nav-item has-dropdown">' +
                        '<a href="/jogos/">Jogos <i class="fas fa-chevron-down"></i></a>' +
                        '<ul class="dropdown">' +
                            '<li><a href="/jogos/">Todos os Jogos</a></li>' +
                            '<li><a href="/jogos/quiz-cm.html">Quiz: Gestão de Mudanças</a></li>' +
                            '<li><a href="/jogos/acmp-quest.html">ACMP Quest</a></li>' +
                            '<li><a href="/jogos/linha-do-tempo.html">Linha do Tempo da GM</a></li>' +
                            '<li><a href="/jogos/change-manager-simulator.html">Change Manager Simulator</a></li>' +
                        '</ul>' +
                    '</li>' +
                '</ul>' +
            '</nav>' +
            '<button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Abrir menu">' +
                '<span class="hamburger-line"></span>' +
                '<span class="hamburger-line"></span>' +
                '<span class="hamburger-line"></span>' +
            '</button>';

        headerContent.insertAdjacentHTML('beforeend', navHTML);
    })();

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

    // --- Testimonials Carousel ---
    (function () {
        var track = document.getElementById('testimonial-track');
        var dotsContainer = document.getElementById('testimonial-dots');
        var prevBtn = document.getElementById('testimonial-prev');
        var nextBtn = document.getElementById('testimonial-next');
        if (!track || !dotsContainer) return;

        var cards = track.children;
        var total = cards.length;
        var current = 0;

        for (var i = 0; i < total; i++) {
            var dot = document.createElement('div');
            dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dot.addEventListener('click', function () { goTo(parseInt(this.dataset.index)); });
            dotsContainer.appendChild(dot);
        }

        function goTo(index) {
            current = index;
            track.style.transform = 'translateX(-' + (current * 100) + '%)';
            var dots = dotsContainer.querySelectorAll('.testimonial-dot');
            dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current <= 0 ? total - 1 : current - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current >= total - 1 ? 0 : current + 1); });

        setInterval(function () { goTo(current >= total - 1 ? 0 : current + 1); }, 6000);
    })();

    // --- Exit Intent Popup ---
    (function () {
        if (sessionStorage.getItem('exit-shown') || window.innerWidth < 768) return;

        var popup = document.createElement('div');
        popup.id = 'exit-popup';
        popup.innerHTML =
            '<div class="exit-overlay"></div>' +
            '<div class="exit-box">' +
            '<button class="exit-close" id="exit-close"><i class="fas fa-times"></i></button>' +
            '<div class="exit-icon"><i class="fas fa-hand-paper"></i></div>' +
            '<h3>Espere! Antes de sair...</h3>' +
            '<p>Inscreva-se na newsletter da ACMP Brasil e receba conteúdos exclusivos sobre Gestão de Mudanças.</p>' +
            '<form class="exit-form" action="https://formspree.io/f/mbdqrbkp" method="POST" data-form-type="exit_popup" data-form-label="Newsletter (Exit Intent)">' +
            '<input type="hidden" name="_subject" value="Newsletter via Exit Popup - ACMP Brasil">' +
            '<input type="email" name="email" placeholder="Seu melhor e-mail" required>' +
            '<button type="submit" class="btn btn-primary">Quero Receber</button>' +
            '</form>' +
            '<a href="https://www.acmpglobal.org/page/join_acmp" target="_blank" rel="noopener" class="exit-join">Ou associe-se agora <i class="fas fa-arrow-right"></i></a>' +
            '</div>';
        document.body.appendChild(popup);

        document.addEventListener('mouseout', function (e) {
            if (e.clientY < 5 && !sessionStorage.getItem('exit-shown')) {
                popup.classList.add('active');
                sessionStorage.setItem('exit-shown', '1');
            }
        });

        popup.querySelector('.exit-overlay').addEventListener('click', function () { popup.classList.remove('active'); });
        document.getElementById('exit-close').addEventListener('click', function () { popup.classList.remove('active'); });
    })();

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
            // Google Analytics 4 — desativado até o GA4 ID real ser configurado.
            // Para ativar: substitua a string abaixo pelo seu Measurement ID
            // (formato 'G-XXXXXXXXXX', visível em https://analytics.google.com).
            var gaId = ''; // TODO: preencher com o GA4 real, ex: 'G-ABC123XYZ'
            if (!gaId || /^G-X+$/i.test(gaId)) return; // skip placeholder
            if (window.gtag) return;
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

    // --- Form Submissions: dual-submit (Supabase + Formspree) ---
    // Forms tagged with `data-form-type` are intercepted: data is recorded
    // in the form_submissions table (admin inbox) AND forwarded to Formspree
    // to preserve the email notification flow.
    (function () {
        var SUPA_URL = 'https://yaumzlssybzoipwmllqy.supabase.co';
        var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdW16bHNzeWJ6b2lwd21sbHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTcwMTEsImV4cCI6MjA5MTQ5MzAxMX0.GWK1jnlEmgxWmeWk1VGwR25fLBvquWtrkQ4ipq_A3RU';

        var COLUMN_MAP = {
            name:         ['nome', 'name', 'full_name', 'fullname', 'nome_completo', 'contato'],
            email:        ['email', 'e-mail'],
            phone:        ['telefone', 'phone', 'whatsapp', 'celular'],
            organization: ['empresa', 'organizacao', 'organization', 'company'],
            linkedin:     ['linkedin'],
            city_state:   ['cidade_estado', 'cidade', 'city', 'localizacao'],
            message:      ['mensagem', 'message', 'motivacao', 'comentario', 'descricao']
        };

        function pickField(data, names) {
            for (var i = 0; i < names.length; i++) {
                var v = data[names[i]];
                if (v != null && String(v).trim() !== '') return v;
            }
            return null;
        }

        function gatherFormData(form) {
            var fd = new FormData(form);
            var obj = {};
            fd.forEach(function (v, k) {
                if (obj[k] !== undefined) {
                    if (Array.isArray(obj[k])) obj[k].push(v); else obj[k] = [obj[k], v];
                } else {
                    obj[k] = v;
                }
            });
            return obj;
        }

        function buildPayload(form, data) {
            var skipKeys = { '_subject': 1, '_gotcha': 1, '_next': 1, 'password': 1, 'senha': 1 };
            var extras = {};
            Object.keys(data).forEach(function (k) {
                if (!skipKeys[k]) extras[k] = data[k];
            });
            return {
                form_type:   form.getAttribute('data-form-type') || 'unknown',
                form_label:  form.getAttribute('data-form-label') || null,
                subject:     data._subject || null,
                name:        pickField(data, COLUMN_MAP.name),
                email:       pickField(data, COLUMN_MAP.email),
                phone:       pickField(data, COLUMN_MAP.phone),
                organization: pickField(data, COLUMN_MAP.organization),
                linkedin:    pickField(data, COLUMN_MAP.linkedin),
                city_state:  pickField(data, COLUMN_MAP.city_state),
                message:     pickField(data, COLUMN_MAP.message),
                extra_data:  extras,
                source_page: document.title,
                source_path: location.pathname,
                source_url:  location.href,
                referrer:    document.referrer || null,
                user_agent:  navigator.userAgent,
                is_spam:     data._gotcha ? true : false
            };
        }

        function submitToSupabase(payload) {
            return fetch(SUPA_URL + '/rest/v1/form_submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPA_KEY,
                    'Authorization': 'Bearer ' + SUPA_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
        }

        function submitToFormspree(form) {
            return fetch(form.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            });
        }

        function showResult(form, ok) {
            var existing = form.querySelector('.acmp-form-result');
            if (existing) existing.remove();
            var msg = document.createElement('div');
            msg.className = 'acmp-form-result';
            msg.style.cssText = 'padding:14px 18px;border-radius:8px;margin-top:14px;font-size:0.9rem;font-weight:500;' +
                (ok
                    ? 'background:#dcfce7;color:#166534;border:1px solid #86efac;'
                    : 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;');
            msg.innerHTML = ok
                ? '<i class="fas fa-check-circle"></i> Mensagem recebida! Entraremos em contato em breve.'
                : '<i class="fas fa-exclamation-circle"></i> Não foi possível enviar agora. Tente novamente em alguns instantes.';
            form.appendChild(msg);
            if (ok) form.reset();
            setTimeout(function () { if (msg.parentNode) msg.remove(); }, 7000);
        }

        document.addEventListener('submit', function (e) {
            var form = e.target;
            if (!form || form.tagName !== 'FORM') return;
            if (!form.hasAttribute('data-form-type')) return;

            e.preventDefault();
            var data = gatherFormData(form);

            // Honeypot: if filled, silently drop (still flag in DB for audit)
            var payload = buildPayload(form, data);

            var btn = form.querySelector('button[type=submit], input[type=submit]');
            var btnHTML;
            if (btn) {
                btnHTML = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            }

            var supaPromise = submitToSupabase(payload).catch(function () { return null; });
            var fsPromise = (form.action && form.action.indexOf('formspree.io') !== -1)
                ? submitToFormspree(form).catch(function () { return null; })
                : Promise.resolve(null);

            Promise.all([supaPromise, fsPromise]).then(function (results) {
                var ok = (results[0] && results[0].ok) || (results[1] && results[1].ok);
                showResult(form, ok);
                if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
            });
        }, true);
    })();

});
