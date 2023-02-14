/******/ (() => {
  // webpackBootstrap
  var __webpack_exports__ = {};
  /*!************************!*\
  !*** ./src/js/main.js ***!
  \************************/
  var _Swiper;

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }

  var acc = document.querySelectorAll(".questions__item");
  var menuBtn = document.querySelectorAll(".menu-btn");
  var i;

  for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function (e) {
      let element = $(e.currentTarget)
        .closest(".questions__item")
        .find(".questions__item-info");

      if (
        element.find("accordion").get() !== [] ||
        element.find("menu-btn__plus").get() !== []
      ) {
        acc.forEach(function (item) {
          $(item)
            .closest(".questions__item")
            .find(".questions__item-info")
            .removeClass("active");
          var i = item.querySelector(".panel");
          i.style.maxHeight = null;
        });
        element.toggleClass("active");
        var panel = this.querySelector(".panel");

        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      }
    });
  }

  var tableAccordions = document.querySelectorAll(".table-accordion");
  var i;

  for (i = 0; i < tableAccordions.length; i++) {
    tableAccordions[i].addEventListener("click", function () {
      this.classList.toggle("active");
      var panel = this.nextElementSibling;
      panel.classList.toggle("active");
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  }

  new Swiper(
    ".swiper",
    ((_Swiper = {
      navigation: {
        nextEl: ".swiper-btn",
      },
      slidesPerView: 1,
      speed: 1500,
      centeredSlides: true,
    }),
    _defineProperty(_Swiper, "centeredSlides", true),
    _defineProperty(_Swiper, "spaceBetween", 20),
    _defineProperty(_Swiper, "loop", true),
    _defineProperty(_Swiper, "breakpoints", {
      701: {
        slidesPerView: 3,
      },
    }),
    _Swiper)
  );

  new Swiper(
    ".swiper-projects",
    ((_Swiper = {
      slidesPerView: 1,
      centeredSlides: true,
    }),
    _defineProperty(_Swiper, "navigation", {
      nextEl: ".swiper-projects .gallery-button-next",
      prevEl: ".swiper-projects .gallery-button-prev",
    }),
    _defineProperty(_Swiper, "centeredSlides", true),
    _defineProperty(_Swiper, "allowTouchMove", true),
    _defineProperty(_Swiper, "spaceBetween", 20),
    _defineProperty(_Swiper, "loop", true),
    _defineProperty(_Swiper, "breakpoints", {
      701: {
        initialSlide: 1,
        allowTouchMove: false,
        slidesPerView: 3,
      },
    }),
    _Swiper)
  );

  new Swiper(".info-license-wrapper-slide", {
    slidesPerView: 1.4,
    spaceBetween: 10,
    loop: true,
  });
  var modalFeedback = document.querySelector(".modal__feedback");
  modalFeedback.addEventListener("click", function () {
    modalFeedback.classList.remove("active");
  });

  function openFeedback() {
    modalFeedback.classList.add("active");
  }

  $(".phone-field").inputmask("+7(999)999-9999");
  jQuery.validator.addMethod("checkMaskPhone", function (value, element) {
    return /\+\d{1}\(\d{3}\)\d{3}-\d{4}/g.test(value);
  });
  jQuery.validator.addMethod(
    "placeholder",
    function (value, element) {
      return value != $(element).attr("placeholder");
    },
    jQuery.validator.messages.required
  );
  $("#feedback").validate({
    rules: {
      name: "required",
      email: {
        required: true,
        email: true,
        placeholder: true,
      },
      message: {
        required: true,
      },
      agree: {
        required: true,
      },
      phone: {
        required: true,
        // checkMaskPhone: true
      },
    },
    messages: {
      email: "Неверно введён e-mail",
      name: "Необходимо заполнить поле",
      agree: "Необходимо дать согласие на обработку персональных данных",
      message: "Необходимо заполнить поле",
      phone: "Введите корректный номер телефона",
    },
    errorPlacement: function errorPlacement(error, element) {
      if (element.attr("type") == "checkbox") {
        error.insertAfter($(element).parents(".checkbox-value"));
      } else {
        error.insertAfter(element);
      }
    },
    submitHandler: function submitHandler(form, event) {
      event.preventDefault();

      const fd = new FormData($("#feedback")[0]);

      $.ajax({
        url: "/ajax/partners-form",
        type: "POST",
        processData: false,
        contentType: false,
        dataType: "json",
        data: fd,
      })
        .done(function () {
          openFeedback();
          document.getElementById("feedback").reset();
        })
        .fail(function (e) {
          console.error("Не удалось отправить агентскую форму", e);
        });
    },
  });
  document.querySelector(".btn-form").addEventListener("click", function () {
    $("#feedback").submit();
  });
  var list = document.querySelector(".cost__adaptive-all");
  var itemsTitle = document.querySelectorAll(".cost__adaptive-name-title");
  var firstTitle = document.querySelector(".first-title");
  var items = document.querySelectorAll(".cost__adaptive-item");
  var firstItem = document.querySelector(".first-item");
  var titles = document.querySelectorAll(".cost__adaptive-name-title");
  var listItems = document.querySelectorAll(".cost__adaptive-all-block");
  document.addEventListener("DOMContentLoaded", function () {
    firstTitle.classList.add("visible");
    firstItem.classList.add("visible");
    list.classList.remove("visible");
  });
  titles.forEach(function (item, i) {
    item.addEventListener("click", function (e) {
      itemsTitle.forEach(function (item) {
        item.classList.remove("visible");
      });
      items.forEach(function (item) {
        item.classList.remove("visible");
      });
      list.classList.add("visible");
      e.target.classList.add("visible");
    });
  });
  listItems.forEach(function (item, i) {
    item.addEventListener("click", function () {
      list.classList.remove("visible");
      items[i].classList.add("visible");
      firstTitle.classList.remove("visible");
      itemsTitle.forEach(function (item, i) {
        item.classList.remove("visible");
      });
      itemsTitle[i].classList.add("visible");
    });
  });
  var destinationList = document.querySelector(".destination-list");
  var destinationListItems = document.querySelectorAll(".item");
  destinationList.addEventListener("click", function (e) {
    destinationListItems.forEach(function (item) {
      item.classList.remove("active");
    });
    console.log(e);
    e.target.parentElement.parentElement.classList.add("active");
  });
  $("body").on("mousedown", ".swiper-pag", function (e) {
    e.preventDefault();
  });
  /******/
})();
//# sourceMappingURL=main.js.map
