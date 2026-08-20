/* Blackstone Audit — contact form client-side validation (no backend configured yet) */

(function () {
  "use strict";

  var MESSAGES = {
    ru: {
      required: "Обязательное поле",
      email: "Введите корректный email",
      success: "Спасибо! Ваша заявка получена. Мы также подготовили письмо в вашей почтовой программе — отправьте его, чтобы точно ничего не потерялось."
    },
    en: {
      required: "This field is required",
      email: "Please enter a valid email address",
      success: "Thank you! Your request has been captured. We've also prepared an email in your mail client — please send it so nothing gets lost."
    },
    uz: {
      required: "Ushbu maydonni to'ldirish shart",
      email: "Yaroqli elektron pochta manzilini kiriting",
      success: "Rahmat! So'rovingiz qabul qilindi. Shuningdek, pochta dasturingizda xat tayyorladik — hech narsa yo'qolmasligi uchun uni yuboring."
    }
  };

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var locale = form.getAttribute("data-locale") || "ru";
    var t = MESSAGES[locale];
    var successBox = document.querySelector("[data-form-success]");
    var mailBase = "mailto:info@blackstone-audit.com";

    function setError(field, message) {
      var wrap = field.closest(".form-group");
      if (!wrap) return;
      var errorEl = wrap.querySelector(".form-error");
      if (errorEl) errorEl.textContent = message || "";
      field.style.borderColor = message ? "#b23b3b" : "";
    }

    function validateEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("[name='name']");
      var email = form.querySelector("[name='email']");
      var message = form.querySelector("[name='message']");
      var service = form.querySelector("[name='service']");
      var phone = form.querySelector("[name='phone']");
      var company = form.querySelector("[name='company']");
      var valid = true;

      [name, email, message].forEach(function (field) {
        if (field && !field.value.trim()) {
          setError(field, t.required);
          valid = false;
        } else if (field) {
          setError(field, "");
        }
      });

      if (email && email.value.trim() && !validateEmail(email.value.trim())) {
        setError(email, t.email);
        valid = false;
      }

      if (!valid) return;

      var subject = encodeURIComponent("Website inquiry — " + (service ? service.value : ""));
      var bodyLines = [
        "Name: " + name.value,
        "Company: " + (company ? company.value : ""),
        "Email: " + email.value,
        "Phone: " + (phone ? phone.value : ""),
        "Service of interest: " + (service ? service.value : ""),
        "",
        message.value
      ];
      var mailtoLink = mailBase + "?subject=" + subject + "&body=" + encodeURIComponent(bodyLines.join("\n"));

      var fallback = document.querySelector("[data-mail-fallback]");
      if (fallback) fallback.setAttribute("href", mailtoLink);

      if (successBox) successBox.classList.add("is-visible");
      form.reset();
      window.location.href = mailtoLink;
    });
  }

  document.addEventListener("DOMContentLoaded", initContactForm);
})();
