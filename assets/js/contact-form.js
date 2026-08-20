/* Blackstone Audit — contact form validation + Netlify Forms submission */

(function () {
  "use strict";

  var MESSAGES = {
    ru: {
      required: "Обязательное поле",
      email: "Введите корректный email",
      success: "Спасибо! Ваша заявка отправлена, мы свяжемся с вами в ближайшее время.",
      error: "Не удалось отправить заявку. Пожалуйста, напишите нам напрямую по ссылке ниже."
    },
    en: {
      required: "This field is required",
      email: "Please enter a valid email address",
      success: "Thank you! Your request has been sent — we'll be in touch shortly.",
      error: "Something went wrong sending your request. Please email us directly using the link below."
    },
    uz: {
      required: "Ushbu maydonni to'ldirish shart",
      email: "Yaroqli elektron pochta manzilini kiriting",
      success: "Rahmat! So'rovingiz yuborildi, tez orada siz bilan bog'lanamiz.",
      error: "So'rovni yuborib bo'lmadi. Iltimos, quyidagi havola orqali to'g'ridan-to'g'ri yozing."
    }
  };

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var locale = form.getAttribute("data-locale") || "ru";
    var t = MESSAGES[locale];
    var successBox = document.querySelector("[data-form-success]");

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

    function encodeFormData(data) {
      var params = [];
      for (var pair of data.entries()) {
        params.push(encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]));
      }
      return params.join("&");
    }

    function showMessage(text, isError) {
      if (!successBox) return;
      successBox.textContent = text;
      successBox.classList.toggle("is-error", !!isError);
      successBox.classList.add("is-visible");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("[name='name']");
      var email = form.querySelector("[name='email']");
      var message = form.querySelector("[name='message']");
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

      var submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(new FormData(form))
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Submission failed: " + res.status);
          showMessage(t.success, false);
          form.reset();
        })
        .catch(function () {
          showMessage(t.error, true);
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  document.addEventListener("DOMContentLoaded", initContactForm);
})();
