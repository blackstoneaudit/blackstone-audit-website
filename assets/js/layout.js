/* Blackstone Audit — shared header/footer/navigation renderer */

(function () {
  "use strict";

  // Root-relative target paths for every page, per locale.
  // Home/services use clean directory-style paths (no index.html) so the
  // address bar shows e.g. blackstone-audit.com/ instead of /index.html.
  var PAGES = {
    home: { ru: "", en: "en/", uz: "uz/" },
    services: { ru: "services/", en: "en/services/", uz: "uz/services/" },
    "audit-assurance": { ru: "services/audit-assurance.html", en: "en/services/audit-assurance.html", uz: "uz/services/audit-assurance.html" },
    tax: { ru: "services/tax.html", en: "en/services/tax.html", uz: "uz/services/tax.html" },
    legal: { ru: "services/legal.html", en: "en/services/legal.html", uz: "uz/services/legal.html" },
    "accounting-outsourcing": { ru: "services/accounting-outsourcing.html", en: "en/services/accounting-outsourcing.html", uz: "uz/services/accounting-outsourcing.html" },
    "business-registration": { ru: "services/business-registration.html", en: "en/services/business-registration.html", uz: "uz/services/business-registration.html" },
    resources: { ru: "resources.html", en: "en/resources.html", uz: "uz/resources.html" },
    isa: { ru: "isa-standards.html", en: "en/isa-standards.html", uz: "uz/isa-standards.html" },
    dtt: { ru: "double-taxation-treaties.html", en: "en/double-taxation-treaties.html", uz: "uz/double-taxation-treaties.html" },
    "local-audit": { ru: "local-audit-standards.html", en: "en/local-audit-standards.html", uz: "uz/local-audit-standards.html" },
    "local-accounting": { ru: "local-accounting-standards.html", en: "local-accounting-standards.html", uz: "local-accounting-standards.html" },
    ifrs: { ru: "ifrs-standards.html", en: "en/ifrs-standards.html", uz: "uz/ifrs-standards.html" },
    banks: { ru: "banks.html", en: "en/banks.html", uz: "uz/banks.html" },
    about: { ru: "about.html", en: "en/about.html", uz: "uz/about.html" },
    contact: { ru: "contact.html", en: "en/contact.html", uz: "uz/contact.html" }
  };

  var SERVICE_ORDER = ["audit-assurance", "tax", "legal", "accounting-outsourcing", "business-registration"];

  // Every card on the Resources page, in display order. "internal" pages route
  // through PAGES (locale/prefix-aware); "external" and "placeholder" use the
  // same href in every locale (placeholder = "#", not yet a real page).
  var RESOURCE_ITEMS = [
    { id: "isa", kind: "internal", group: "international" },
    { id: "ifrs", kind: "internal", group: "international" },
    { id: "iesba", kind: "external", href: "https://www.ethicsboard.org/iesba-code", group: "international" },
    { id: "local-audit", kind: "internal", group: "local" },
    { id: "local-accounting", kind: "internal", group: "local" },
    { id: "tax-code", kind: "external", href: "https://lex.uz/docs/-4674902", group: "local" },
    { id: "labor-code", kind: "external", href: "https://lex.uz/ru/docs/-6257288", group: "local" },
    { id: "dtt", kind: "internal", group: "reference" },
    { id: "banks", kind: "internal", group: "reference" }
  ];
  var RESOURCE_ORDER = RESOURCE_ITEMS.map(function (item) { return item.id; });
  var RESOURCE_GROUP_ORDER = ["international", "local", "reference"];

  var I18N = {
    ru: {
      brandTag: "Аудит · Налоги · Право",
      navHome: "Главная",
      navServices: "Услуги",
      navResources: "Ресурсы",
      navAbout: "О компании",
      navContact: "Контакты",
      services: {
        "audit-assurance": "Аудит и подтверждение достоверности",
        tax: "Налоговые услуги",
        legal: "Юридические услуги",
        "accounting-outsourcing": "Бухгалтерский учёт и аутсорсинг",
        "business-registration": "Регистрация бизнеса"
      },
      resourceItems: {
        isa: "Международные стандарты аудита (ISA)",
        ifrs: "Международные стандарты финансовой отчётности (МСФО)",
        iesba: "Кодекс этики IESBA",
        "local-audit": "Местные нормативные документы по аудиту",
        "local-accounting": "Местные нормативные документы по бухучёту",
        "tax-code": "Налоговый кодекс РУз",
        "labor-code": "Трудовой кодекс РУз",
        dtt: "Соглашения об избежании двойного налогообложения",
        banks: "Банки Узбекистана"
      },
      resourceGroups: {
        international: "Международные стандарты",
        local: "Местное законодательство",
        reference: "Справочники и реестры"
      },
      servicesIntro: "Аудит, налоги, право, бухучёт и регистрация бизнеса — одна команда, пять направлений поддержки вашего бизнеса в Узбекистане.",
      servicesCta: "Все услуги",
      resourcesIntro: "Стандарты и законодательство, на которых строится наша работа — международные и местные, в одном месте.",
      resourcesCta: "Все ресурсы",
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
      navResources: "Resources",
      navAbout: "About Us",
      navContact: "Contact",
      services: {
        "audit-assurance": "Audit & Assurance",
        tax: "Tax Services",
        legal: "Legal Services",
        "accounting-outsourcing": "Accounting & Outsourcing",
        "business-registration": "Business Registration"
      },
      resourceItems: {
        isa: "International Standards on Auditing (ISA)",
        ifrs: "International Financial Reporting Standards (IFRS)",
        iesba: "IESBA Code of Ethics",
        "local-audit": "Local Auditing Regulatory Documents",
        "local-accounting": "Local Accounting Regulatory Documents",
        "tax-code": "Tax Code of Uzbekistan",
        "labor-code": "Labor Code of Uzbekistan",
        dtt: "Double Taxation Treaties",
        banks: "Banks of Uzbekistan"
      },
      resourceGroups: {
        international: "International Standards",
        local: "Local Legislation",
        reference: "Reference & Registries"
      },
      servicesIntro: "Audit, tax, legal, accounting and business registration — one team, five ways we help your business operate with confidence in Uzbekistan.",
      servicesCta: "Explore all services",
      resourcesIntro: "Standards and legislation our audit, tax and legal work is built on — international and local, in one place.",
      resourcesCta: "Browse all resources",
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
      navResources: "Resurslar",
      navAbout: "Kompaniya haqida",
      navContact: "Aloqa",
      services: {
        "audit-assurance": "Audit va tasdiqlash xizmatlari",
        tax: "Soliq xizmatlari",
        legal: "Yuridik xizmatlar",
        "accounting-outsourcing": "Buxgalteriya va autsorsing",
        "business-registration": "Biznesni ro'yxatdan o'tkazish"
      },
      resourceItems: {
        isa: "Xalqaro audit standartlari (ISA)",
        ifrs: "Xalqaro moliyaviy hisobot standartlari (XMHS)",
        iesba: "IESBA Odob-axloq kodeksi",
        "local-audit": "Mahalliy audit normativ hujjatlari",
        "local-accounting": "Mahalliy buxgalteriya normativ hujjatlari",
        "tax-code": "O'zR Soliq kodeksi",
        "labor-code": "O'zR Mehnat kodeksi",
        dtt: "Ikki yoqlama soliqqa tortish bitimlari",
        banks: "O'zbekiston banklari"
      },
      resourceGroups: {
        international: "Xalqaro standartlar",
        local: "Mahalliy qonunchilik",
        reference: "Ma'lumotnoma va reyestrlar"
      },
      servicesIntro: "Audit, soliq, huquq, buxgalteriya va biznesni ro'yxatdan o'tkazish — bitta jamoa, biznesingizga yordam berishning beshta yo'li.",
      servicesCta: "Barcha xizmatlar",
      resourcesIntro: "Ishimiz asoslangan xalqaro va mahalliy standartlar hamda qonunchilik — bir joyda.",
      resourcesCta: "Barcha resurslar",
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

  var CTA_ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function rel(depth) {
    return new Array(depth + 1).join("../");
  }

  // Joins a relative prefix with a target path, falling back to "./"
  // when both are empty (i.e. linking to the site root from a root page).
  function linkTo(prefix, target) {
    if (target === "") {
      return prefix === "" ? "./" : prefix;
    }
    return prefix + target;
  }

  // A resource item's href is either an internal, locale/prefix-aware PAGES
  // entry, or a literal external/placeholder URL that's the same in every locale.
  function resourceHref(item, locale, prefix) {
    return item.kind === "internal" ? linkTo(prefix, PAGES[item.id][locale]) : item.href;
  }

  function resourceExtraAttrs(item) {
    return item.kind === "external" ? ' target="_blank" rel="noopener"' : "";
  }

  function buildHeader(locale, active, prefix) {
    var t = I18N[locale];
    var servicesList = SERVICE_ORDER.map(function (id) {
      return '<a href="' + linkTo(prefix, PAGES[id][locale]) + '">' + t.services[id] + ' <span class="nav-panel__arrow">→</span></a>';
    }).join("");

    var servicesPanel =
      '<div class="nav-panel__intro">' +
        "<p>" + t.servicesIntro + "</p>" +
        '<a class="nav-panel__cta" href="' + linkTo(prefix, PAGES.services[locale]) + '">' + t.servicesCta + " " + CTA_ARROW + "</a>" +
      "</div>" +
      '<div class="nav-panel__list">' + servicesList + "</div>";

    var resourceGroups = RESOURCE_GROUP_ORDER.map(function (group) {
      var itemsInGroup = RESOURCE_ITEMS.filter(function (item) { return item.group === group; }).map(function (item) {
        return '<a href="' + resourceHref(item, locale, prefix) + '"' + resourceExtraAttrs(item) + '>' + t.resourceItems[item.id] + "</a>";
      }).join("");
      return (
        '<div class="nav-panel__group">' +
          '<div class="nav-panel__group-label">' + t.resourceGroups[group] + "</div>" +
          itemsInGroup +
        "</div>"
      );
    }).join("");

    var resourcesPanel =
      '<div class="nav-panel__intro">' +
        "<p>" + t.resourcesIntro + "</p>" +
        '<a class="nav-panel__cta" href="' + linkTo(prefix, PAGES.resources[locale]) + '">' + t.resourcesCta + " " + CTA_ARROW + "</a>" +
      "</div>" +
      '<div class="nav-panel__groups">' + resourceGroups + "</div>";

    var servicesActive = SERVICE_ORDER.indexOf(active) !== -1 || active === "services";
    var resourcesActive = RESOURCE_ORDER.indexOf(active) !== -1 || active === "resources";

    var mobileServiceLinks = SERVICE_ORDER.map(function (id) {
      return '<a class="mobile-nav__link" href="' + linkTo(prefix, PAGES[id][locale]) + '">' + t.services[id] + "</a>";
    }).join("");

    var mobileResourceLinks = RESOURCE_ITEMS.map(function (item) {
      return '<a class="mobile-nav__link" href="' + resourceHref(item, locale, prefix) + '"' + resourceExtraAttrs(item) + '>' + t.resourceItems[item.id] + "</a>";
    }).join("");

    var langOptions = ["ru", "en", "uz"].map(function (loc) {
      var target = PAGES[active] && PAGES[active][loc] !== undefined ? PAGES[active][loc] : PAGES.home[loc];
      return '<a class="lang-switch__option' + (loc === locale ? " is-active" : "") + '" href="' + linkTo(prefix, target) + '">' + I18N[loc].langName + "</a>";
    }).join("");

    var mobileLangLinks = ["ru", "en", "uz"].map(function (loc) {
      var target = PAGES[active] && PAGES[active][loc] !== undefined ? PAGES[active][loc] : PAGES.home[loc];
      return '<a class="' + (loc === locale ? "is-active" : "") + '" href="' + linkTo(prefix, target) + '">' + I18N[loc].langName + "</a>";
    }).join("");

    return (
      '<div class="container header-bar">' +
        '<a class="brand" href="' + linkTo(prefix, PAGES.home[locale]) + '">' +
          '<span class="brand__text">' +
            '<span class="brand__name">Blackstone <span>Audit</span></span>' +
            '<span class="brand__tag">' + t.brandTag + "</span>" +
          "</span>" +
        "</a>" +
        '<nav class="main-nav" aria-label="Primary">' +
          '<ul class="main-nav__list">' +
            '<li><a class="main-nav__link' + (active === "home" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.home[locale]) + '">' + t.navHome + "</a></li>" +
            '<li class="main-nav__item">' +
              '<a class="main-nav__link' + (servicesActive ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.services[locale]) + '">' + t.navServices + " ▾</a>" +
              '<div class="main-nav__dropdown">' + servicesPanel + "</div>" +
            "</li>" +
            '<li class="main-nav__item">' +
              '<a class="main-nav__link' + (resourcesActive ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.resources[locale]) + '">' + t.navResources + " ▾</a>" +
              '<div class="main-nav__dropdown">' + resourcesPanel + "</div>" +
            "</li>" +
            '<li><a class="main-nav__link' + (active === "about" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.about[locale]) + '">' + t.navAbout + "</a></li>" +
            '<li><a class="main-nav__link' + (active === "contact" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.contact[locale]) + '">' + t.navContact + "</a></li>" +
          "</ul>" +
        "</nav>" +
        '<div class="header-actions">' +
          '<div class="lang-switch" data-lang-switch>' +
            '<button class="lang-switch__current" type="button" aria-haspopup="true" aria-expanded="false">' + t.langName + " ▾</button>" +
            '<div class="lang-switch__menu">' + langOptions + "</div>" +
          "</div>" +
          '<a class="btn btn--gold" href="' + linkTo(prefix, PAGES.contact[locale]) + '">' + t.ctaHeader + "</a>" +
        "</div>" +
        '<button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" data-menu-toggle>' +
          "<span></span><span></span><span></span>" +
        "</button>" +
      "</div>" +
      '<nav class="mobile-nav" data-mobile-nav aria-label="Mobile">' +
        '<div class="mobile-nav__list">' +
          '<a class="mobile-nav__link' + (active === "home" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.home[locale]) + '">' + t.navHome + "</a>" +
          '<a class="mobile-nav__link' + (servicesActive ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.services[locale]) + '">' + t.navServices + "</a>" +
          '<div class="mobile-nav__sublist">' + mobileServiceLinks + "</div>" +
          '<a class="mobile-nav__link' + (resourcesActive ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.resources[locale]) + '">' + t.navResources + "</a>" +
          '<div class="mobile-nav__sublist">' + mobileResourceLinks + "</div>" +
          '<a class="mobile-nav__link' + (active === "about" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.about[locale]) + '">' + t.navAbout + "</a>" +
          '<a class="mobile-nav__link' + (active === "contact" ? " is-active" : "") + '" href="' + linkTo(prefix, PAGES.contact[locale]) + '">' + t.navContact + "</a>" +
        "</div>" +
        '<div class="mobile-nav__langs">' + mobileLangLinks + "</div>" +
      "</nav>"
    );
  }

  function buildFooter(locale, prefix) {
    var t = I18N[locale];
    var year = new Date().getFullYear();
    var serviceLinks = SERVICE_ORDER.map(function (id) {
      return '<li><a href="' + linkTo(prefix, PAGES[id][locale]) + '">' + t.services[id] + "</a></li>";
    }).join("");

    return (
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<span class="brand__name">Blackstone <span style="color:var(--color-gold)">Audit</span></span>' +
            "<p>" + t.footerAbout + "</p>" +
          "</div>" +
          '<div>' +
            "<h3>" + t.footerServices + "</h3>" +
            "<ul>" + serviceLinks + "</ul>" +
          "</div>" +
          '<div>' +
            "<h3>" + t.footerCompany + "</h3>" +
            '<ul><li><a href="' + linkTo(prefix, PAGES.resources[locale]) + '">' + t.navResources + '</a></li><li><a href="' + linkTo(prefix, PAGES.about[locale]) + '">' + t.navAbout + '</a></li><li><a href="' + linkTo(prefix, PAGES.contact[locale]) + '">' + t.navContact + "</a></li></ul>" +
          "</div>" +
          '<div>' +
            "<h3>" + t.footerContacts + "</h3>" +
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

  // ===== Scroll-reveal animation system =====
  // Lightweight, dependency-free entrance animations: elements fade + slide
  // in once as they cross into the viewport. Targets are declared once, by
  // CSS selector, below — nothing per-page or per-component to wire up.
  //
  // State is applied via inline styles (not classes) so it never fights the
  // transition a component already defines for its own hover state (e.g.
  // .service-card's box-shadow/transform hover transition): the reveal's
  // inline transition/transform/opacity are removed the moment the entrance
  // finishes, handing the element back to its normal stylesheet rules.
  //
  // Everything here is inert with JS disabled (elements simply stay at
  // their default opacity: 1) and inert under prefers-reduced-motion.

  var REVEAL_DURATION = 800; // ms — mid-point of the 700-900ms premium range
  var REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  var revealObserver = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  // Sets an element's hidden starting state + transition, and returns a
  // function that flips it to visible. Cleans its own inline styles up
  // after the transition ends so hover/etc. states are unaffected afterward.
  function armReveal(el, kind, delayMs) {
    var dist = isMobileViewport() ? 20 : 40;
    var from, to;
    if (kind === "card") {
      from = "translateY(" + dist + "px) scale(0.98)";
      to = "translateY(0) scale(1)";
    } else if (kind === "image") {
      from = "translateY(" + Math.round(dist * 0.6) + "px) scale(1.03)";
      to = "translateY(0) scale(1)";
    } else {
      from = "translateY(" + dist + "px)";
      to = "translateY(0)";
    }

    var delay = delayMs ? delayMs + "ms" : "0ms";
    el.style.opacity = "0";
    el.style.transform = from;
    el.style.willChange = "opacity, transform";
    el.style.transition =
      "opacity " + REVEAL_DURATION + "ms " + REVEAL_EASE + " " + delay + ", " +
      "transform " + REVEAL_DURATION + "ms " + REVEAL_EASE + " " + delay;

    var settled = false;
    function settle() {
      if (settled) return;
      settled = true;
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transition = "";
      el.style.willChange = "";
    }
    el.addEventListener("transitionend", settle, { once: true });
    window.setTimeout(settle, REVEAL_DURATION + (delayMs || 0) + 400);

    return function reveal() {
      el.style.opacity = "1";
      el.style.transform = to;
    };
  }

  function observeReveal(el, kind, delayMs) {
    var reveal = armReveal(el, kind, delayMs);
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var fn = entry.target.__blackstoneReveal;
          if (fn) fn();
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
    }
    el.__blackstoneReveal = reveal;
    revealObserver.observe(el);
  }

  // Reveals every match of `selector` inside `container`, staggered by
  // `staggerMs`. The stagger index is capped at `maxIndex` so long lists
  // (e.g. a 10-item resources grid) don't push the last item's delay out
  // to an absurd length.
  function staggerGroup(container, selector, kind, staggerMs, maxIndex) {
    var items = container.querySelectorAll(selector);
    items.forEach(function (el, i) {
      observeReveal(el, kind, Math.min(i, maxIndex || 5) * staggerMs);
    });
  }

  function initScrollReveal() {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    // Section intros: eyebrow -> heading -> supporting text, cascading.
    document.querySelectorAll(".section-head").forEach(function (head) {
      [head.querySelector(".eyebrow"), head.querySelector("h2"), head.querySelector(".lede, p")]
        .filter(Boolean)
        .forEach(function (el, i) { observeReveal(el, "text", i * 110); });
    });

    // Resources page's label + title above the grid.
    document.querySelectorAll(".grid-header").forEach(function (head) {
      [head.querySelector(".grid-header__label"), head.querySelector(".grid-header__title")]
        .filter(Boolean)
        .forEach(function (el, i) { observeReveal(el, "text", i * 110); });
    });

    // Two-column intro/detail layout (About page "Our approach", etc.).
    document.querySelectorAll(".split").forEach(function (split) {
      var cols = split.querySelectorAll(":scope > div");
      cols.forEach(function (col, i) { observeReveal(col, "text", i * 150); });
    });

    // Card grids.
    document.querySelectorAll(".service-grid").forEach(function (g) { staggerGroup(g, ".service-card", "card", 130); });
    document.querySelectorAll(".value-grid").forEach(function (g) { staggerGroup(g, ".value-card", "card", 130); });
    document.querySelectorAll(".industry-grid").forEach(function (g) { staggerGroup(g, ".industry-card", "card", 100); });
    document.querySelectorAll(".resource-grid").forEach(function (g) { staggerGroup(g, ".resource-cell", "card", 90); });
    document.querySelectorAll(".subservice-grid").forEach(function (g) { staggerGroup(g, ".check-list", "text", 130); });

    // Contact page: info rows on the left, form as one block on the right.
    document.querySelectorAll(".contact-grid").forEach(function (g) { staggerGroup(g, ".contact-info-item", "text", 100); });

    // Long reference lists/tables (standards, treaties, banks) — reveal the
    // whole block once rather than each of dozens of rows individually.
    document.querySelectorAll(".standards-section, .statement-section, .form-card").forEach(function (el) {
      observeReveal(el, "text", 0);
    });

    // CTA bands, present near the bottom of most pages.
    document.querySelectorAll(".cta-band").forEach(function (band) {
      [band.querySelector("h2"), band.querySelector("p"), band.querySelector(".cta-band__actions")]
        .filter(Boolean)
        .forEach(function (el, i) { observeReveal(el, "text", i * 110); });
    });
  }

  // Hero content animates in on load (it's already in the viewport), not on
  // scroll: eyebrow, heading, lede and CTAs cascade in over ~0-500ms.
  function initHeroReveal() {
    if (prefersReducedMotion()) return;
    var inner = document.querySelector(".hero__inner");
    if (!inner) return;

    var parts = [
      inner.querySelector(".hero__eyebrow"),
      inner.querySelector("h1"),
      inner.querySelector(".hero__lede"),
      inner.querySelector(".hero__actions")
    ].filter(Boolean);
    var map = document.querySelector(".footprint__map");
    if (map) parts.unshift(map);

    var reveals = parts.map(function (el, i) {
      return armReveal(el, el === map ? "image" : "text", i * 140);
    });

    // Double rAF: guarantees the browser has painted the hidden starting
    // state at least once before we flip to visible, so the transition
    // actually plays instead of the element just appearing already-revealed.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        reveals.forEach(function (reveal) { reveal(); });
      });
    });
  }

  // Very subtle scroll-linked parallax on the homepage's decorative world
  // map. Disabled on mobile and under reduced-motion, throttled to one
  // update per animation frame.
  function initParallax() {
    if (prefersReducedMotion() || isMobileViewport()) return;
    var el = document.querySelector(".footprint__map");
    if (!el) return;

    var ticking = false;
    function update() {
      var rect = el.getBoundingClientRect();
      var viewportMid = window.innerHeight / 2;
      var elMid = rect.top + rect.height / 2;
      var progress = (elMid - viewportMid) / window.innerHeight;
      var offset = Math.max(-30, Math.min(30, progress * -30));
      el.style.transform = "translate3d(0, " + offset.toFixed(1) + "px, 0)";
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    // Wait for the hero's on-load reveal (which briefly owns this same
    // element's transform) to fully settle before parallax starts writing
    // to it, so a very fast early scroll can't cause the two to collide.
    window.setTimeout(function () {
      window.addEventListener("scroll", onScroll, { passive: true });
    }, REVEAL_DURATION + 600);
  }

  // Animates [data-count-to="1234"] elements from 0 up to their target when
  // they enter the viewport. Nothing on the site uses this yet — it's ready
  // for whenever a stats/numbers section is added: give any element
  // data-count-to="500" (plus optional data-count-suffix="+") and it works.
  function initCounters() {
    var counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length || !("IntersectionObserver" in window)) return;
    var reduce = prefersReducedMotion();

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count-to"));
        var suffix = el.getAttribute("data-count-suffix") || "";
        if (isNaN(target)) return;
        if (reduce) {
          el.textContent = target.toLocaleString() + suffix;
          return;
        }
        var duration = 1800;
        var start = null;
        function tick(ts) {
          if (start === null) start = ts;
          var progress = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) { observer.observe(el); });
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
    initHeroReveal();
    initScrollReveal();
    initParallax();
    initCounters();
  }

  window.BlackstoneLayout = { init: initLayout, icons: ICONS, pages: PAGES, rel: rel };
})();
