# ACMP Quest — Verificar Parte 1 e Executar Parte 2

> **Como usar:** copie todo o conteúdo abaixo (a partir do título "ACMP Quest — Verificar Parte 1 e Executar Parte 2" no próximo bloco) e cole como prompt em uma nova sessão Claude Code, com a branch `claude/review-html-code-vpFFP` ativa.

---

Você está trabalhando no repositório `ACMP-Brasil`, na branch `claude/review-html-code-vpFFP`. O objetivo é entregar um quiz gamificado ("ACMP Quest") em 4 partes; **a Parte 1 (schema SQL) deve estar concluída** e você fará agora a **Parte 2 (reskin visual)**.

---

## ✅ ETAPA A — Verificar Parte 1

Antes de qualquer coisa, confirme que a Parte 1 foi feita:

1. `git status` deve estar limpo e a branch atual deve ser `claude/review-html-code-vpFFP`.
2. O arquivo `supabase-quiz.sql` deve existir na raiz do repositório.
3. O conteúdo desse SQL deve conter:
   - `CREATE TABLE ... quiz_progress` (user_id, display_name, xp, total_score, games_played, achievements, timestamps)
   - `CREATE TABLE ... quiz_scores` (id, user_id, display_name, mode, difficulty, score, correct, total_questions, max_streak, grade, played_at)
   - `CREATE OR REPLACE VIEW quiz_leaderboard`
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` para ambas
   - Policies "Users read own progress", "Users insert own scores", etc.
   - `CREATE OR REPLACE FUNCTION add_quiz_result(...)` com `ON CONFLICT DO UPDATE`
   - Trigger `trg_touch_quiz_progress`
4. `git log --oneline | head -5` deve mostrar um commit cujo título começa com `feat: Add SQL schema for ACMP Quest`.

**Se algum item falhar**, pare e reporte exatamente qual; **não prossiga** para a Parte 2.

**Se tudo OK**, prossiga.

---

## 🎨 ETAPA B — Executar Parte 2 (reskin do quiz)

### Objetivo

Substituir `jogos/quiz-cm.html` pela versão "ACMP Quest" do código original que o usuário forneceu, **com 3 grupos de mudanças**:

1. **Corrigir bugs** (artefatos markdown que quebram CSS e JS)
2. **Reskin visual** para a paleta institucional do site
3. **Adicionar header** com link de volta para a área de membros

A persistência continua **só em `localStorage`** — integração Supabase é a Parte 3, não faça agora.

### B.1 — Bugs a corrigir (lista exaustiva)

O código original contém artefatos de auto-linkificação markdown. Substituições obrigatórias (todas em `jogos/quiz-cm.html` após a sobrescrita):

**CSS:**
- `.[mode-badge.hot](http://mode-badge.hot)` → `.mode-badge.hot`
- `.[mode-badge.new](http://mode-badge.new)` → `.mode-badge.new`
- `.[explanation.show](http://explanation.show)` → `.explanation.show`
- `.[next-btn.show](http://next-btn.show)` → `.next-btn.show`
- `.[rs-n.green](http://rs-n.green)` → `.rs-n.green`
- `.[prof-wrap.prof](http://prof-wrap.prof)-hidden` → `.prof-wrap.prof-hidden`
- `.[speech-bubble.show](http://speech-bubble.show)` → `.speech-bubble.show`

**JavaScript** (todas as ocorrências, `replace_all`):
- `[s.style](http://s.style)` → `s.style`
- `[player.name](http://player.name)` → `player.name`
- `[lvData.name](http://lvData.name)` → `lvData.name`
- `[q.a.map](http://q.a.map)` → `q.a.map`
- `[opts.map](http://opts.map)` → `opts.map`
- `[paired.map](http://paired.map)` → `paired.map`
- `[dc.bank](http://dc.bank)` → `dc.bank`
- `[h.style](http://h.style)` → `h.style`
- `[tw.style](http://tw.style)` → `tw.style`
- `[arc.style](http://arc.style)` → `arc.style`
- `[num.style](http://num.style)` → `num.style`
- `[d.style](http://d.style)` → `d.style`
- `[d.style.top](http://d.style.top)` → `d.style.top`
- `[c.style](http://c.style)` → `c.style`
- `[s.name](http://s.name)` → `s.name`
- `[s.date](http://s.date)` → `s.date`
- `[newAch.map](http://newAch.map)` → `newAch.map`

Após escrever, faça `grep -n "http://" jogos/quiz-cm.html` — só devem sobrar URLs reais (Google Fonts, Font Awesome). Nenhuma ocorrência do padrão `[xxx](http://xxx)` deve permanecer.

### B.2 — Reskin visual para paleta institucional

Trocar **completamente** o tema dark/cyberpunk pelo institucional do ACMP Brasil. Use as variáveis CSS já usadas em `css/styles.css`:

```css
:root {
  --primary: #1a3a5c;        /* navy institucional */
  --primary-dark: #0f2440;
  --primary-light: #2a5a8c;
  --secondary: #e8a838;      /* gold (substitui o teal/amber neon) */
  --secondary-dark: #d4922a;
  --accent: #28a745;         /* verde (correto) */
  --danger: #dc2626;         /* vermelho (errado) */
  --text-dark: #1a1a2e;
  --text-body: #4a4a5a;
  --text-light: #6b7280;
  --bg-white: #ffffff;
  --bg-light: #f8f9fc;       /* fundo geral */
  --bg-lighter: #eef1f6;
  --border: #e2e8f0;
  --border-light: #f0f0f5;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,.1);
  --shadow-lg: 0 8px 30px rgba(0,0,0,.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

**Tipografia:**
- Trocar Orbitron + Exo 2 + DM Mono pela **família única `Inter`** (já carregada no resto do site). Pesos 400/500/600/700/800. Para "destaques tipo display", usar `Inter 800` em vez de Orbitron.
- Carregar via `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap`.
- Remover Google Fonts antigos.

**Layout geral:**
- `body` em `var(--bg-light)`, **não** mais navy escuro.
- Remover `body::before` (scanlines), `#particles`, `.grid-bg` — visual limpo institucional.
- Cards (`.question-card`, `.diff-box`, `.result-box`, `.lb-box`, `.player-bar`, `.mode-card`) em `var(--bg-white)` com `var(--shadow-md)` e `border: 1px solid var(--border-light)`.
- Texto principal em `var(--text-dark)` / `var(--text-body)`; "dim" agora é `var(--text-light)`.
- Substituir todos os `rgba(0,224,200,*)` (teal neon) por gradientes/cores derivados de `--primary` / `--secondary`.

**Mode cards (home):**
- Sprint → accent `var(--primary)`, ícone Font Awesome `fa-bullseye`
- Lightning → accent `var(--secondary)`, ícone `fa-bolt`
- Connect → accent `var(--primary-light)`, ícone `fa-link`
- Boss → accent `var(--danger)`, ícone `fa-skull`

**Botões:**
- `.btn-primary` → fundo `var(--primary)`, texto branco, hover `var(--primary-light)`. Sem uppercase agressivo nem letter-spacing exagerado.
- `.btn-back`/`.ghost-btn` → outline `var(--primary)`, texto `var(--primary)`.
- `.next-btn` → mesmo padrão do `.btn-primary`.

**Estados de resposta:**
- `.opt.correct` → border + bg suave em `var(--accent)` (`#dcfce7`).
- `.opt.wrong` → border + bg suave em `var(--danger)` (`#fee2e2`).
- Manter o `shake` e `correct-flash`, só ajustar as cores das bordas.

**Grades de resultado:**
- S/A → `var(--accent)`
- B → `var(--secondary)`
- C → `var(--primary-light)`
- F/DERROTA → `var(--danger)`
- Remover os `text-shadow` neon.

**HUD do jogo:**
- Background branco com `border-bottom: 1px solid var(--border)`, sombras suaves. Sem `backdrop-filter`.
- Timer ring: trilho `var(--bg-lighter)`, preenchimento `var(--primary)` → `var(--secondary)` (≤10s) → `var(--danger)` (≤5s).

**Mascote Prof. CM:**
- Manter a estrutura completa em CSS puro (toda a `.prof-wrap` e suas peças).
- Recolorir:
  - Toga/corpo (`.p-body`, `.p-hat-brim`, `.p-hat-crown`, `.p-leg`, `.p-shoe`): `var(--primary-dark)` em vez de `#0a1628`/`#0D1E35`.
  - Tassel, hat-star, bowtie, pocket-pen: `var(--secondary)`.
  - Óculos (`.p-glass`): borda `var(--primary)`.
  - Bordas dos balões por estado: correct `var(--accent)`, wrong `var(--danger)`, explain/excited/boss `var(--secondary)`, thinking `var(--primary-light)`, result `var(--primary)`.
- Pele e expressões inalteradas.

**Confetti:** trocar paleta para `['#1a3a5c','#e8a838','#28a745','#2a5a8c','#d4922a']`.

### B.3 — Header de retorno + título

Adicionar no topo da página (antes de `#homeScreen`), no mesmo padrão do `quiz-cm.html` original:

```html
<div class="quiz-header">
  <a href="/membros/"><i class="fas fa-arrow-left"></i> Voltar à Área do Associado</a>
</div>
```

Estilizar:
```css
.quiz-header { background: var(--primary-dark); padding: 14px 0; text-align: center; position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
.quiz-header a { color: rgba(255,255,255,.85); font-size: .85rem; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
.quiz-header a:hover { color: white; }
```

E acrescentar `padding-top: 50px` aos `.screen` (exceto `#gameScreen` que já tem o HUD próprio — nele, o HUD desce 50px também).

Atualizar o `<title>` para `ACMP Quest — Treinamento CCMP | ACMP Brasil` e adicionar `<link rel="icon" type="image/png" href="/img/logo-acmp-brasil.png">` e Font Awesome:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

Onde fizer sentido, substituir emojis estruturais por ícones Font Awesome (modo cards, header de seções, botões). **Manter** os emojis das mensagens do Prof. CM e dos achievements — eles fazem parte do tom do jogo.

### B.4 — Persistência

**Não** introduzir Supabase nesta parte. Manter exatamente o esquema atual de `localStorage` (`acmp_player`). Isso garante que o ficheiro funciona standalone e pode ser testado sem login.

### B.5 — O que **não** mudar

- Banco de perguntas (`QB.easy`, `QB.medium`, `QB.hard`, `QB.connect`) — texto idêntico.
- Lógica dos modos (Sprint, Lightning, Connect, Boss).
- Sistema de XP, níveis (`LEVELS`), achievements, streaks.
- Estrutura HTML do mascote.
- Configuração `MODE_CONFIG` / `DIFF_CONFIG`.

---

## ✅ ETAPA C — Validação local

1. `grep -c '\[.*\](http://' jogos/quiz-cm.html` → deve retornar `0`.
2. Abrir o arquivo no navegador (ou inspeção visual via Read) e confirmar que:
   - Carrega na home sem erros no console (verificar via raciocínio sobre o código — sem botar `<script>` quebrado).
   - Estilo claro, fontes Inter, accent navy + gold.
   - Botão "Voltar à Área do Associado" no topo.
3. `git diff --stat HEAD` — esperado: `jogos/quiz-cm.html` modificado (delta grande).

---

## 📦 ETAPA D — Commit e push

```bash
git add jogos/quiz-cm.html
git commit -m "$(cat <<'EOF'
feat: Reskin quiz-cm to ACMP Quest with institutional palette

Replaces the simple 15-question quiz with the ACMP Quest gamified
experience (4 modes, XP/levels, achievements, animated Prof. CM
mascot). Fixes ~25 markdown-link artifacts that broke CSS/JS in the
source, swaps the cyberpunk theme for the site's institutional palette
(Inter, navy #1a3a5c, gold #e8a838) and adds the standard "Voltar à
Área do Associado" header.

Persistence is still localStorage-only; Supabase integration follows
in Part 3.

Part 2 of 4 for the ACMP Quest integration.
EOF
)"
git push -u origin claude/review-html-code-vpFFP
```

**Não** abrir Pull Request. **Não** mexer em outros arquivos. **Não** criar arquivos novos nesta parte.

---

## 🛑 Limites desta tarefa

- **Não** integrar Supabase (Parte 3).
- **Não** alterar `membros/index.html` (Parte 4).
- **Não** alterar o banco de perguntas.
- **Não** remover modos, achievements ou o mascote.
- Ao terminar, reporte em até 5 linhas: arquivos alterados, commit hash, e qualquer ajuste que tenha feito além do escrito acima.
