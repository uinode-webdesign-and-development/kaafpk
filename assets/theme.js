/* =========================================================
   kaafpk — theme.js
   General UI: nav, sticky CTA, gallery, variants, size guide,
   delivery estimate, reveal-on-scroll. Vanilla JS.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Generic drawer openers (mobile nav, size guide) ---------- */
  function openDrawer(el) {
    if (!el) return;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    var overlay = document.getElementById('DrawerOverlay');
    if (overlay) overlay.classList.add('is-open');
    document.body.classList.add('drawer-open');
    var f = el.querySelector('button, a, input, select');
    if (f) f.focus();
  }
  function closeAll() {
    document.querySelectorAll('.drawer.is-open, .mobile-nav.is-open').forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
    var overlay = document.getElementById('DrawerOverlay');
    if (overlay) overlay.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-target]');
    if (t) { e.preventDefault(); openDrawer(document.getElementById(t.getAttribute('data-open-target'))); return; }
    if (e.target.closest('[data-drawer-close]')) { closeAll(); }
  });

  /* ---------- Mobile nav ---------- */
  var burger = document.querySelector('[data-mobile-nav-open]');
  var mobileNav = document.getElementById('MobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      mobileNav.classList.add('is-open');
      mobileNav.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drawer-open');
    });
  }

  /* ---------- Sticky "Shop Now" (homepage hero) ---------- */
  var stickyShop = document.querySelector('[data-sticky-shop]');
  var hero = document.querySelector('[data-hero]');
  if (stickyShop && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      stickyShop.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-revealed'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  /* ---------- Product gallery ---------- */
  document.querySelectorAll('[data-gallery]').forEach(function (gallery) {
    var slides = gallery.querySelectorAll('.product-gallery__slide');
    var thumbs = gallery.querySelectorAll('.product-gallery__thumb');
    function activate(i) {
      slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
      thumbs.forEach(function (t, idx) {
        var on = idx === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    thumbs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(i); });
    });
  });

  /* ---------- Variant selector (product page) ---------- */
  document.querySelectorAll('[data-product-form]').forEach(function (form) {
    var dataEl = document.getElementById(form.getAttribute('data-variants-id'));
    if (!dataEl) return;
    var variants = JSON.parse(dataEl.textContent);
    // Products with only a default variant have no option inputs — nothing to wire.
    if (!form.querySelector('[data-option-index]')) return;
    var idInput = form.querySelector('[data-variant-id]');
    var priceEl = document.querySelector('[data-product-price]');
    var compareEl = document.querySelector('[data-product-compare]');
    var atcBtn = form.querySelector('[data-atc-btn]');
    var atcText = atcBtn ? atcBtn.querySelector('[data-atc-text]') : null;
    var stickyPrice = document.querySelector('[data-sticky-price]');
    var moneyFormat = (window.KAAF && window.KAAF.moneyFormat) || 'Rs {{amount}}';

    function money(cents) {
      var v = cents / 100;
      var s = v % 1 === 0 ? v.toLocaleString('en-PK') : v.toFixed(2);
      return moneyFormat.replace(/\{\{\s*amount(_no_decimals|_with_comma_separator)?\s*\}\}/g, s);
    }

    function selectedOptions() {
      return Array.prototype.map.call(form.querySelectorAll('[data-option-index]'), function (input) {
        if (input.type === 'radio') {
          var checked = form.querySelector('[name="' + input.name + '"]:checked');
          return checked ? checked.value : null;
        }
        return input.value;
      }).filter(function (v, i, a) { return a.indexOf(v) === i || v !== null; });
    }

    function currentSelections() {
      var sels = [];
      form.querySelectorAll('[data-option-index]').forEach(function (input) {
        var idx = parseInt(input.getAttribute('data-option-index'), 10);
        if (input.type === 'radio') {
          if (input.checked) sels[idx] = input.value;
        } else {
          sels[idx] = input.value;
        }
      });
      return sels;
    }

    function findVariant(sels) {
      return variants.find(function (v) {
        return v.options.every(function (opt, i) { return String(opt) === String(sels[i]); });
      });
    }

    function updateAvailability(sels) {
      // Grey out sizes with no available variant given other selections
      form.querySelectorAll('[data-option-index]').forEach(function (input) {
        if (input.type !== 'radio') return;
        var idx = parseInt(input.getAttribute('data-option-index'), 10);
        var testSels = sels.slice();
        testSels[idx] = input.value;
        var match = variants.find(function (v) {
          return v.options.every(function (opt, i) { return i === idx ? String(opt) === String(input.value) : (testSels[i] == null || String(opt) === String(testSels[i])); });
        });
        input.disabled = !(match && match.available);
      });
    }

    function update() {
      var sels = currentSelections();
      updateAvailability(sels);
      var variant = findVariant(sels);
      if (!variant) {
        if (atcBtn) { atcBtn.setAttribute('aria-disabled', 'true'); if (atcText) atcText.textContent = 'Unavailable'; }
        return;
      }
      if (idInput) idInput.value = variant.id;
      if (priceEl) priceEl.textContent = money(variant.price);
      if (stickyPrice) stickyPrice.textContent = money(variant.price);
      if (compareEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          compareEl.textContent = money(variant.compare_at_price);
          compareEl.hidden = false;
        } else { compareEl.hidden = true; }
      }
      if (atcBtn) {
        if (variant.available) {
          atcBtn.removeAttribute('aria-disabled');
          if (atcText) atcText.textContent = atcBtn.getAttribute('data-atc-label') || 'Add to cart';
        } else {
          atcBtn.setAttribute('aria-disabled', 'true');
          if (atcText) atcText.textContent = 'Sold out';
        }
      }
      // reflect variant in URL for shareability
      if (history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState({}, '', url.toString());
      }
    }

    form.querySelectorAll('[data-option-index]').forEach(function (input) {
      input.addEventListener('change', update);
    });
    update();
  });

  /* ---------- Quantity stepper ---------- */
  document.querySelectorAll('[data-qty]').forEach(function (wrap) {
    var input = wrap.querySelector('input');
    wrap.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = btn.hasAttribute('data-qty-plus') ? 1 : -1;
        var val = Math.max(1, (parseInt(input.value, 10) || 1) + step);
        input.value = val;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  /* ---------- Sticky mobile add-to-cart (product) ---------- */
  var stickyAtc = document.querySelector('[data-sticky-atc]');
  var atcAnchor = document.querySelector('[data-atc-anchor]');
  if (stickyAtc && atcAnchor && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      stickyAtc.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(atcAnchor);
    // Sticky button submits the real product form
    var stickyBtn = stickyAtc.querySelector('[data-sticky-atc-btn]');
    var realForm = document.querySelector('[data-product-form]');
    if (stickyBtn && realForm) {
      stickyBtn.addEventListener('click', function () {
        if (realForm.requestSubmit) realForm.requestSubmit();
        else realForm.querySelector('[type="submit"]').click();
      });
    }
  }

  /* ---------- Delivery estimate by city ---------- */
  document.querySelectorAll('[data-delivery]').forEach(function (block) {
    var select = block.querySelector('select');
    var result = block.querySelector('[data-delivery-result]');
    if (!select || !result) return;
    var metroDays = block.getAttribute('data-metro-days');
    var otherDays = block.getAttribute('data-other-days');
    var metroCities = (block.getAttribute('data-metro-cities') || '').split(',').map(function (c) { return c.trim().toLowerCase(); });
    function compute() {
      var city = select.value;
      if (!city) { result.innerHTML = ''; return; }
      var isMetro = metroCities.indexOf(city.toLowerCase()) !== -1;
      var days = isMetro ? metroDays : otherDays;
      result.innerHTML = 'Delivery to <strong>' + city + '</strong>: <strong>' + days + '</strong>' + (isMetro ? ' — express metro route' : '');
      try { localStorage.setItem('kaaf_city', city); } catch (e) {}
    }
    select.addEventListener('change', compute);
    try {
      var saved = localStorage.getItem('kaaf_city');
      if (saved && Array.prototype.some.call(select.options, function (o) { return o.value === saved; })) {
        select.value = saved; compute();
      }
    } catch (e) {}
  });

  /* ---------- Newsletter (footer) inline confirmation ---------- */
  document.querySelectorAll('[data-newsletter]').forEach(function (form) {
    form.addEventListener('submit', function () {
      // Shopify handles the POST; we just give instant feedback via native flow.
    });
  });

})();
