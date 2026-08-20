/* Blackstone Audit — shared header/footer/navigation renderer */

(function () {
  "use strict";

  // Root-relative target paths for every page, per locale.
  var PAGES = {
    home: { ru: "index.html", en: "en/index.html", uz: "uz/index.html" },
    services: { ru: "services/index.html", en: "en/services/index.html", uz: "uz/services/index.html" },
    "audit-assurance": { ru: "services/audit-assurance.html", en: "en/services/audit-assurance.html", uz: "uz/services/audit-assurance.html" },
    tax: { ru: "services/tax.html", en: "en/services/tax.html", uz: "uz/services/tax.html" },
    legal: { ru: "services/legal.html", en: "en/services/legal.html", uz: "uz/services/legal.html" },
    "accounting-outsourcing": { ru: "services/accounting-outsourcing.html", en: "en/services/accounting-outsourcing.html", uz: "uz/services/accounting-outsourcing.html" },
    "business-registration": { ru: "services/business-registration.html", en: "en/services/business-registration.html", uz: "uz/services/business-registration.html" },
    about: { ru: "about.html", en: "en/about.html", uz: "uz/about.html" },
    contact: { ru: "contact.html", en: "en/contact.html", uz: "uz/contact.html" }
  };

  var SERVICE_ORDER = ["audit-assurance", "tax", "legal", "accounting-outsourcing", "business-registration"];

  var I18N = {
    ru: {
      brandTag: "Аудит · Налоги · Право",
      navHome: "Главная",
      navServices: "Услуги",
      navAbout: "О компании",
      navContact: "Контакты",
      services: {
        "audit-assurance": "Аудит и подтверждение достоверности",
        tax: "Налоговые услуги",
        legal: "Юридические услуги",
        "accounting-outsourcing": "Бухгалтерский учёт и аутсорсинг",
        "business-registration": "Регистрация бизнеса"
      },
      ctaHeader: "Заказать консультацию",
      footerAbout: "Blackstone Audit — команда аудиторов, налоговых и юридических консультантов, которая помогает бизнесу в Узбекистане и Центральной Азии работать прозрачно и уверенно.",
      footerServices: "Услуги",
      footerCompany: "Компания",
      footerContacts: "Контакты",
      footerRights: "Все права защищены.",
      langName: "RU"
    },
    en: {
      brandTag: "Audit · Tax · Legal",
      navHome: "Home",
      navServices: "Services",
      navAbout: "About Us",
      navContact: "Contact",
      services: {
        "audit-assurance": "Audit & Assurance",
        tax: "Tax Services",
        legal: "Legal Services",
        "accounting-outsourcing": "Accounting & Outsourcing",
        "business-registration": "Business Registration"
      },
      ctaHeader: "Request a Consultation",
      footerAbout: "Blackstone Audit is a team of audit, tax and legal advisors helping businesses in Uzbekistan and Central Asia operate transparently and with confidence.",
      footerServices: "Services",
      footerCompany: "Company",
      footerContacts: "Contact",
      footerRights: "All rights reserved.",
      langName: "EN"
    },
    uz: {
      brandTag: "Audit · Soliq · Huquq",
      navHome: "Bosh sahifa",
      navServices: "Xizmatlar",
      navAbout: "Kompaniya haqida",
      navContact: "Aloqa",
      services: {
        "audit-assurance": "Audit va tasdiqlash xizmatlari",
        tax: "Soliq xizmatlari",
        legal: "Yuridik xizmatlar",
        "accounting-outsourcing": "Buxgalteriya va autsorsing",
        "business-registration": "Biznesni ro'yxatdan o'tkazish"
      },
      ctaHeader: "Konsultatsiya buyurtma qilish",
      footerAbout: "Blackstone Audit — O'zbekiston va Markaziy Osiyo biznesiga shaffof va ishonchli ishlashda yordam beruvchi audit, soliq va yuridik maslahatchilar jamoasi.",
      footerServices: "Xizmatlar",
      footerCompany: "Kompaniya",
      footerContacts: "Aloqa",
      footerRights: "Barcha huquqlar himoyalangan.",
      langName: "UZ"
    }
  };

  var ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c0-.6.4-1 1-1h2.6c.5 0 .9.3 1 .8l.9 3.6c.1.4 0 .9-.4 1.2L7.8 10.9a12.6 12.6 0 0 0 5.3 5.3l1.3-1.3c.3-.3.8-.5 1.2-.4l3.6.9c.5.1.8.5.8 1V19c0 .6-.4 1-1 1h-1.5C9.7 20 4 14.3 4 6.5V5Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4.5 6.5 7.5 6 7.5-6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
  };

  function rel(depth) {
    return new Array(depth + 1).join("../");
  }

  function buildHeader(locale, active, prefix) {
    var t = I18N[locale];
    var servicesLinks = SERVICE_ORDER.map(function (id) {
      return '<a class="main-nav__dropdown-link" href="' + prefix + PAGES[id][locale] + '">' + t.services[id] + "</a>";
    }).join("");

    var servicesActive = SERVICE_ORDER.indexOf(active) !== -1 || active === "services";

    var mobileServiceLinks = SERVICE_ORDER.map(function (id) {
      return '<a class="mobile-nav__link" href="' + prefix + PAGES[id][locale] + '">' + t.services[id] + "</a>";
    }).join("");

    var langOptions = ["ru", "en", "uz"].map(function (loc) {
      var target = PAGES[active] && PAGES[active][loc] ? PAGES[active][loc] : PAGES.home[loc];
      return '<a class="lang-switch__option' + (loc === locale ? " is-active" : "") + '" href="' + prefix + target + '">' + I18N[loc].langName + "</a>";
    }).join("");

    var mobileLangLinks = ["ru", "en", "uz"].map(function (loc) {
      var target = PAGES[active] && PAGES[active][loc] ? PAGES[active][loc] : PAGES.home[loc];
      return '<a class="' + (loc === locale ? "is-active" : "") + '" href="' + prefix + target + '">' + I18N[loc].langName + "</a>";
    }).join("");

    return (
      '<div class="container header-bar">' +
        '<a class="brand" href="' + prefix + PAGES.home[locale] + '">' +
          '<span class="brand__text">' +
            '<span class="brand__name">Blackstone <span>Audit</span></span>' +
            '<span class="brand__tag">' + t.brandTag + "</span>" +
          "</span>" +
        "</a>" +
        '<nav class="main-nav" aria-label="Primary">' +
          '<ul class="main-nav__list">' +
            '<li><a class="main-nav__link' + (active === "home" ? " is-active" : "") + '" href="' + prefix + PAGES.home[locale] + '">' + t.navHome + "</a></li>" +
            '<li class="main-nav__item">' +
              '<a class="main-nav__link' + (servicesActive ? " is-active" : "") + '" href="' + prefix + PAGES.services[locale] + '">' + t.navServices + " ▾</a>" +
              '<div class="main-nav__dropdown">' + servicesLinks + "</div>" +
            "</li>" +
            '<li><a class="main-nav__link' + (active === "about" ? " is-active" : "") + '" href="' + prefix + PAGES.about[locale] + '">' + t.navAbout + "</a></li>" +
            '<li><a class="main-nav__link' + (active === "contact" ? " is-active" : "") + '" href="' + prefix + PAGES.contact[locale] + '">' + t.navContact + "</a></li>" +
          "</ul>" +
        "</nav>" +
        '<div class="header-actions">' +
          '<div class="lang-switch" data-lang-switch>' +
            '<button class="lang-switch__current" type="button" aria-haspopup="true" aria-expanded="false">' + t.langName + " ▾</button>" +
            '<div class="lang-switch__menu">' + langOptions + "</div>" +
          "</div>" +
          '<a class="btn btn--gold" href="' + prefix + PAGES.contact[locale] + '">' + t.ctaHeader + "</a>" +
        "</div>" +
        '<button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" data-menu-toggle>' +
          "<span></span><span></span><span></span>" +
        "</button>" +
      "</div>" +
      '<nav class="mobile-nav" data-mobile-nav aria-label="Mobile">' +
        '<div class="mobile-nav__list">' +
          '<a class="mobile-nav__link' + (active === "home" ? " is-active" : "") + '" href="' + prefix + PAGES.home[locale] + '">' + t.navHome + "</a>" +
          '<a class="mobile-nav__link' + (servicesActive ? " is-active" : "") + '" href="' + prefix + PAGES.services[locale] + '">' + t.navServices + "</a>" +
          '<div class="mobile-nav__sublist">' + mobileServiceLinks + "</div>" +
          '<a class="mobile-nav__link' + (active === "about" ? " is-active" : "") + '" href="' + prefix + PAGES.about[locale] + '">' + t.navAbout + "</a>" +
          '<a class="mobile-nav__link' + (active === "contact" ? " is-active" : "") + '" href="' + prefix + PAGES.contact[locale] + '">' + t.navContact + "</a>" +
        "</div>" +
        '<div class="mobile-nav__langs">' + mobileLangLinks + "</div>" +
      "</nav>"
    );
  }

  function buildFooter(locale, prefix) {
    var t = I18N[locale];
    var year = new Date().getFullYear();
    var serviceLinks = SERVICE_ORDER.map(function (id) {
      return '<li><a href="' + prefix + PAGES[id][locale] + '">' + t.services[id] + "</a></li>";
    }).join("");

    return (
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<span class="brand__name">Blackstone <span style="color:var(--color-gold)">Audit</span></span>' +
            "<p>" + t.footerAbout + "</p>" +
          "</div>" +
          '<div>' +
            "<h4>" + t.footerServices + "</h4>" +
            "<ul>" + serviceLinks + "</ul>" +
          "</div>" +
          '<div>' +
            "<h4>" + t.footerCompany + "</h4>" +
            '<ul><li><a href="' + prefix + PAGES.about[locale] + '">' + t.navAbout + '</a></li><li><a href="' + prefix + PAGES.contact[locale] + '">' + t.navContact + "</a></li></ul>" +
          "</div>" +
          '<div>' +
            "<h4>" + t.footerContacts + "</h4>" +
            "<ul>" +
              '<li><a href="tel:+998911625024">+998 91 162 50 24</a></li>' +
              '<li><a href="mailto:info@blackstone-audit.com">info@blackstone-audit.com</a></li>' +
              "<li>11 Lashkarbegi street, Tashkent, Uzbekistan</li>" +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + year + " Blackstone Audit. " + t.footerRights + "</span>" +
        "</div>" +
      "</div>"
    );
  }

  function canUseMotion() {
    var fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return fineHover && !reducedMotion;
  }

  function initCustomCursor() {
    if (!canUseMotion()) return;

    document.documentElement.classList.add("has-custom-cursor");

    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mouseX = -100;
    var mouseY = -100;
    var ringX = -100;
    var ringY = -100;
    var visible = false;

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = "translate(" + mouseX + "px," + mouseY + "px) translate(-50%,-50%)";
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    });

    document.addEventListener("mouseleave", function () {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    });

    function loop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = "translate(" + ringX + "px," + ringY + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    var hoverSelector = "a, button, input, select, textarea, [role='button']";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverSelector)) {
        dot.classList.add("is-hover");
        ring.classList.add("is-hover");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverSelector)) {
        dot.classList.remove("is-hover");
        ring.classList.remove("is-hover");
      }
    });
  }

  function initSmoothScroll() {
    if (!canUseMotion()) return;

    var current = window.scrollY;
    var target = window.scrollY;
    var ease = 0.09;
    var ticking = false;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }

    function clampTarget() {
      if (target < 0) target = 0;
      var max = maxScroll();
      if (target > max) target = max;
    }

    function render() {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        ticking = false;
        return;
      }
      window.scrollTo(0, current);
      requestAnimationFrame(render);
    }

    window.addEventListener("wheel", function (e) {
      target += e.deltaY;
      clampTarget();
      e.preventDefault();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    }, { passive: false });

    // Stay in sync if the user scrolls via keyboard or the scrollbar directly.
    window.addEventListener("scroll", function () {
      if (!ticking) {
        current = window.scrollY;
        target = window.scrollY;
      }
    }, { passive: true });

    window.addEventListener("resize", clampTarget);
  }

  function initLayout(opts) {
    var locale = opts.locale || "ru";
    var depth = opts.depth || 0;
    var active = opts.active || "home";
    var prefix = rel(depth);

    var headerEl = document.getElementById("site-header");
    var footerEl = document.getElementById("site-footer");
    if (headerEl) headerEl.innerHTML = buildHeader(locale, active, prefix);
    if (footerEl) footerEl.innerHTML = buildFooter(locale, prefix);

    // Mobile menu toggle
    var menuToggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");
    if (menuToggle && mobileNav) {
      menuToggle.addEventListener("click", function () {
        var isOpen = mobileNav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }

    // Language switch dropdown (desktop)
    var langSwitch = document.querySelector("[data-lang-switch]");
    if (langSwitch) {
      var btn = langSwitch.querySelector(".lang-switch__current");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = langSwitch.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      document.addEventListener("click", function () {
        langSwitch.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    }

    initCustomCursor();
    initSmoothScroll();
  }

  window.BlackstoneLayout = { init: initLayout, icons: ICONS, pages: PAGES, rel: rel };
})();
