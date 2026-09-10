$(function () {
  const $top = $(".back-top");
  const $menuButton = $(".navbar-toggler, .menu-toggle");
  const $copyStatus = $(
    '<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>',
  ).appendTo("body");

  $(".article-card").on("click", function (event) {
    if ($(event.target).closest("a, button").length) return;
    const href = $(this).find("h3 a").attr("href");
    if (href) window.location.href = href;
  });

  const postSlug = document.body.dataset.postSlug;
  if (postSlug) {
    const $views = $(".post-views");
    const $value = $(".post-views__value");
    const sessionKey = `quang-tam-blog:viewed:${postSlug}`;
    let timer;
    let counted = false;
    const wasCounted = () => {
      try {
        return sessionStorage.getItem(sessionKey);
      } catch {
        return false;
      }
    };
    const markCounted = () => {
      try {
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        // Restricted storage must not break article reading.
      }
    };

    const setViews = (views) => {
      $value.text(new Intl.NumberFormat("vi-VN").format(views));
      $views.attr("aria-busy", "false");
    };
    const scheduleView = () => {
      if (counted || document.hidden || timer) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (document.hidden || counted || wasCounted()) return;
        fetch(`/api/posts/${encodeURIComponent(postSlug)}/view`, {
          method: "POST",
          headers: { Accept: "application/json" },
        })
          .then((response) => {
            if (!response.ok) throw new Error("view request failed");
            return response.json();
          })
          .then((data) => {
            counted = true;
            markCounted();
            setViews(data.views);
          })
          .catch(() => undefined);
      }, 5000);
    };

    fetch(`/api/posts/${encodeURIComponent(postSlug)}/views`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error("view request failed");
        return response.json();
      })
      .then((data) => setViews(data.views))
      .catch(() => $views.remove());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && timer) {
        window.clearTimeout(timer);
        timer = undefined;
      } else {
        scheduleView();
      }
    });
    scheduleView();
  }

  $(".skip-link").on("click", function (event) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  });

  $(window).on("scroll", function () {
    $top.toggle($(this).scrollTop() > 500);
  });
  $top.on("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  $(".copy-btn").on("click", function () {
    const $button = $(this);
    const text = $("#" + $button.data("copy")).text();
    const original = $button.text();
    const copied = () => {
      $button.text("đã chép");
      $copyStatus.text("Đã chép nội dung mã.");
      setTimeout(() => $button.text(original), 1300);
    };
    const failed = () => {
      $button.text("không thể chép");
      $copyStatus.text("Không thể chép nội dung mã.");
      setTimeout(() => $button.text(original), 1600);
    };
    if (!navigator.clipboard?.writeText) {
      failed();
      return;
    }
    navigator.clipboard.writeText(text).then(copied).catch(failed);
  });

  const scenarios = {
    enroll: {
      copy: "Bấm “Đăng ký” môn CS101",
      title: "Đăng ký thành công",
      result: "API đã tạo enrollment ENR-7781 cho CS101.",
      badge: "201 CREATED",
      request:
        '<span class="code-method">POST</span> /api/v1/enrollments\nContent-Type: application/json\n\n{\n  <span class="code-key">"studentId"</span>: <span class="code-string">"GZU-2048"</span>,\n  <span class="code-key">"courseId"</span>: <span class="code-string">"CS101"</span>\n}',
      response:
        '<span class="code-status">201 Created</span>\nContent-Type: application/json\n\n{\n  <span class="code-key">"id"</span>: <span class="code-string">"ENR-7781"</span>,\n  <span class="code-key">"status"</span>: <span class="code-string">"confirmed"</span>,\n  <span class="code-key">"course"</span>: <span class="code-string">"CS101 · Web Foundations"</span>\n}',
    },
    courses: {
      copy: "Mở mục “Môn học của tôi”",
      title: "Đã tải danh sách môn",
      result: "API trả về 3 môn học dưới dạng danh sách JSON.",
      badge: "200 OK",
      request:
        '<span class="code-method">GET</span> /api/v1/students/GZU-2048/courses',
      response:
        '<span class="code-status">200 OK</span>\nContent-Type: application/json\n\n{\n  <span class="code-key">"count"</span>: <span class="code-string">3</span>,\n  <span class="code-key">"courses"</span>: <span class="code-string">["CS101", "MATH204", "UX200"]</span>\n}',
    },
    drop: {
      copy: "Bấm “Hủy” môn MATH204",
      title: "Đã hủy môn học",
      result: "API đã xóa enrollment một cách an toàn.",
      badge: "204 NO CONTENT",
      request:
        '<span class="code-method">DELETE</span> /api/v1/enrollments/ENR-5520',
      response:
        '<span class="code-status">204 No Content</span>\n\nEnrollment đã được xóa — không cần response body.',
    },
  };
  let currentScenario = "enroll";
  const $tabs = $(".scenario-tab");
  $tabs.each(function (index) {
    $(this).attr({
      id: `scenario-tab-${index}`,
      role: "tab",
      "aria-selected": index === 0 ? "true" : "false",
      "aria-controls": "scenario-result",
      tabindex: index === 0 ? "0" : "-1",
    });
  });
  $(".scenario-tabs").attr("aria-label", "Chọn một kịch bản API sinh viên giả định");
  $(".demo-result").attr({
    id: "scenario-result",
    role: "tabpanel",
    "aria-labelledby": "scenario-tab-0",
  });

  function setScenario(key) {
    currentScenario = key;
    const item = scenarios[key];
    $("#scenario-copy").text(item.copy);
    $("#request-code code").html(item.request);
    $("#response-code code").html(item.response);
    $("#result-title").text(
      key === "enroll"
        ? "Sẵn sàng đăng ký"
        : key === "courses"
          ? "Sẵn sàng tải môn học"
          : "Sẵn sàng hủy môn",
    );
    $("#result-copy").text("Request đang chờ được gửi.");
    $("#result-badge").text("SẴN SÀNG").css("background", "var(--yellow)");
    $tabs
      .attr({ "aria-selected": "false", tabindex: "-1" })
      .removeClass("active");
    $tabs
      .filter(`[data-scenario="${key}"]`)
      .attr({ "aria-selected": "true", tabindex: "0" })
      .addClass("active");
    $("#scenario-result").attr(
      "aria-labelledby",
      $tabs.filter(`[data-scenario="${key}"]`).attr("id"),
    );
    $(".track-node").removeClass("active done").first().addClass("active");
    $(".track-line i").css("width", "0%");
  }

  function activateTab($tab, moveFocus = false) {
    setScenario($tab.data("scenario"));
    if (moveFocus) $tab.trigger("focus");
  }
  $tabs.on("click", function () {
    activateTab($(this));
  });
  $tabs.on("keydown", function (event) {
    const index = $tabs.index(this);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % $tabs.length;
    if (event.key === "ArrowLeft")
      next = (index - 1 + $tabs.length) % $tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = $tabs.length - 1;
    if (next !== index) {
      event.preventDefault();
      activateTab($tabs.eq(next), true);
    }
  });

  $(".run-demo").on("click", function () {
    const item = scenarios[currentScenario];
    const $button = $(this)
      .prop("disabled", true)
      .addClass("is-running")
      .html('Đang gửi… <span aria-hidden="true">↗</span>');
    $(".track-node").removeClass("active done").first().addClass("done");
    $(".track-line i").css("width", "0%");
    [1, 2, 3].forEach((step) =>
      setTimeout(() => {
        $(".track-node").eq(step).addClass("active").prevAll().addClass("done");
        $(".track-line i").css("width", `${step * 33.33}%`);
      }, step * 500),
    );
    setTimeout(() => {
      $("#result-title").text(item.title);
      $("#result-copy").text(item.result);
      $("#result-badge").text(item.badge).css("background", "var(--lime)");
      $button
        .prop("disabled", false)
        .removeClass("is-running")
        .html('Chạy lại <span aria-hidden="true">▶</span>');
    }, 1750);
  });

  function closeMenu() {
    const $menu = $("#mainNav");
    const $siteLinks = $(".site-links");
    if (!$menu.length && !$siteLinks.length) return;
    if ($menu.length && $menu.hasClass("show") && window.bootstrap?.Collapse)
      window.bootstrap.Collapse.getOrCreateInstance($menu[0]).hide();
    $siteLinks.removeClass("is-open");
    $menuButton.attr("aria-expanded", "false").trigger("focus");
  }
  $menuButton.on("click", function () {
    const $target = $("#" + $(this).attr("aria-controls"));
    const open = !$target.hasClass("show") && !$target.hasClass("is-open");
    $target.toggleClass("is-open", open);
    $(this).attr("aria-expanded", String(open));
  });
  $(".navbar-nav .nav-link").on("click", function () {
    closeMenu();
  });
  $(document).on("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) $(entry.target).addClass("revealed");
        }),
      { threshold: 0.12 },
    );
    $(".reason-card, .flow-step, .resource-list a, .map-node").each(
      function () {
        $(this).addClass("reveal");
        observer.observe(this);
      },
    );
  } else
    $(".reason-card, .flow-step, .resource-list a, .map-node").addClass(
      "revealed",
    );
});
