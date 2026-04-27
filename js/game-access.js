/* ============================================
   ACMP Brasil — Game Access
   Gate de liberação de jogos por categoria de público.
   Lê /game_access_settings do Supabase (RLS: leitura pública)
   e expõe helpers para:
     - filtrar cards na página /jogos/
     - bloquear acesso na página individual de cada jogo

   Categorias (allowed_audiences):
     'public', 'community', 'member', 'volunteer', 'ccmp'

   Dependência: js/game-gate.js (para descobrir o jogador atual).
============================================ */
(function () {
    var SUPA_URL = 'https://yaumzlssybzoipwmllqy.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdW16bHNzeWJ6b2lwd21sbHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTcwMTEsImV4cCI6MjA5MTQ5MzAxMX0.GWK1jnlEmgxWmeWk1VGwR25fLBvquWtrkQ4ipq_A3RU';

    var DEFAULT_AUDIENCES = ['public','community','member','volunteer','ccmp'];
    var AUDIENCE_LABELS = {
        public: 'Visitantes (sem login)',
        community: 'Comunidade',
        member: 'Associados ACMP',
        volunteer: 'Voluntários',
        ccmp: 'Certificados CCMP®'
    };

    function getMemberFromSession() {
        try {
            var token = localStorage.getItem('sb-token');
            var user = JSON.parse(localStorage.getItem('sb-user') || 'null');
            if (token && user && user.email) return user;
        } catch (e) {}
        return null;
    }

    function getStoredPlayer() {
        try {
            var p = JSON.parse(localStorage.getItem('acmp_player_v1') || 'null');
            if (p && p.email) return p;
        } catch (e) {}
        return null;
    }

    // Categoria atual do jogador. Sem identificação => 'public'.
    function getCurrentAudience() {
        var session = getMemberFromSession();
        if (session) {
            // Sessão de membro autenticado => associado
            return 'member';
        }
        var stored = getStoredPlayer();
        if (stored && !stored.anonymous) {
            return stored.isMember ? 'member' : 'community';
        }
        return 'public';
    }

    function fetchAllSettings() {
        return fetch(SUPA_URL + '/rest/v1/game_access_settings?select=*', {
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY
            }
        }).then(function (r) { return r.ok ? r.json() : []; })
          .catch(function () { return []; });
    }

    function fetchOne(gameId) {
        var url = SUPA_URL + '/rest/v1/game_access_settings?select=*&game_id=eq.' + encodeURIComponent(gameId);
        return fetch(url, {
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY
            }
        }).then(function (r) { return r.ok ? r.json() : []; })
          .then(function (rows) { return (rows && rows[0]) || null; })
          .catch(function () { return null; });
    }

    function isAllowed(setting, audience) {
        if (!setting) return true; // sem configuração ⇒ aberto (padrão seguro p/ jogos novos)
        if (setting.enabled === false) return false;
        var list = Array.isArray(setting.allowed_audiences) && setting.allowed_audiences.length
            ? setting.allowed_audiences
            : DEFAULT_AUDIENCES;
        return list.indexOf(audience) !== -1;
    }

    /* --------------------------------------------------------
       UI helpers
       -------------------------------------------------------- */
    function injectStyles() {
        if (document.getElementById('game-access-styles')) return;
        var s = document.createElement('style');
        s.id = 'game-access-styles';
        s.textContent = [
            '.gax-locked{opacity:.55;filter:grayscale(.4);position:relative;pointer-events:none;}',
            '.gax-card-badge{position:absolute;top:14px;left:14px;background:#6b7280;color:#fff;padding:4px 10px;border-radius:50px;font-size:.7rem;font-weight:700;letter-spacing:.03em;display:inline-flex;align-items:center;gap:6px;z-index:2;}',
            '.gax-info-banner{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin:0 20px 24px;font-size:.88rem;color:#4a4a5a;display:flex;align-items:center;gap:10px;}',
            '.gax-info-banner i{color:#1a3a5c;}',
            '.gax-block{max-width:520px;margin:80px auto;padding:36px 28px;background:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.08);text-align:center;font-family:"Inter",-apple-system,sans-serif;color:#1a1a2e;}',
            '.gax-block .gax-icon{font-size:46px;color:#e8a838;margin-bottom:10px;}',
            '.gax-block h2{font-size:1.4rem;font-weight:800;color:#1a3a5c;margin-bottom:10px;}',
            '.gax-block p{font-size:.95rem;color:#4a4a5a;line-height:1.6;margin-bottom:18px;}',
            '.gax-block .gax-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}',
            '.gax-block a{display:inline-block;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:.9rem;}',
            '.gax-block a.gax-primary{background:#1a3a5c;color:#fff;}',
            '.gax-block a.gax-primary:hover{background:#2a5a8c;}',
            '.gax-block a.gax-ghost{background:transparent;color:#1a3a5c;border:1.5px solid #1a3a5c;}',
            '.gax-block a.gax-ghost:hover{background:#f8f9fc;}'
        ].join('\n');
        document.head.appendChild(s);
    }

    /* --------------------------------------------------------
       PUBLIC API
       -------------------------------------------------------- */
    window.GameAccess = {
        AUDIENCES: DEFAULT_AUDIENCES.slice(),
        LABELS: AUDIENCE_LABELS,

        getCurrentAudience: getCurrentAudience,
        fetchAllSettings: fetchAllSettings,
        fetchSetting: fetchOne,
        isAllowed: isAllowed,

        // Aplica filtro nos cards de /jogos/index.html
        // Cada card precisa ter [data-game-id]; cards bloqueados ficam desabilitados.
        applyToCatalog: function (opts) {
            opts = opts || {};
            injectStyles();
            return fetchAllSettings().then(function (rows) {
                var audience = getCurrentAudience();
                var byId = {};
                (rows || []).forEach(function (r) { byId[r.game_id] = r; });
                var lockedCount = 0;

                document.querySelectorAll('[data-game-id]').forEach(function (card) {
                    var gid = card.getAttribute('data-game-id');
                    var setting = byId[gid];
                    if (!isAllowed(setting, audience)) {
                        card.classList.add('gax-locked');
                        if (card.tagName === 'A') {
                            card.removeAttribute('href');
                        }
                        if (!card.querySelector('.gax-card-badge')) {
                            var badge = document.createElement('span');
                            badge.className = 'gax-card-badge';
                            badge.innerHTML = '<i class="fas fa-lock"></i> Restrito';
                            card.appendChild(badge);
                        }
                        lockedCount++;
                    }
                });

                if (typeof opts.onApplied === 'function') {
                    opts.onApplied({ audience: audience, lockedCount: lockedCount });
                }
                return { audience: audience, lockedCount: lockedCount };
            });
        },

        // Bloqueia a página inteira de um jogo se a categoria não tiver acesso.
        // gameId obrigatório. containerSelector opcional (default = body).
        guardPage: function (opts) {
            opts = opts || {};
            if (!opts.gameId) return Promise.resolve(true);
            injectStyles();

            return fetchOne(opts.gameId).then(function (setting) {
                var audience = getCurrentAudience();
                if (isAllowed(setting, audience)) return true;

                var labelAllowed = (setting && Array.isArray(setting.allowed_audiences) ? setting.allowed_audiences : DEFAULT_AUDIENCES)
                    .map(function (a) { return AUDIENCE_LABELS[a] || a; })
                    .join(', ');

                var msg = setting && setting.enabled === false
                    ? 'Este jogo está temporariamente desativado pelo administrador.'
                    : 'Este jogo está disponível apenas para: <strong>' + labelAllowed + '</strong>.';

                var actions = '';
                if (audience === 'public') {
                    actions = '<a href="/membros/login.html" class="gax-primary">Entrar como associado</a>' +
                              '<a href="/jogos/" class="gax-ghost">Voltar aos jogos</a>';
                } else {
                    actions = '<a href="/jogos/" class="gax-primary">Voltar aos jogos</a>' +
                              '<a href="/" class="gax-ghost">Página inicial</a>';
                }

                document.body.innerHTML =
                    '<div class="gax-block">' +
                        '<div class="gax-icon"><i class="fas fa-lock"></i></div>' +
                        '<h2>Acesso restrito</h2>' +
                        '<p>' + msg + '</p>' +
                        '<div class="gax-actions">' + actions + '</div>' +
                    '</div>';
                document.body.style.background = '#f8f9fc';
                return false;
            });
        }
    };
})();
