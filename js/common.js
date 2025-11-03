// 헤더가 partial로 주입된 뒤에야 버튼이 존재하므로, 주입 후 초기화 필요
function setupMobileMenu(root) {
  const headerEl =
    root && root.closest
      ? root.closest("#header") || root
      : document.querySelector("#header") || document;
  const navMenu = headerEl.querySelector(".header-mo");
  const openBtn = headerEl.querySelector(".header__toggle .menu-toggle");
  const closeBtn = headerEl.querySelector(".header-mo .menu-toggle");

  console.debug("[menu] init", { headerEl, navMenu, openBtn, closeBtn });

  if (!navMenu) {
    console.warn("[menu] .header-mo not found inside #header");
    return;
  }

  // 기존 핸들러 제거: data-flag로 중복 방지
  if (openBtn && openBtn.__bound !== true) {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.add("active");
      navMenu.setAttribute("aria-hidden", "false");
      console.debug("[menu] OPEN: .header-mo.active added");
    });
    openBtn.__bound = true;
  }

  if (closeBtn && closeBtn.__bound !== true) {
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.remove("active");
      navMenu.setAttribute("aria-hidden", "true");
      console.debug("[menu] CLOSE: .header-mo.active removed");
    });
    closeBtn.__bound = true;
  }

  // ESC로 닫기 (접근성)
  if (!headerEl.__escBound) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        navMenu.classList.remove("active");
        navMenu.setAttribute("aria-hidden", "true");
        console.debug("[menu] ESC: closed");
      }
    });
    headerEl.__escBound = true;
  }
}

// 섹션의 data-theme(light|dark)에 따라 헤더 색상 토글
function initHeaderThemeObserver() {
  const header = document.querySelector("#header");
  if (!header) return;

  const themed = document.querySelectorAll("[data-theme]");
  if (!themed.length) return;

  // 초기 상태: 가장 먼저 보이는 섹션의 테마 적용
  const apply = (el) => {
    const val = el?.dataset?.theme || "light";
    header.setAttribute("data-theme", val);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          apply(entry.target);
        }
      });
    },
    {
      threshold: 0.35,
      rootMargin: "-64px 0px 0px 0px", // fixed header 높이만큼 보정
    }
  );

  themed.forEach((sec) => io.observe(sec));
}

// 헤더 불러오기
async function loadPartial(targetSelector, url) {
  const el = document.querySelector(targetSelector);
  if (!el) return;
  try {
    const res = await fetch(url, { cache: "no-cache" });
    el.innerHTML = await res.text();

    // header가 로드된 직후에 모바일 메뉴 토글 초기화
    if (url.includes("header")) {
      setupMobileMenu(el);
      initHeaderThemeObserver();
    }

    // 활성 메뉴 표시(선택)
    if (url.includes("header")) {
      const here = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
      document.querySelectorAll(".nav__link").forEach((a) => {
        const norm = (a.getAttribute("href") || "/").replace(/\/+$/, "") || "/";
        if (norm === here) a.classList.add("nav__link--active");
      });
    }
  } catch (e) {
    console.warn(`[partials] ${url} 로드 실패:`, e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPartial("#header", "/partials/header.html");
  loadPartial("#footer", "/partials/footer.html");
  setTimeout(initHeaderThemeObserver, 0);
});

// 타이틀 애니메이션
document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(SplitText);

  console.clear();

  document.fonts.ready.then(() => {
    gsap.set(".split", { opacity: 1 });

    let split;
    SplitText.create(".split", {
      type: "words,lines",
      linesClass: "line",
      autoSplit: true,
      mask: "lines",
      onSplit: (self) => {
        split = gsap.from(self.lines, {
          duration: 1,
          yPercent: 120,
          opacity: 1,
          stagger: 0.1,
          ease: "expo.out",
        });
        return split;
      },
    });
  });
});
