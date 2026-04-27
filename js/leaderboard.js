/* ============================================
   ACMP Brasil — Leaderboard
   Componente reutilizável que lê a view game_leaderboard
   (Supabase) e renderiza um top N para um jogo específico.

   Uso:
     Leaderboard.render({
       container: '#meu-leaderboard',     // selector ou Element
       gameId:    'linha-do-tempo',
       limit:     10,                     // opcional, default 10
       theme:     'dark' | 'light',       // opcional, default 'light'
       title:     'Top jogadores',        // opcional
       formatScore: function(row){...}    // opcional, retorna string p/ exibir
     });
============================================ */
(function () {
    var SUPA_URL = 'https://yaumzlssybzoipwmllqy.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdW16bHNzeWJ6b2lwd21sbHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTcwMTEsImV4cCI6MjA5MTQ5MzAxMX0.GWK1jnlEmgxWmeWk1VGwR25fLBvquWtrkQ4ipq_A3RU';

    var GAME_LABELS = {
        'quiz-cm': 'Quiz: Gestão de Mudanças',
        'acmp-quest': 'ACMP Quest',
        'linha-do-tempo': 'Linha do Tempo da GM',
        'change-manager-simulator': 'Change Manager Simulator'
    };

    function getCurrentEmail() {
        try {
            var stored = JSON.parse(localStorage.getItem('acmp_player_v1') || 'null');
            if (stored && stored.email) return stored.email.toLowerCase();
        } catch (e) {}
        try {
            var user = JSON.parse(localStorage.getItem('sb-user') || 'null');
            if (user && user.email) return user.email.toLowerCase();
        } catch (e) {}
        return null;
    }

    function fetchTop(gameId, limit) {
        var url = SUPA_URL + '/rest/v1/game_leaderboard'
                + '?select=*&game_id=eq.' + encodeURIComponent(gameId)
                + '&order=score.desc,achieved_at.asc'
                + '&limit=' + (limit || 10);
        return fetch(url, {
            headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
        })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }

    function injectStyles() {
        if (document.getElementById('leaderboard-styles')) return;
        var s = document.createElement('style');
        s.id = 'leaderboard-styles';
        s.textContent = [
            '.lb-card{font-family:"Inter","DM Sans",-apple-system,sans-serif;border-radius:12px;padding:18px 20px;}',
            '.lb-card.lb-light{background:#fff;color:#1a1a2e;border:1px solid #e2e8f0;box-shadow:0 2px 10px rgba(0,0,0,.04);}',
            '.lb-card.lb-dark{background:rgba(255,255,255,0.03);color:#fff;border:1px solid rgba(255,255,255,0.08);}',
            '.lb-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px;}',
            '.lb-head h3{font-size:14px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin:0;}',
            '.lb-card.lb-light .lb-head h3{color:#1a3a5c;}',
            '.lb-card.lb-dark .lb-head h3{color:#fff;}',
            '.lb-head .lb-game{font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;}',
            '.lb-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;}',
            '.lb-row{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;font-size:13px;transition:background .15s;}',
            '.lb-card.lb-light .lb-row{background:#f8f9fc;}',
            '.lb-card.lb-dark .lb-row{background:rgba(255,255,255,0.03);}',
            '.lb-row.lb-me{outline:2px solid #009E8E;}',
            '.lb-card.lb-light .lb-row.lb-me{background:rgba(0,158,142,.06);}',
            '.lb-card.lb-dark .lb-row.lb-me{background:rgba(0,158,142,.12);}',
            '.lb-rank{font-weight:900;font-size:13px;text-align:center;letter-spacing:-.02em;}',
            '.lb-rank.lb-gold{color:#F5A420;}',
            '.lb-rank.lb-silver{color:#a8b3bd;}',
            '.lb-rank.lb-bronze{color:#cd7f32;}',
            '.lb-name{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.lb-name .lb-badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:2px 6px;border-radius:3px;margin-left:6px;vertical-align:1px;}',
            '.lb-card.lb-light .lb-name .lb-badge{background:rgba(26,58,92,.08);color:#1a3a5c;}',
            '.lb-card.lb-dark .lb-name .lb-badge{background:rgba(0,158,142,.18);color:#5dd4c4;}',
            '.lb-score{font-weight:800;font-size:14px;letter-spacing:-.02em;}',
            '.lb-card.lb-light .lb-score{color:#009E8E;}',
            '.lb-card.lb-dark .lb-score{color:#5dd4c4;}',
            '.lb-empty{text-align:center;padding:24px 12px;font-size:13px;opacity:.6;line-height:1.5;}',
            '.lb-loading{text-align:center;padding:18px;font-size:12px;opacity:.55;letter-spacing:.06em;text-transform:uppercase;}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function maskName(name) {
        if (!name) return 'Anônimo';
        var trimmed = String(name).trim();
        var parts = trimmed.split(/\s+/);
        if (parts.length === 1) return parts[0];
        return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
    }

    function rankClass(i) {
        if (i === 0) return 'lb-gold';
        if (i === 1) return 'lb-silver';
        if (i === 2) return 'lb-bronze';
        return '';
    }

    function defaultFormatScore(row) {
        return String(row.score);
    }

    function render(opts) {
        opts = opts || {};
        injectStyles();

        var container = typeof opts.container === 'string'
            ? document.querySelector(opts.container)
            : opts.container;
        if (!container) return;

        var theme = opts.theme === 'dark' ? 'lb-dark' : 'lb-light';
        var gameLabel = GAME_LABELS[opts.gameId] || opts.gameId;
        var title = opts.title || 'Top jogadores';
        var fmt = typeof opts.formatScore === 'function' ? opts.formatScore : defaultFormatScore;
        var myEmail = getCurrentEmail();

        container.innerHTML = '<div class="lb-card ' + theme + '">'
            + '<div class="lb-head"><h3>' + title + '</h3>'
            + '<span class="lb-game">' + gameLabel + '</span></div>'
            + '<div class="lb-loading">Carregando ranking...</div></div>';

        return fetchTop(opts.gameId, opts.limit || 10).then(function (rows) {
            var card = container.querySelector('.lb-card');
            var loadingEl = card.querySelector('.lb-loading');
            if (loadingEl) loadingEl.remove();

            if (!rows || rows.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'lb-empty';
                empty.textContent = 'Ainda sem pontuações registradas. Seja o primeiro!';
                card.appendChild(empty);
                return rows;
            }

            var ul = document.createElement('ul');
            ul.className = 'lb-list';
            rows.forEach(function (r, i) {
                var li = document.createElement('li');
                li.className = 'lb-row';
                if (myEmail && r.player_email && r.player_email.toLowerCase() === myEmail) {
                    li.classList.add('lb-me');
                }
                var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1) + 'º'));
                var memberBadge = r.is_member ? '<span class="lb-badge">ACMP</span>' : '';
                li.innerHTML = '<span class="lb-rank ' + rankClass(i) + '">' + medal + '</span>'
                    + '<span class="lb-name">' + escapeHtml(maskName(r.player_name)) + memberBadge + '</span>'
                    + '<span class="lb-score">' + escapeHtml(fmt(r)) + '</span>';
                ul.appendChild(li);
            });
            card.appendChild(ul);
            return rows;
        });
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* ============================================
       GLOBAL LEADERBOARD (Fase B)
       ============================================ */

    function fetchGlobalTop(limit) {
        var url = SUPA_URL + '/rest/v1/global_leaderboard'
                + '?select=*&order=weighted_score.desc'
                + '&limit=' + (limit || 10);
        return fetch(url, {
            headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
        })
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }

    function renderGlobal(opts) {
        opts = opts || {};
        injectStyles();

        var container = typeof opts.container === 'string'
            ? document.querySelector(opts.container)
            : opts.container;
        if (!container) return;

        var theme = opts.theme === 'dark' ? 'lb-dark' : 'lb-light';
        var title = opts.title || 'Ranking Geral';
        var subtitle = opts.subtitle || 'Pontuação ponderada nos jogos da ACMP Brasil';
        var myEmail = getCurrentEmail();

        container.innerHTML = '<div class="lb-card ' + theme + '">'
            + '<div class="lb-head"><h3>' + escapeHtml(title) + '</h3>'
            + '<span class="lb-game">' + escapeHtml(subtitle) + '</span></div>'
            + '<div class="lb-loading">Carregando ranking...</div></div>';

        return fetchGlobalTop(opts.limit || 10).then(function (rows) {
            var card = container.querySelector('.lb-card');
            var loadingEl = card.querySelector('.lb-loading');
            if (loadingEl) loadingEl.remove();

            if (!rows || rows.length === 0) {
                var empty = document.createElement('div');
                empty.className = 'lb-empty';
                empty.textContent = 'Ainda sem pontuações registradas. Seja o primeiro a entrar no ranking!';
                card.appendChild(empty);
                return rows;
            }

            var ul = document.createElement('ul');
            ul.className = 'lb-list lb-global';
            rows.forEach(function (r, i) {
                var li = document.createElement('li');
                li.className = 'lb-row';
                if (myEmail && r.player_email && r.player_email.toLowerCase() === myEmail) {
                    li.classList.add('lb-me');
                }
                var medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1) + 'º'));
                var memberBadge = r.is_member ? '<span class="lb-badge">ACMP</span>' : '';
                var gamesLabel = r.games_played === 1 ? '1 jogo' : (r.games_played + ' jogos');
                li.innerHTML = '<span class="lb-rank ' + rankClass(i) + '">' + medal + '</span>'
                    + '<span class="lb-name">' + escapeHtml(maskName(r.player_name)) + memberBadge
                    + '<span class="lb-meta"> · ' + gamesLabel + '</span></span>'
                    + '<span class="lb-score">' + escapeHtml(String(r.weighted_score)) + '</span>';
                ul.appendChild(li);
            });
            card.appendChild(ul);
            return rows;
        });
    }

    /* ============================================
       Estilo extra para o global leaderboard
       ============================================ */
    (function injectGlobalStyles() {
        if (document.getElementById('leaderboard-global-styles')) return;
        var s = document.createElement('style');
        s.id = 'leaderboard-global-styles';
        s.textContent = [
            '.lb-list.lb-global .lb-name .lb-meta{font-size:11px;font-weight:500;opacity:.65;}',
            '.lb-card.lb-light .lb-list.lb-global .lb-name .lb-meta{color:#4a4a5a;}',
            '.lb-card.lb-dark .lb-list.lb-global .lb-name .lb-meta{color:#a0b8cc;}'
        ].join('\n');
        // Aplica só quando o documento estiver pronto (defer + injectStyles cobrem o caso normal)
        if (document.head) document.head.appendChild(s);
        else document.addEventListener('DOMContentLoaded', function(){ document.head.appendChild(s); });
    })();

    window.Leaderboard = {
        GAME_LABELS: GAME_LABELS,
        render: render,
        renderGlobal: renderGlobal,
        fetchTop: fetchTop,
        fetchGlobalTop: fetchGlobalTop
    };
})();
