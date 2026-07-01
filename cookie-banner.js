// =====================================================
// Cookie Banner — LGPD
// - Mostra banner na primeira visita
// - Salva consentimento no localStorage
// - BLOQUEIA analytics quando consent não for "accepted"
//   (intercepta window.fetch para /functions/v1/analytics
//    quando consent está rejected/inexistente)
// =====================================================
;(function () {
  'use strict';

  const CONSENT_KEY = 'paulo_cookie_consent';
  const STYLES_ID = 'cookie-banner-styles';
  // Caminho da Edge Function de analytics. Bloqueamos requisições para cá
  // quando o usuário recusou cookies (ou ainda não decidiu).
  const ANALYTICS_PATH = '/functions/v1/analytics';

  if (document.getElementById('cookie-banner')) return;

  // CSS injetado uma vez só (reusa tokens do style.css)
  if (!document.getElementById(STYLES_ID)) {
    const css = document.createElement('style');
    css.id = STYLES_ID;
    css.textContent = `
      #cookie-banner {
        position: fixed;
        left: 16px; right: 16px; bottom: 16px;
        max-width: 720px; margin: 0 auto;
        background: #0a0a0a;
        border: 1px solid #00ff41;
        box-shadow: 0 0 24px rgba(0, 255, 65, 0.25);
        padding: 1rem 1.25rem;
        z-index: 9999;
        font-family: 'JetBrains Mono', monospace;
        color: #d0d0d0;
        display: flex; flex-direction: column; gap: 0.75rem;
      }
      #cookie-banner p { margin: 0; font-size: 0.85rem; line-height: 1.5; }
      #cookie-banner a { color: #00ff41; border-bottom: 1px dashed #00ff41; }
      #cookie-banner a:hover { background: rgba(0, 255, 65, 0.1); }
      #cookie-banner .cookie-actions {
        display: flex; gap: 0.5rem; flex-wrap: wrap;
      }
      #cookie-banner button {
        background: transparent;
        color: #00ff41;
        border: 1px solid #00ff41;
        padding: 0.5rem 1rem;
        font-family: inherit;
        font-size: 0.85rem;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      #cookie-banner button:hover { background: #00ff41; color: #000; }
      #cookie-banner button.reject { color: #888; border-color: #444; }
      #cookie-banner button.reject:hover { background: #444; color: #fff; }
      @media (max-width: 480px) {
        #cookie-banner { left: 8px; right: 8px; bottom: 8px; padding: 0.85rem 1rem; }
        #cookie-banner .cookie-actions { width: 100%; }
        #cookie-banner button { flex: 1; }
      }
    `;
    document.head.appendChild(css);
  }

  // Estado de consentimento
  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); }
    catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch (e) { /* ignore */ }
  }

  // =====================================================
  // INTERCEPTAÇÃO DE window.fetch
  // Bloqueia requisições de analytics enquanto consent não for "accepted".
  // Isso resolve o bug de o `trackPageView` em script.js disparar antes
  // do usuário decidir, ou após ele recusar.
  // =====================================================
  if (!window.__cookieBannerFetchPatched) {
    window.__cookieBannerFetchPatched = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      let url = '';
      try {
        url = typeof input === 'string' ? input : (input && input.url) || '';
      } catch (e) { /* ignore */ }
      const isAnalytics = url.indexOf(ANALYTICS_PATH) !== -1;
      const consent = getConsent();
      if (isAnalytics && consent !== 'accepted') {
        // Bloqueia silenciosamente. Retorna uma Promise resolvida com uma
        // Response fake para que o `.then(...)` do chamador não quebre.
        return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content (consent required)' }));
      }
      return originalFetch(input, init);
    };
  }

  // Se já decidiu antes, não mostra o banner (mas o fetch já está patchado).
  const prior = getConsent();
  if (prior === 'accepted' || prior === 'rejected') return;

  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Aviso de cookies');

  banner.innerHTML = `
    <p>
      <strong style="color:#00ff41">$ aviso/cookies:</strong>
      Este site usa cookies para análise de visitas. Ao aceitar, você concorda com a nossa
      <a href="cookies.html">política de cookies</a> e com a
      <a href="politica.html">política de privacidade</a>. Recusar é igualmente válido.
    </p>
    <div class="cookie-actions">
      <button type="button" data-action="accept">[ ACEITAR ]</button>
      <button type="button" class="reject" data-action="reject">[ RECUSAR ]</button>
      <a href="cookies.html" style="margin-left:auto;align-self:center;font-size:0.8rem;">Saiba mais</a>
    </div>
  `;

  // XSS-safe: o innerHTML acima é estático (sem interpolação de input externo).
  document.body.appendChild(banner);

  banner.addEventListener('click', function (ev) {
    const t = ev.target.closest('button[data-action]');
    if (!t) return;
    const action = t.dataset.action;
    setConsent(action === 'accept' ? 'accepted' : 'rejected');
    banner.remove();
    // Expõe decisão global para outros scripts.
    window.dispatchEvent(new CustomEvent('cookieConsent', { detail: { value: action === 'accept' ? 'accepted' : 'rejected' } }));
    // Se aceitou, recarrega para que o trackPageView pendente rode de novo.
    // (Não recarregamos no reject — o fetch já está bloqueado para próximos eventos.)
    if (action === 'accept') {
      // Pequeno delay para o usuário ver o banner sumir
      setTimeout(function () { location.reload(); }, 200);
    }
  });
})();
