/*
 * Chat do Assistente de Vendas (Lia) — Marcelly Lemes | Gestão & IA
 * Uso: salve este arquivo no repositório do site e adicione, antes de </body>:
 *   <script src="chat.js" defer></script>
 */
(function () {
  // ============ PARTE PARA EDITAR ============
  // Cole aqui o endereço do seu Worker (aparece no painel da Cloudflare após o Deploy)
  const API = "https://marcellypessoal.edusiaia.workers.dev";
  const TITULO = "Fale com a Lia | Gestão & IA";
  const SAUDACAO =
    "Olá! Eu sou a Lia, assistente da Marcelly Lemes. Posso te ajudar a escolher o melhor serviço de gestão e IA para o seu negócio. Como posso ajudar?";
  const WHATSAPP = "https://wa.me/5519999999999"; // usado se o chat ficar fora do ar

  // Cada texto precisa contrastar bem com o fundo atrás dele
  const CORES = {
    principal: "#1e3a8a",           // botão redondo, botão Enviar e suas mensagens
    textoSobrePrincipal: "#ffffff", // texto em cima da cor principal
    fundo: "#ffffff",               // janela do chat e campo de digitação
    texto: "#1a1a1a",               // respostas e o que o visitante digita
    balaoResposta: "#eef1f6",       // fundo das respostas da IA
    textoApagado: "#5b6475",        // texto de exemplo no campo
    borda: "#d6dbe4",
  };
  // ============ FIM DA PARTE PARA EDITAR ============

  // Evita criar o chat duas vezes se o script for incluído em duplicidade
  if (window.__chatVendasCarregado) return;
  window.__chatVendasCarregado = true;

  const C = CORES;
  const historico = [];
  const API_CONFIGURADA = !API.includes("SEU-SUBDOMINIO");

  function iniciar() {
    const css = document.createElement("style");
    css.textContent = `
      #cv-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;
        border:2px solid ${C.textoSobrePrincipal};background:${C.principal};color:${C.textoSobrePrincipal};
        font-size:26px;line-height:1;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.35);z-index:9999}
      #cv-btn:focus-visible,#cv-fechar:focus-visible,#cv-enviar:focus-visible{outline:3px solid ${C.principal};outline-offset:2px}
      #cv-box{position:fixed;bottom:90px;right:20px;width:340px;max-width:calc(100vw - 40px);
        height:460px;max-height:calc(100vh - 110px);background:${C.fundo};color:${C.texto};
        border:1px solid ${C.borda};border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);
        display:none;flex-direction:column;overflow:hidden;z-index:9999;
        font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
      #cv-box.aberto{display:flex}
      #cv-topo{background:${C.principal};color:${C.textoSobrePrincipal};padding:12px 16px;font-weight:600;
        display:flex;align-items:center;justify-content:space-between;gap:8px}
      #cv-fechar{background:none;border:none;color:${C.textoSobrePrincipal};font-size:22px;line-height:1;
        cursor:pointer;padding:0 4px}
      #cv-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
      .cv-m{padding:8px 12px;border-radius:10px;max-width:85%;line-height:1.45;font-size:14px;
        white-space:pre-wrap;overflow-wrap:anywhere}
      .cv-user{background:${C.principal};color:${C.textoSobrePrincipal};align-self:flex-end}
      .cv-bot{background:${C.balaoResposta};color:${C.texto};align-self:flex-start}
      #cv-form{display:flex;border-top:1px solid ${C.borda};margin:0}
      #cv-input{flex:1;min-width:0;border:none;padding:12px;font:inherit;font-size:16px;outline:none;
        background:${C.fundo};color:${C.texto}}
      #cv-input::placeholder{color:${C.textoApagado};opacity:1}
      #cv-input:focus{box-shadow:inset 0 0 0 2px ${C.principal}}
      #cv-enviar{border:none;background:${C.principal};color:${C.textoSobrePrincipal};font:inherit;
        font-size:14px;font-weight:600;padding:0 16px;cursor:pointer}
      #cv-enviar:disabled{opacity:.6;cursor:wait}
      @media (max-width:480px){#cv-box{right:10px;bottom:84px;max-width:calc(100vw - 20px)}}
    `;
    document.head.appendChild(css);

    // &#128172; = emoji de balão de conversa (evita problema de acentuação/codificação)
    document.body.insertAdjacentHTML("beforeend", `
      <button id="cv-btn" type="button" aria-label="Abrir chat" aria-expanded="false" aria-controls="cv-box">&#128172;</button>
      <div id="cv-box" role="dialog" aria-labelledby="cv-titulo">
        <div id="cv-topo">
          <span id="cv-titulo"></span>
          <button id="cv-fechar" type="button" aria-label="Fechar chat">&times;</button>
        </div>
        <div id="cv-msgs" aria-live="polite"></div>
        <form id="cv-form">
          <input id="cv-input" type="text" placeholder="Digite sua pergunta..." maxlength="800"
            autocomplete="off" aria-label="Sua pergunta">
          <button id="cv-enviar" type="submit">Enviar</button>
        </form>
      </div>`);

    const btn = document.getElementById("cv-btn");
    const box = document.getElementById("cv-box");
    const msgs = document.getElementById("cv-msgs");
    const input = document.getElementById("cv-input");
    const btnEnviar = document.getElementById("cv-enviar");
    document.getElementById("cv-titulo").textContent = TITULO;

    function adicionar(texto, classe) {
      const div = document.createElement("div");
      div.className = "cv-m " + classe;
      div.textContent = texto; // textContent impede que alguém injete HTML
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
      return div;
    }

    function abrirFechar(abrir) {
      box.classList.toggle("aberto", abrir);
      btn.setAttribute("aria-expanded", String(abrir));
      btn.setAttribute("aria-label", abrir ? "Fechar chat" : "Abrir chat");
      if (abrir) {
        if (!msgs.children.length) adicionar(SAUDACAO, "cv-bot");
        input.focus();
      } else {
        btn.focus();
      }
    }

    btn.addEventListener("click", () => abrirFechar(!box.classList.contains("aberto")));
    document.getElementById("cv-fechar").addEventListener("click", () => abrirFechar(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && box.classList.contains("aberto")) abrirFechar(false);
    });

    document.getElementById("cv-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const texto = input.value.trim();
      if (!texto || btnEnviar.disabled) return;

      input.value = "";
      adicionar(texto, "cv-user");

      if (!API_CONFIGURADA) {
        adicionar("O chat ainda não foi configurado. Fale com a gente pelo WhatsApp: " + WHATSAPP, "cv-bot");
        console.warn("[chat-vendas] Troque o endereço da constante API pelo endereço do seu Worker.");
        return;
      }

      btnEnviar.disabled = true;
      historico.push({ role: "user", content: texto });
      const aguardando = adicionar("Digitando...", "cv-bot");

      try {
        const r = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historico.slice(-10) }), // o Worker usa só as 10 últimas
        });

        let dados = {};
        try {
          dados = await r.json();
        } catch (_) {
          dados = {};
        }

        if (r.ok && dados.resposta) {
          aguardando.textContent = dados.resposta;
          historico.push({ role: "assistant", content: dados.resposta });
        } else {
          aguardando.textContent =
            (dados.erro || "Não consegui responder agora.") + " WhatsApp: " + WHATSAPP;
          historico.pop();
        }
      } catch (_) {
        aguardando.textContent = "Erro de conexão. Tente novamente ou chame no WhatsApp: " + WHATSAPP;
        historico.pop();
      } finally {
        btnEnviar.disabled = false;
        input.focus();
      }
    });
  }

  // Garante que a página já carregou antes de criar o chat
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
