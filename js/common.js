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

// Triple image flip (ScrollTrigger 기반)
function initTripleFlip() {
  const wrap = document.querySelector(".img.triple.flip");
  if (!wrap) return;

  gsap.registerPlugin(ScrollTrigger);

  const imgs = Array.from(wrap.querySelectorAll(".flip-img[data-alt]"));
  if (!imgs.length) return;

  // 초기 상태 세팅
  imgs.forEach((img) => {
    if (!img.dataset.original) {
      img.dataset.original = img.src;
    }
    img.__isFlipped = false;
  });

  function flipToAlt(img) {
    if (!img || img.__isFlipped) return;
    const alt = img.dataset.alt;
    if (!alt) return;

    img.__isFlipped = true;

    gsap.to(img, {
      duration: 0.22,
      rotationY: 90,
      ease: "sine.inOut",
      onComplete: () => {
        img.src = alt;
        gsap.fromTo(
          img,
          { rotationY: -90 },
          { duration: 0.22, rotationY: 0, ease: "sine.inOut" }
        );
      },
    });
  }

  function flipToOriginal(img) {
    if (!img || !img.__isFlipped) return;
    const original = img.dataset.original;
    if (!original) return;

    img.__isFlipped = false;

    gsap.to(img, {
      duration: 0.22,
      rotationY: 90,
      ease: "sine.inOut",
      onComplete: () => {
        img.src = original;
        gsap.fromTo(
          img,
          { rotationY: -90 },
          { duration: 0.22, rotationY: 0, ease: "sine.inOut" }
        );
      },
    });
  }

  // 공통: 모든 이미지 한 번에 플립 / 원복 (데스크톱용)
  function flipAllToAlt() {
    imgs.forEach((img, i) => {
      setTimeout(() => flipToAlt(img), i * 160);
    });
  }

  function flipAllToOriginal() {
    imgs.forEach((img, i) => {
      setTimeout(() => flipToOriginal(img), i * 140);
    });
  }

  // 기존 트리거 제거 방지용: matchMedia로 데스크톱/모바일 분리
  ScrollTrigger.matchMedia({
    // 🖥 Desktop: 세 장을 하나의 블록으로 처리
    "(min-width: 769px)": () => {
      ScrollTrigger.create({
        trigger: wrap,
        start: "center 65%",      // triple 중앙이 화면 높이 65% 지점에 올 때 (센터보다 살짝 이르게)
        end: "center+=200 center",   // 약간의 구간
        onEnter() {
          if (!imgs[0].__isFlipped) {
            flipAllToAlt();
          }
        },
        onEnterBack() {
          if (!imgs[0].__isFlipped) {
            flipAllToAlt();
          }
        },
        onLeaveBack() {
          // 위로 벗어날 때 원래 이미지로 복귀
          flipAllToOriginal();
        },
      });
    },

    // 📱 Mobile: 세로로 나열, 각 이미지를 개별 처리
    "(max-width: 768px)": () => {
      imgs.forEach((img) => {
        ScrollTrigger.create({
          trigger: img,
          start: "center 65%",    // 이미지가 화면 높이 65% 지점에 올 때 (센터보다 살짝 이르게)
          end: "center+=150 center",
          onEnter() {
            if (!img.__isFlipped) {
              flipToAlt(img);
            }
          },
          onEnterBack() {
            if (!img.__isFlipped) {
              flipToAlt(img);
            }
          },
          onLeaveBack() {
            // 위로 벗어날 때 원래 이미지로 복귀
            flipToOriginal(img);
          },
        });
      });
    },
  });
}

// DOMContentLoaded 이후: GSAP & ScrollTrigger 로드 확인 후 플립 초기화
document.addEventListener("DOMContentLoaded", () => {
  function waitForFlipDeps() {
    if (window.gsap && window.ScrollTrigger) {
      initTripleFlip();
    } else {
      setTimeout(waitForFlipDeps, 50);
    }
  }
  waitForFlipDeps();
});
