/* Dore Theme Select & Initializer Script 

Table of Contents

01. Css Loading Util
02. Theme Selector And Initializer
*/

/* 01. Css Loading Util */
function loadStyle(href, callback) {
  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href == href) {
      return;
    }
  }
  var head = document.getElementsByTagName("head")[0];
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = href;
  if (callback) {
    link.onload = function () {
      callback();
    };
  }
  var mainCss = $(head).find('[href$="main.css"]');
  if (mainCss.length !== 0) {
    mainCss[0].before(link);
  } else {
    head.appendChild(link);
  }
}
/* 02. Theme Selector And Initializer */
(function ($) {
  if ($().dropzone) {
    Dropzone.autoDiscover = false;
  }

  var themeColorsDom =
    
  $("body").append(themeColorsDom);
  var theme = "../../static/assets/css/dore.light.blue.min.css";

  if (typeof Storage !== "undefined") {
    if (localStorage.getItem("theme")) {
      theme = localStorage.getItem("theme");
    }
  }

  $(".theme-color[data-theme='" + theme + "']").addClass("active");

  loadStyle("css/" + theme, onStyleComplete);
  function onStyleComplete() {
    setTimeout(onStyleCompleteDelayed, 300);
  }

  function onStyleCompleteDelayed() {
    var $dore = $("body").dore();
  }

  $("body").on("click", ".theme-color", function (event) {
    event.preventDefault();
    var dataTheme = $(this).data("theme");
    if (typeof Storage !== "undefined") {
      localStorage.setItem("theme", dataTheme);
      window.location.reload();
    }
  });


  $(".theme-button").on("click", function (event) {
    event.preventDefault();
    $(this)
      .parents(".theme-colors")
      .toggleClass("shown");
  });
  $(document).on("click", function (event) {
    if (
      !(
        $(event.target)
          .parents()
          .hasClass("theme-colors") ||
        $(event.target)
          .parents()
          .hasClass("theme-button") ||
        $(event.target).hasClass("theme-button") ||
        $(event.target).hasClass("theme-colors")
      )
    ) {
      if ($(".theme-colors").hasClass("shown")) {
        $(".theme-colors").removeClass("shown");
      }
    }
  });
})(jQuery);
