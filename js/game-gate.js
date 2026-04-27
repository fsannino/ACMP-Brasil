/* ============================================
   ACMP Brasil — Game Gate
   Modal de identificação (antes do jogo) +
   modal de feedback (ao final do jogo).
   Compartilhado entre Quiz CM, ACMP Quest e Linha do Tempo.

   Uso:
     GameGate.start({
       gameId: 'quiz-cm' | 'acmp-quest' | 'linha-do-tempo',
       gameTitle: 'Quiz: Gestão de Mudanças',
       onReady: function(player) { (inicie o jogo) }
     });

     GameGate.finish({
       gameId: ...,
       gameTitle: ...,
       scoreData: { score, total, ... } // qualquer JSON
     });
============================================ */
(function () {
    var SUPA_URL = 'https://yaumzlssybzoipwmllqy.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdW16bHNzeWJ6b2lwd21sbHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTcwMTEsImV4cCI6MjA5MTQ5MzAxMX0.GWK1jnlEmgxWmeWk1VGwR25fLBvquWtrkQ4ipq_A3RU';

    var STORAGE_KEY = 'acmp_player_v1';
    var FEEDBACK_SESSION_KEY = 'acmp_feedback_done_v1';
    var STORED_TTL_DAYS = 30;

    function isTokenValid(t) {
        if (!t) return false;
        try {
            var p = t.split('.');
            if (p.length !== 3) return false;
            var b64 = p[1].replace(/-/g, '+').replace(/_/g, '/');
            var payload = JSON.parse(decodeURIComponent(atob(b64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
            return payload.exp && payload.exp * 1000 > Date.now();
        } catch (e) { return false; }
    }

    function getMemberSession() {
        var token = localStorage.getItem('sb-token');
        if (!token || !isTokenValid(token)) return null;
        try {
            var user = JSON.parse(localStorage.getItem('sb-user'));
            if (!user || !user.email) return null;
            return user;
        } catch (e) { return null; }
    }

    function getStoredPlayer() {
        try {
            var p = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!p || !p.email || !p.timestamp) return null;
            if (Date.now() - p.timestamp > STORED_TTL_DAYS * 86400000) return null;
            return p;
        } catch (e) { return null; }
    }

    function setStoredPlayer(p) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
    }

    function feedbackAlreadyDone(gameId) {
        try { return sessionStorage.getItem(FEEDBACK_SESSION_KEY + ':' + gameId) === '1'; }
        catch (e) { return false; }
    }
    function markFeedbackDone(gameId) {
        try { sessionStorage.setItem(FEEDBACK_SESSION_KEY + ':' + gameId, '1'); } catch (e) {}
    }

    function supaFetch(path, body, method) {
        return fetch(SUPA_URL + '/rest/v1/' + path, {
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY,
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify(body)
        }).catch(function () { return null; });
    }

    function savePlayerToSupa(player, gameId) {
        if (!player || !player.email || player.anonymous) return;
        supaFetch('game_players', {
            email: player.email.toLowerCase(),
            name: player.name,
            is_member: !!player.isMember,
            last_seen_at: new Date().toISOString()
        });
    }

    function saveFeedbackToSupa(payload) {
        return supaFetch('game_feedback', payload);
    }

    function saveScoreToSupa(payload) {
        return supaFetch('game_scores', payload);
    }

    function buildPlayerPayload(opts) {
        var player = getStoredPlayer() || {};
        var member = getMemberSession();
        return {
            player_email: (player.email || (member && member.email) || '').toLowerCase() || null,
            player_name: player.name || (member && member.email ? member.email.split('@')[0] : null),
            is_member: !!player.isMember || !!member,
            game_id: opts.gameId
        };
    }

    /* ============================================
       STYLES (injected once)
       ============================================ */
    function injectStyles() {
        if (document.getElementById('game-gate-styles')) return;
        var s = document.createElement('style');
        s.id = 'game-gate-styles';
        s.textContent = [
            '.gg-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(8,16,32,.78);backdrop-filter:blur(6px);padding:20px;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
            '.gg-card{background:#fff;color:#1a1a2e;border-radius:14px;padding:32px 28px;max-width:440px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.5);max-height:92vh;overflow-y:auto;-webkit-overflow-scrolling:touch;animation:gg-up .3s ease both;}',
            '@keyframes gg-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}',
            '.gg-title{font-size:20px;font-weight:800;color:#1a3a5c;margin-bottom:6px;letter-spacing:-.01em;}',
            '.gg-sub{font-size:13.5px;color:#4a4a5a;line-height:1.55;margin-bottom:20px;}',
            '.gg-sub strong{color:#1a3a5c;}',
            '.gg-field{display:block;margin-bottom:14px;}',
            '.gg-field > span{display:block;font-size:12px;font-weight:700;color:#1a3a5c;margin-bottom:5px;letter-spacing:.02em;text-transform:uppercase;}',
            '.gg-field > span small{font-weight:500;color:#6b7280;text-transform:none;letter-spacing:0;font-size:11px;}',
            '.gg-field input[type=text],.gg-field input[type=email],.gg-field textarea{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:14px;color:#1a1a2e;background:#f8f9fc;transition:border-color .15s,background .15s;}',
            '.gg-field input:focus,.gg-field textarea:focus{outline:none;border-color:#1a3a5c;background:#fff;}',
            '.gg-field textarea{resize:vertical;min-height:80px;}',
            '.gg-radio{border:none;padding:0;}',
            '.gg-radio legend{font-size:12px;font-weight:700;color:#1a3a5c;margin-bottom:8px;letter-spacing:.02em;text-transform:uppercase;}',
            '.gg-radio label{display:flex;align-items:center;gap:8px;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;margin-bottom:6px;cursor:pointer;font-size:13.5px;color:#4a4a5a;transition:all .15s;}',
            '.gg-radio label:hover{border-color:#1a3a5c;background:#f8f9fc;}',
            '.gg-radio input[type=radio]{accent-color:#1a3a5c;width:16px;height:16px;}',
            '.gg-radio input[type=radio]:checked + span,.gg-radio label:has(input:checked){border-color:#1a3a5c;background:rgba(26,58,92,.06);color:#1a1a2e;font-weight:600;}',
            '.gg-stars{display:flex;gap:6px;justify-content:center;padding:8px 0;}',
            '.gg-stars label{cursor:pointer;font-size:34px;color:#e2e8f0;transition:color .12s,transform .12s;line-height:1;padding:0 2px;}',
            '.gg-stars label:hover,.gg-stars label:hover ~ label{color:#e2e8f0;}',
            '.gg-stars label.lit,.gg-stars:hover label:hover,.gg-stars:hover label:hover ~ label{color:#e2e8f0;}',
            '.gg-stars input{display:none;}',
            '.gg-stars label.lit{color:#e8a838;transform:scale(1.05);}',
            '.gg-btn-primary{display:inline-block;width:100%;padding:13px 20px;background:#1a3a5c;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:14px;font-weight:700;letter-spacing:.02em;cursor:pointer;transition:background .15s,transform .12s;text-align:center;text-decoration:none;margin-top:6px;}',
            '.gg-btn-primary:hover{background:#2a5a8c;}',
            '.gg-btn-skip{display:block;width:100%;background:transparent;color:#6b7280;border:none;padding:10px;font-family:inherit;font-size:12px;cursor:pointer;margin-top:8px;text-decoration:underline;}',
            '.gg-btn-skip:hover{color:#1a3a5c;}',
            '.gg-actions{display:flex;flex-direction:column;gap:10px;margin-top:18px;}',
            '.gg-actions .gg-btn-primary{margin-top:0;}',
            '.gg-actions .gg-btn-skip{margin-top:0;text-align:center;}',
            '.gg-thanks-icon{text-align:center;font-size:48px;margin-bottom:12px;}',
            '.gg-saved-banner{background:rgba(40,167,69,.08);border:1px solid rgba(40,167,69,.25);color:#0d6e30;padding:10px 14px;border-radius:8px;font-size:12.5px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}',
            '@media (max-width:480px){.gg-card{padding:24px 18px;border-radius:10px;}.gg-title{font-size:18px;}.gg-stars label{font-size:30px;}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function ensureModal() {
        injectStyles();
        var modal = document.getElementById('game-gate-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'game-gate-modal';
        modal.className = 'gg-overlay';
        modal.style.display = 'none';
        document.body.appendChild(modal);
        return modal;
    }

    function closeModal() {
        var m = document.getElementById('game-gate-modal');
        if (m) m.style.display = 'none';
    }

    /* ============================================
       FORMS
       ============================================ */
    function showStartForm(opts) {
        var modal = ensureModal();
        var title = opts.gameTitle ? '<strong>' + escapeHTML(opts.gameTitle) + '</strong>' : 'este jogo';
        modal.innerHTML =
            '<div class="gg-card" role="dialog" aria-modal="true" aria-labelledby="gg-st-title">' +
                '<div class="gg-title" id="gg-st-title">Identifique-se para começar</div>' +
                '<p class="gg-sub">Antes de jogar ' + title + ', queremos conhecer você melhor — assim podemos personalizar conteúdos e enviar novidades dos jogos da ACMP Brasil.</p>' +
                '<form id="gg-start-form" novalidate>' +
                    '<label class="gg-field"><span>Nome</span><input type="text" name="name" required maxlength="60" autocomplete="name"></label>' +
                    '<label class="gg-field"><span>E-mail</span><input type="email" name="email" required maxlength="120" autocomplete="email"></label>' +
                    '<fieldset class="gg-field gg-radio">' +
                        '<legend>Você é associado(a) ACMP Brasil?</legend>' +
                        '<label><input type="radio" name="member" value="yes" required><span>Sim, sou associado(a)</span></label>' +
                        '<label><input type="radio" name="member" value="no"><span>Não, sou da comunidade</span></label>' +
                    '</fieldset>' +
                    '<button type="submit" class="gg-btn-primary">Começar a jogar →</button>' +
                    '<button type="button" class="gg-btn-skip" id="gg-skip">Pular (jogar como anônimo)</button>' +
                '</form>' +
            '</div>';
        modal.style.display = 'flex';

        var form = document.getElementById('gg-start-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var fd = new FormData(form);
            var name = (fd.get('name') || '').trim();
            var email = (fd.get('email') || '').trim();
            var member = fd.get('member');
            if (!name || !email || !member) return;
            var player = {
                name: name,
                email: email.toLowerCase(),
                isMember: member === 'yes',
                anonymous: false,
                timestamp: Date.now()
            };
            setStoredPlayer(player);
            savePlayerToSupa(player, opts.gameId);
            closeModal();
            if (typeof opts.onReady === 'function') opts.onReady(player);
        });

        document.getElementById('gg-skip').addEventListener('click', function () {
            var player = { name: 'Convidado', email: '', isMember: false, anonymous: true, timestamp: Date.now() };
            setStoredPlayer(player);
            closeModal();
            if (typeof opts.onReady === 'function') opts.onReady(player);
        });
    }

    function showFeedbackForm(opts) {
        var modal = ensureModal();
        var title = opts.gameTitle ? escapeHTML(opts.gameTitle) : 'este jogo';
        modal.innerHTML =
            '<div class="gg-card" role="dialog" aria-modal="true" aria-labelledby="gg-fb-title">' +
                '<div class="gg-title" id="gg-fb-title">🙏 Obrigado por jogar!</div>' +
                '<p class="gg-sub">Sua opinião sobre <strong>' + title + '</strong> ajuda a melhorar os jogos da ACMP Brasil. Leva menos de um minuto.</p>' +
                '<form id="gg-feedback-form" novalidate>' +
                    '<fieldset class="gg-field gg-radio" style="text-align:center;">' +
                        '<legend>Como foi sua experiência?</legend>' +
                        '<div class="gg-stars" id="gg-stars">' +
                            [1, 2, 3, 4, 5].map(function (n) {
                                return '<label data-n="' + n + '"><input type="radio" name="rating" value="' + n + '" required><span aria-hidden="true">★</span><span style="display:none;">' + n + ' estrelas</span></label>';
                            }).join('') +
                        '</div>' +
                    '</fieldset>' +
                    '<label class="gg-field"><span>Sugestões de melhoria <small>(opcional)</small></span>' +
                        '<textarea name="suggestion" rows="4" maxlength="600" placeholder="O que poderíamos melhorar? Que conteúdos você gostaria de ver?"></textarea>' +
                    '</label>' +
                    '<button type="submit" class="gg-btn-primary" id="gg-fb-submit">Enviar feedback</button>' +
                    '<button type="button" class="gg-btn-skip" id="gg-fb-skip">Pular esta avaliação</button>' +
                '</form>' +
            '</div>';
        modal.style.display = 'flex';

        // Star rating interaction
        var starsWrap = document.getElementById('gg-stars');
        starsWrap.addEventListener('click', function (e) {
            var label = e.target.closest('label[data-n]');
            if (!label) return;
            var n = parseInt(label.dataset.n, 10);
            starsWrap.querySelectorAll('label').forEach(function (l) {
                l.classList.toggle('lit', parseInt(l.dataset.n, 10) <= n);
            });
        });

        var form = document.getElementById('gg-feedback-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var fd = new FormData(form);
            var rating = parseInt(fd.get('rating'), 10);
            if (!rating) return;
            var player = getStoredPlayer() || {};
            var member = getMemberSession();
            var payload = {
                player_email: player.email || (member && member.email) || null,
                player_name: player.name || null,
                is_member: !!player.isMember || !!member,
                game_id: opts.gameId,
                rating: rating,
                suggestion: (fd.get('suggestion') || '').trim() || null,
                score_data: opts.scoreData || null
            };
            saveFeedbackToSupa(payload);
            markFeedbackDone(opts.gameId);
            showThankYou(opts);
        });

        document.getElementById('gg-fb-skip').addEventListener('click', function () {
            markFeedbackDone(opts.gameId);
            closeModal();
        });
    }

    function showThankYou(opts) {
        var modal = ensureModal();
        modal.innerHTML =
            '<div class="gg-card" role="dialog" aria-modal="true">' +
                '<div class="gg-thanks-icon">✨</div>' +
                '<div class="gg-title" style="text-align:center;">Obrigado!</div>' +
                '<p class="gg-sub" style="text-align:center;">Seu apoio fortalece a comunidade brasileira de Gestão de Mudanças. Bons estudos e até a próxima partida!</p>' +
                '<div class="gg-actions">' +
                    '<a href="/jogos/" class="gg-btn-primary">Outros jogos</a>' +
                    '<a href="/" class="gg-btn-skip">Voltar para o site</a>' +
                '</div>' +
            '</div>';
        modal.style.display = 'flex';
    }

    function escapeHTML(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    /* ============================================
       PUBLIC API
       ============================================ */
    window.GameGate = {
        start: function (opts) {
            opts = opts || {};
            // 1) member session takes precedence
            var session = getMemberSession();
            if (session && session.email) {
                var name = (session.user_metadata && (session.user_metadata.full_name || session.user_metadata.name))
                    || session.email.split('@')[0];
                var player = {
                    name: name,
                    email: session.email,
                    isMember: true,
                    fromMemberSession: true,
                    anonymous: false,
                    timestamp: Date.now()
                };
                setStoredPlayer(player);
                savePlayerToSupa(player, opts.gameId);
                if (typeof opts.onReady === 'function') opts.onReady(player);
                return;
            }
            // 2) cached player (under TTL)
            var stored = getStoredPlayer();
            if (stored) {
                if (typeof opts.onReady === 'function') opts.onReady(stored);
                return;
            }
            // 3) ask
            showStartForm(opts);
        },

        finish: function (opts) {
            opts = opts || {};

            // 1) Score: gravado SEMPRE que opts.score é numérico, independente do feedback.
            //    Habilita leaderboard mesmo se o jogador pular o formulário de avaliação.
            if (typeof opts.score === 'number' && isFinite(opts.score)) {
                var base = buildPlayerPayload(opts);
                if (base.player_email && base.player_name) {
                    base.score = Math.round(opts.score);
                    base.score_data = opts.scoreData || null;
                    saveScoreToSupa(base);
                }
            }

            // 2) Feedback: 1x por sessão (rating + sugestão).
            if (feedbackAlreadyDone(opts.gameId)) return;
            showFeedbackForm(opts);
        },

        // Helpers expostos para os jogos
        getPlayer: function () {
            return getStoredPlayer() || (function () {
                var s = getMemberSession();
                return s ? { name: s.email.split('@')[0], email: s.email, isMember: true } : null;
            })();
        },

        clear: function () {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }
    };
})();
