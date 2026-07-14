/* =========================================================
   kaafpk — cart.js
   Slide-out cart drawer via Shopify Section Rendering API.
   Bundle discount nudge is computed in Liquid (see
   sections/cart-drawer.liquid). Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var routes = (window.KAAF && window.KAAF.routes) || {};
  var SECTION = 'cart-drawer';

  function el(id) { return document.getElementById(id); }
  function overlay() { return el('DrawerOverlay'); }

  function openDrawer() {
    var d = el('CartDrawer');
    if (!d) return;
    d.classList.add('is-open');
    d.setAttribute('aria-hidden', 'false');
    if (overlay()) overlay().classList.add('is-open');
    document.body.classList.add('drawer-open');
    var f = d.querySelector('button, a');
    if (f) f.focus();
  }

  function closeDrawers() {
    document.querySelectorAll('.drawer.is-open').forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
    if (overlay()) overlay().classList.remove('is-open');
    document.body.classList.remove('drawer-open');
  }

  function toast(msg) {
    var t = el('KaafToast');
    if (!t) { t = document.createElement('div'); t.id = 'KaafToast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-visible'); }, 2400);
  }

  function updateCounts(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (c) {
      c.textContent = count;
      c.hidden = count < 1;
    });
  }

  /* Swap the drawer inner content from a Section Rendering API payload */
  function applySection(html) {
    if (!html) return;
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var fresh = doc.querySelector('[data-cart-contents]');
    var current = document.querySelector('[data-cart-contents]');
    if (fresh && current) current.innerHTML = fresh.innerHTML;
    var countEl = doc.querySelector('[data-cart-count]');
    if (countEl) updateCounts(parseInt(countEl.textContent, 10) || 0);
  }

  function fetchSection() {
    return fetch(routes.cart + '?section_id=' + SECTION, { headers: { 'Accept': 'text/html' } })
      .then(function (r) { return r.text(); })
      .then(applySection);
  }

  /* ---------- Add to cart ---------- */
  function addToCart(formData, btn) {
    formData.append('sections', SECTION);
    formData.append('sections_url', window.location.pathname);
    if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.dataset.loading = '1'; }
    return fetch(routes.cartAdd, { method: 'POST', headers: { 'Accept': 'application/json' }, body: formData })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) { throw new Error((res.data && res.data.description) || 'Could not add to cart'); }
        addToCart._last = res.data; // added line item(s), used by the Meta Pixel bridge
        if (res.data.sections && res.data.sections[SECTION]) applySection(res.data.sections[SECTION]);
        else return fetchSection();
      })
      .then(function () {
        openDrawer();
        if (window.KAAF && typeof window.KAAF.trackAddToCart === 'function' && addToCart._last) {
          window.KAAF.trackAddToCart(addToCart._last);
        }
      })
      .catch(function (err) { toast(err.message || 'Something went wrong'); })
      .finally(function () { if (btn) { btn.removeAttribute('aria-disabled'); delete btn.dataset.loading; } });
  }

  function changeLine(key, quantity) {
    return fetch(routes.cartChange, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity, sections: SECTION, sections_url: window.location.pathname })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.sections && data.sections[SECTION]) applySection(data.sections[SECTION]);
        else return fetchSection();
      })
      .catch(function () { toast('Could not update bag'); });
  }

  /* ---------- Events ---------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[action*="/cart/add"], form[data-atc]');
    if (!form) return;
    e.preventDefault();
    var btn = form.querySelector('[type="submit"], [data-atc-btn]');
    if (btn && btn.getAttribute('aria-disabled') === 'true') return;
    addToCart(new FormData(form), btn);
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      openDrawer();
      fetchSection();
      return;
    }
    if (e.target.closest('[data-drawer-close]') || e.target === overlay()) { closeDrawers(); return; }

    var line = e.target.closest('.cart-line');
    if (line) {
      var key = line.getAttribute('data-line-key');
      var qtyWrap = line.querySelector('.cart-line__qty');
      var current = qtyWrap ? parseInt(qtyWrap.querySelector('span').textContent, 10) : 1;
      if (e.target.closest('[data-qty-up]')) changeLine(key, current + 1);
      else if (e.target.closest('[data-qty-down]')) changeLine(key, Math.max(0, current - 1));
      else if (e.target.closest('[data-remove]')) changeLine(key, 0);
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawers(); });

  window.KAAF = window.KAAF || {};
  window.KAAF.cart = {
    open: function () { openDrawer(); fetchSection(); },
    close: closeDrawers,
    refresh: fetchSection,
    addToCart: addToCart
  };
})();
