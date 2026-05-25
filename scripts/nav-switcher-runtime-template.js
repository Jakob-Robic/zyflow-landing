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

  function updateLayoutMode() {
    if (isDesktop()) {
      setPortalVisible(false);
      if (!inject()) {
        setInjectedVisible(false);
      }
    } else {
      removeInjected();
      setPortalVisible(true);
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInject);
    document.addEventListener("DOMContentLoaded", scheduleMobileInject);
  } else {
    scheduleInject();
    scheduleMobileInject();
  }

  window.addEventListener("load", scheduleInject);
  window.addEventListener("load", scheduleMobileInject);

  window.addEventListener("resize", function () {
    updateLayoutMode();
    if (isMobileLayout()) {
      injectMobileLanguageRow();
      updateMobileLangValues();
    }
  });

  window.__zfNavSwitcherRetry = function () {
    if (isDesktop()) updateLayoutMode();
    if (isMobileLayout()) injectMobileLanguageRow();
  };
})();
