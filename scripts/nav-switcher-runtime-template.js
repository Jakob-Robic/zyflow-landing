/**
 * Desktop nav pill language switcher (inlined at build time).
 * Injects into Center pill after Framer hydration; tablet/phone use #zf-switcher-portal.
 */
(function () {
  "use strict";

  var SL = __ZF_SL_LOCALE__;
  var EN = __ZF_EN_LOCALE__;
  var DESKTOP_MIN = 1200;
  var HYDRATION_DELAY_MS = 300;
  var OBSERVER_MS = 15000;
  var MENU_ID = "zf-nav-lang-menu";

  var wrapClass = "zf-nav-switcher-wrap";
  var injected = false;
  var pillObserver = null;
  var pillObserverTimer = null;
  var mobileObserver = null;
  var mobileObserverTimer = null;
  var bodyMenu = null;
  var activeBtn = null;
  var repositionHandler = null;

  function isDesktop() {
    return window.innerWidth >= DESKTOP_MIN;
  }

  function isMobileLayout() {
    return window.innerWidth < DESKTOP_MIN;
  }

  function getPortal() {
    return document.getElementById("zf-switcher-portal");
  }

  function getCenterPill() {
    var nav = document.querySelector('nav[data-framer-name="Default"]');
    if (!nav) return null;
    var center = nav.querySelector('[data-framer-name="Center"]');
    if (!center) return null;
    return (
      center.querySelector('.framer-bdVR3[data-framer-name="Default"]') ||
      center.querySelector('[data-framer-name="Default"]')
    );
  }

  function currentLangCode() {
    return window.location.pathname.startsWith("/sl") ? "SL" : "EN";
  }

  function isSlPath() {
    return window.location.pathname.startsWith("/sl");
  }

  function menuLabels() {
    return {
      en: (SL && SL["nav.lang.en"]) || (EN && EN["nav.lang.en"]) || "English",
      sl: (SL && SL["nav.lang.sl"]) || (EN && EN["nav.lang.sl"]) || "Slovenščina",
    };
  }

  function switcherHtml() {
    var code = currentLangCode();
    return (
      '<div class="' +
      wrapClass +
      '">' +
      '<div class="zf-nav-sep"></div>' +
      '<div class="zf-lang-switcher" role="navigation" aria-label="Language">' +
      '<button class="zf-lang-btn" type="button" aria-expanded="false" aria-haspopup="listbox" aria-controls="' +
      MENU_ID +
      '">' +
      '<span class="zf-lang-current">' +
      code +
      "</span>" +
      '<svg class="zf-lang-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
      '<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>' +
      "</svg>" +
      "</button>" +
      "</div></div>"
    );
  }

  function removeBodyMenu() {
    if (repositionHandler) {
      window.removeEventListener("resize", repositionHandler);
      window.removeEventListener("scroll", repositionHandler, true);
      repositionHandler = null;
    }
    var existing = document.getElementById(MENU_ID);
    if (existing) existing.remove();
    bodyMenu = null;
    activeBtn = null;
  }

  function ensureBodyMenu() {
    if (bodyMenu && document.body.contains(bodyMenu)) return bodyMenu;

    var labels = menuLabels();
    var menu = document.createElement("ul");
    menu.id = MENU_ID;
    menu.className = "zf-lang-menu zf-nav-lang-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;

    ["en", "sl"].forEach(function (lang) {
      var li = document.createElement("li");
      li.setAttribute("role", "option");
      li.dataset.lang = lang;
      li.textContent = labels[lang];
      menu.appendChild(li);
    });

    document.body.appendChild(menu);
    bodyMenu = menu;
    return menu;
  }

  function positionBodyMenu(btn, menu) {
    var rect = btn.getBoundingClientRect();
    menu.style.top = rect.bottom + 8 + "px";
    menu.style.left = rect.left + rect.width / 2 + "px";
    menu.style.transform = "translateX(-50%)";
  }

  function closeMenu() {
    if (activeBtn) activeBtn.setAttribute("aria-expanded", "false");
    if (bodyMenu) bodyMenu.hidden = true;
    activeBtn = null;
  }

  function openMenu(btn, menu) {
    activeBtn = btn;
    positionBodyMenu(btn, menu);
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;
  }

  function bindReposition(btn, menu) {
    if (repositionHandler) return;
    repositionHandler = function () {
      if (!activeBtn || !bodyMenu || bodyMenu.hidden) return;
      positionBodyMenu(activeBtn, bodyMenu);
    };
    window.addEventListener("resize", repositionHandler);
    window.addEventListener("scroll", repositionHandler, true);
  }

  function attachHandlers(switcher) {
    if (!switcher || switcher.getAttribute("data-zf-nav-bound") === "1") return;
    switcher.setAttribute("data-zf-nav-bound", "1");

    var btn = switcher.querySelector(".zf-lang-btn");
    if (!btn) return;

    var menu = ensureBodyMenu();
    var isSL = isSlPath();

    menu.querySelectorAll("li").forEach(function (li) {
      if (li.dataset.lang === (isSL ? "sl" : "en")) {
        li.setAttribute("aria-selected", "true");
      } else {
        li.removeAttribute("aria-selected");
      }
    });

    bindReposition(btn, menu);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = btn.getAttribute("aria-expanded") === "true";
      if (open) {
        closeMenu();
      } else {
        openMenu(btn, menu);
      }
    });

    if (!document.documentElement.getAttribute("data-zf-nav-menu-doc-click")) {
      document.documentElement.setAttribute("data-zf-nav-menu-doc-click", "1");
      document.addEventListener("click", function () {
        closeMenu();
      });
    }

    menu.querySelectorAll("li").forEach(function (li) {
      if (li.getAttribute("data-zf-nav-li-bound") === "1") return;
      li.setAttribute("data-zf-nav-li-bound", "1");
      li.addEventListener("click", function (e) {
        e.stopPropagation();
        if (li.dataset.lang === (isSL ? "sl" : "en")) {
          closeMenu();
          return;
        }
        var currentPath = location.pathname.replace(/\/index\.html$/, "/") || "/";
        var target;
        if (li.dataset.lang === "sl" && !isSL) {
          var enPath = currentPath.replace(/\.html$/, "") || "/";
          target = enPath === "/" ? "/sl/" : "/sl" + enPath;
        } else if (li.dataset.lang === "en" && isSL) {
          target = currentPath.replace(/^\/sl/, "") || "/";
          if (target !== "/" && !target.endsWith(".html")) target += "/";
        } else {
          return;
        }
        location.href = target;
      });
    });
  }

  function setPortalVisible(visible) {
    var portal = getPortal();
    if (!portal) return;
    if (visible) {
      portal.style.display = "";
      portal.style.removeProperty("display");
    } else {
      portal.style.display = "none";
    }
  }

  function setInjectedVisible(visible) {
    var wrap = document.querySelector("." + wrapClass);
    if (!wrap) return;
    wrap.style.display = visible ? "" : "none";
    if (!visible) closeMenu();
  }

  function inject() {
    if (!isDesktop()) return false;
    var centerPill = getCenterPill();
    if (!centerPill) return false;

    var existing = centerPill.querySelector("." + wrapClass);
    if (existing) {
      attachHandlers(existing.querySelector(".zf-lang-switcher"));
      injected = true;
      setPortalVisible(false);
      setInjectedVisible(true);
      scheduleNavHighlightSync();
      return true;
    }

    centerPill.insertAdjacentHTML("beforeend", switcherHtml());
    var wrap = centerPill.querySelector("." + wrapClass);
    if (!wrap) return false;

    attachHandlers(wrap.querySelector(".zf-lang-switcher"));
    injected = true;
    setPortalVisible(false);
    setInjectedVisible(true);
    startPillObserver(centerPill);
    scheduleNavHighlightSync();
    return true;
  }

  function removeInjected() {
    closeMenu();
    var wrap = document.querySelector("." + wrapClass);
    if (wrap) wrap.remove();
    removeBodyMenu();
    injected = false;
    stopPillObserver();
  }

  function startPillObserver(centerPill) {
    stopPillObserver();
    if (!centerPill || !window.MutationObserver) return;
    pillObserver = new MutationObserver(function () {
      if (!isDesktop()) return;
      if (!centerPill.querySelector("." + wrapClass)) {
        inject();
      }
    });
    pillObserver.observe(centerPill, { childList: true, subtree: false });
    pillObserverTimer = setTimeout(stopPillObserver, OBSERVER_MS);
  }

  function stopPillObserver() {
    if (pillObserver) {
      pillObserver.disconnect();
      pillObserver = null;
    }
    if (pillObserverTimer) {
      clearTimeout(pillObserverTimer);
      pillObserverTimer = null;
    }
  }

  function removeMobileLanguageRow() {
    document.querySelectorAll(".zf-mobile-lang-row").forEach(function (row) {
      row.remove();
    });
  }

  function updateLayoutMode() {
    if (isDesktop()) {
      setPortalVisible(false);
      removeMobileLanguageRow();
      stopMobileObserver();
      if (!inject()) {
        setInjectedVisible(false);
      }
    } else {
      removeInjected();
      setPortalVisible(true);
      injectMobileLanguageRow();
      updateMobileLangValues();
    }
  }

  function scheduleInject() {
    setTimeout(function () {
      if (!isDesktop()) return;
      updateLayoutMode();
    }, HYDRATION_DELAY_MS);
  }

  function mobileLangValue() {
    return isSlPath() ? "English" : "Slovenščina";
  }

  function mobileLangNavigate() {
    var currentPath = location.pathname.replace(/\/index\.html$/, "/") || "/";
    var target;
    if (isSlPath()) {
      target = currentPath.replace(/^\/sl/, "") || "/";
      if (target !== "/" && !target.endsWith(".html")) target += "/";
    } else {
      var enPath = currentPath.replace(/\.html$/, "") || "/";
      target = enPath === "/" ? "/sl/" : "/sl" + enPath;
    }
    location.href = target;
  }

  function mobileLangRowHtml() {
    return (
      '<div class="zf-mobile-lang-row">' +
      '<div class="zf-mobile-lang-divider"></div>' +
      '<button class="zf-mobile-lang-btn" type="button">' +
      '<span class="zf-mobile-lang-left">' +
      '<span class="zf-mobile-lang-label">Jezik / Language</span>' +
      "</span>" +
      '<span class="zf-mobile-lang-right">' +
      '<span class="zf-mobile-lang-value">' +
      mobileLangValue() +
      "</span>" +
      '<span class="zf-mobile-lang-arrow">›</span>' +
      "</span></button></div>"
    );
  }

  function getMobilePills() {
    var allPills = document.querySelectorAll(".framer-bdVR3.framer-1p6jqal");
    return Array.from(allPills).filter(function (pill) {
      return !pill.closest('[data-framer-name="Default"]');
    });
  }

  function bindMobileLangBtn(row) {
    if (!row || row.getAttribute("data-zf-mobile-bound") === "1") return;
    row.setAttribute("data-zf-mobile-bound", "1");
    var btn = row.querySelector(".zf-mobile-lang-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      mobileLangNavigate();
    });
  }

  function injectMobileLanguageRow() {
    if (!isMobileLayout()) return;
    getMobilePills().forEach(function (pill) {
      if (pill.querySelector(".zf-mobile-lang-row")) return;
      pill.insertAdjacentHTML("beforeend", mobileLangRowHtml());
      bindMobileLangBtn(pill.querySelector(".zf-mobile-lang-row"));
    });
  }

  function updateMobileLangValues() {
    var value = mobileLangValue();
    document.querySelectorAll(".zf-mobile-lang-value").forEach(function (el) {
      el.textContent = value;
    });
  }

  function stopMobileObserver() {
    if (mobileObserver) {
      mobileObserver.disconnect();
      mobileObserver = null;
    }
    if (mobileObserverTimer) {
      clearTimeout(mobileObserverTimer);
      mobileObserverTimer = null;
    }
  }

  function startMobileObserver() {
    stopMobileObserver();
    if (!window.MutationObserver) return;
    mobileObserver = new MutationObserver(function () {
      if (!isMobileLayout()) return;
      var needsInject = getMobilePills().some(function (pill) {
        return !pill.querySelector(".zf-mobile-lang-row");
      });
      if (needsInject) injectMobileLanguageRow();
    });
    mobileObserver.observe(document.body, { childList: true, subtree: true });
    mobileObserverTimer = setTimeout(stopMobileObserver, OBSERVER_MS);
  }

  function scheduleMobileInject() {
    setTimeout(function () {
      if (!isMobileLayout()) return;
      injectMobileLanguageRow();
      updateMobileLangValues();
      startMobileObserver();
    }, HYDRATION_DELAY_MS);
  }

  /*
   * Pill nav highlight: Framer uses variant framer-v-1qxz9if and re-hydrates <a> nodes.
   * Delegated clicks + zf-nav-active (see lang-switcher.css) survive hydration.
   */
  var NAV_SPY_HASHES = ["features", "use-case", "counter", "smart-assist"];
  var NAV_SCROLL_OFFSET = 140;
  var NAV_ACTIVE_CLASS = "zf-nav-active";
  var navSpyReady = false;
  var navSpyApplying = false;
  var navSpyPinnedHash = null;
  var navSpyScrollEndTimer = null;
  var navSpyRaf = 0;
  var navSpyObserver = null;
  var navSpyRatios = {};

  function getMainNav() {
    var navs = document.querySelectorAll("nav.framer-FXVKP");
    for (var i = 0; i < navs.length; i++) {
      if (isVisibleEl(navs[i])) return navs[i];
    }
    return (
      document.querySelector('nav[data-framer-name="Default"]') ||
      document.querySelector('nav[data-framer-name="Collapsed"]') ||
      navs[0] ||
      null
    );
  }

  function getNavLinkScope() {
    var nav = getMainNav();
    if (!nav) return null;
    return nav.querySelector('[data-framer-name="Center"]') || nav;
  }

  function isVisibleEl(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getCenterNavLinks() {
    var scope = getNavLinkScope();
    if (!scope) return [];
    var seen = {};
    return Array.prototype.filter.call(scope.querySelectorAll('a[href*="#"]'), function (a) {
      if (!isVisibleEl(a)) return false;
      var href = a.getAttribute("href") || "";
      var hash = null;
      var match = href.match(/#([\w-]+)/);
      if (match) hash = match[1];
      if (!hash || NAV_SPY_HASHES.indexOf(hash) === -1) return false;
      if (seen[hash]) return false;
      seen[hash] = true;
      return true;
    });
  }

  function hashFromNavLink(link) {
    var href = link.getAttribute("href") || "";
    var match = href.match(/#([\w-]+)/);
    return match ? match[1] : null;
  }

  function hashFromLocation() {
    var raw = (location.hash || "").replace(/^#/, "");
    return NAV_SPY_HASHES.indexOf(raw) !== -1 ? raw : null;
  }

  function setLocationHash(sectionId) {
    var path = location.pathname || "/";
    var base = path.endsWith("/") ? path : path + "/";
    history.replaceState(null, "", base + "#" + sectionId);
  }

  function scrollToNavSection(sectionId, behavior) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    var top = section.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: behavior || "smooth",
    });
  }

  function resolveActiveNavHashFromViewport() {
    var bestHash = null;
    var bestRatio = 0;
    NAV_SPY_HASHES.forEach(function (id) {
      var ratio = navSpyRatios[id] || 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestHash = id;
      }
    });
    if (bestHash && bestRatio > 0.05) return bestHash;

    var active = NAV_SPY_HASHES[0];
    for (var i = 0; i < NAV_SPY_HASHES.length; i++) {
      var section = document.getElementById(NAV_SPY_HASHES[i]);
      if (!section) continue;
      if (section.getBoundingClientRect().top - NAV_SCROLL_OFFSET <= 2) {
        active = NAV_SPY_HASHES[i];
      }
    }
    return active;
  }

  function resolveActiveNavHash() {
    if (navSpyPinnedHash) return navSpyPinnedHash;
    return resolveActiveNavHashFromViewport();
  }

  function applyNavHighlight(links, activeHash) {
    navSpyApplying = true;
    links.forEach(function (link) {
      var isActive = hashFromNavLink(link) === activeHash;
      link.classList.toggle(NAV_ACTIVE_CLASS, !!isActive);
      if (isActive) {
        link.style.removeProperty("background-color");
      }
    });
    navSpyApplying = false;
  }

  function syncNavHighlight() {
    if (!isDesktop()) return;
    var links = getCenterNavLinks();
    if (!links.length) return;
    applyNavHighlight(links, resolveActiveNavHash());
  }

  function scheduleNavHighlightSync() {
    if (navSpyRaf) return;
    navSpyRaf = requestAnimationFrame(function () {
      navSpyRaf = 0;
      requestAnimationFrame(syncNavHighlight);
    });
  }

  function pinNavHash(hash) {
    navSpyPinnedHash = hash;
    clearTimeout(navSpyScrollEndTimer);
  }

  function navigateToNavSection(sectionId, behavior) {
    pinNavHash(sectionId);
    setLocationHash(sectionId);
    scrollToNavSection(sectionId, behavior);
    scheduleNavHighlightSync();
  }

  function onNavSpyScroll() {
    scheduleNavHighlightSync();
    if (!navSpyPinnedHash) return;
    clearTimeout(navSpyScrollEndTimer);
    navSpyScrollEndTimer = setTimeout(function () {
      navSpyPinnedHash = null;
      scheduleNavHighlightSync();
    }, 180);
  }

  function ensureNavSpyObserver() {
    if (!window.IntersectionObserver) return;

    if (navSpyObserver) {
      navSpyObserver.disconnect();
      navSpyRatios = {};
    }

    navSpyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          if (NAV_SPY_HASHES.indexOf(id) === -1) return;
          navSpyRatios[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });
        if (!navSpyPinnedHash) scheduleNavHighlightSync();
      },
      {
        root: null,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: "-" + NAV_SCROLL_OFFSET + "px 0px -55% 0px",
      }
    );

    NAV_SPY_HASHES.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) navSpyObserver.observe(section);
    });
  }

  function handleNavLinkClick(e) {
    if (!isDesktop()) return;
    var link =
      e.target && e.target.closest
        ? e.target.closest('nav.framer-FXVKP a[href*="#"]')
        : null;
    if (!link) return;

    var hash = hashFromNavLink(link);
    if (!hash || NAV_SPY_HASHES.indexOf(hash) === -1) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    navigateToNavSection(hash, "smooth");
  }

  function bindNavScrollSpy() {
    if (!getMainNav()) return false;

    ensureNavSpyObserver();

    if (document.documentElement.getAttribute("data-zf-nav-spy") !== "1") {
      document.documentElement.setAttribute("data-zf-nav-spy", "1");
      document.addEventListener("click", handleNavLinkClick, true);
      window.addEventListener("scroll", onNavSpyScroll, { passive: true });
      window.addEventListener("resize", scheduleNavHighlightSync);
      window.addEventListener("hashchange", function () {
        var hash = hashFromLocation();
        if (!hash) return;
        pinNavHash(hash);
        scheduleNavHighlightSync();
      });

      if (window.MutationObserver) {
        new MutationObserver(function () {
          if (navSpyApplying) return;
          scheduleNavHighlightSync();
        }).observe(document.getElementById("main") || document.body, {
          attributes: true,
          attributeFilter: ["class", "style", "data-framer-name"],
          subtree: true,
          childList: true,
        });
      }
    }

    navSpyReady = true;
    var initialHash = hashFromLocation();
    if (initialHash) {
      pinNavHash(initialHash);
      scrollToNavSection(initialHash, "auto");
    }
    scheduleNavHighlightSync();
    return true;
  }

  function scheduleNavScrollSpy() {
    setTimeout(function () {
      if (!isDesktop()) return;
      if (!bindNavScrollSpy()) {
        var attempts = 0;
        var retry = setInterval(function () {
          attempts += 1;
          if (bindNavScrollSpy() || attempts > 40) clearInterval(retry);
        }, 500);
      }
    }, HYDRATION_DELAY_MS + 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInject);
    document.addEventListener("DOMContentLoaded", scheduleMobileInject);
    document.addEventListener("DOMContentLoaded", scheduleNavScrollSpy);
  } else {
    scheduleInject();
    scheduleMobileInject();
    scheduleNavScrollSpy();
  }

  window.addEventListener("load", scheduleInject);
  window.addEventListener("load", scheduleMobileInject);
  window.addEventListener("load", scheduleNavScrollSpy);

  window.addEventListener("resize", function () {
    updateLayoutMode();
  });

  window.__zfNavSwitcherRetry = function () {
    if (isDesktop()) {
      updateLayoutMode();
      bindNavScrollSpy();
    }
    if (isMobileLayout()) injectMobileLanguageRow();
  };
})();
