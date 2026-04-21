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
      // 모바일 메뉴 열린 후 thumb 위치 재계산
      requestAnimationFrame(() => {
        updateLangThumb(localStorage.getItem(LANG_KEY) || getDefaultLang());
      });
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
let _themeScrollBound = false;

function initHeaderThemeObserver() {
  const header = document.querySelector("#header");
  if (!header) return;

  const themed = [...document.querySelectorAll("[data-theme]")];
  if (!themed.length) return;

  const HEADER_H = header.offsetHeight || 64;

  // 현재 헤더 하단 위치에 걸쳐있는 섹션의 테마 반환
  // data-theme이 없는 섹션은 마지막으로 지나친 data-theme 섹션 값 유지
  const getTheme = () => {
    const checkY = HEADER_H; // viewport 기준 헤더 하단 y
    let last = themed[0]; // 기본값: 첫 번째 섹션

    for (const sec of themed) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= checkY) last = sec; // 헤더 아래로 지나간 가장 최근 섹션
      else break;
    }
    return last.dataset.theme || "light";
  };

  const update = () => {
    header.setAttribute("data-theme", getTheme());
  };

  // 초기 적용
  update();

  // scroll 이벤트 (rAF로 스로틀)
  if (!_themeScrollBound) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    _themeScrollBound = true;
  }
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
      // 헤더 로드 후 언어 버튼 상태 동기화
      applyLang(localStorage.getItem(LANG_KEY) || getDefaultLang());
    }
  } catch (e) {
    console.warn(`[partials] ${url} 로드 실패:`, e);
  }

  // partial 삽입으로 레이아웃이 바뀌었을 수 있으므로 AOS 위치 재계산
  if (window.AOS) AOS.refresh();
}

document.addEventListener("DOMContentLoaded", () => {
  loadPartial("#header", "/partials/header.html");
  loadPartial("#footer", "/partials/footer.html");
  // initHeaderThemeObserver는 헤더 partial 로드 완료 후 호출됨
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

    // 추가: 레터 단위 애니메이션 (.split-letters)
    const letterTargets = document.querySelectorAll(".split-letters");
    if (letterTargets.length) {
      letterTargets.forEach((el) => {
        const splitLetters = new SplitText(el, {
          type: "chars", // 문자 단위로 쪼개기
          charsClass: "char", // 필요하면 CSS에서 .char 스타일링 가능
        });

        // 시작 상태
        gsap.set(splitLetters.chars, { opacity: 0, yPercent: 80 });

        // 애니메이션
        gsap.to(splitLetters.chars, {
          duration: 0.4,
          opacity: 1,
          yPercent: 0,
          stagger: 0.03, // 한 글자씩 순서대로
          ease: "sine.out",
        });
      });
    }
  });
});

// Triple image flip (ScrollTrigger 기반)
function initTripleFlip() {
  const wrap = document.querySelector(".img.triple.flip");
  if (!wrap) return;

  // ScrollTrigger가 이미 등록되어 있는지 확인
  if (!gsap.plugins.ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (e) {
      return;
    }
  }

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
          {
            duration: 0.22,
            rotationY: 0,
            ease: "sine.inOut"
          }
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

  // 실제 스크롤 전에 onEnter가 잘못 실행되는 걸 방지
  let ready = false;

  // 페이지 로드 상태에 따라 ready 설정
  if (document.readyState === 'complete') {
    // 페이지가 이미 완전히 로드된 경우 (중간에서 들어온 경우) 즉시 ready
    ready = true;
  } else {
    // 페이지가 로딩 중인 경우 첫 스크롤 또는 타임아웃 후 ready
    const onFirstScroll = () => {
      ready = true;
      window.removeEventListener("scroll", onFirstScroll);
    };
    window.addEventListener("scroll", onFirstScroll, { once: true });

    // 2초 후에도 ready를 true로 설정 (사용자가 스크롤하지 않았을 수도 있으므로)
    setTimeout(() => {
      if (!ready) {
        ready = true;
        window.removeEventListener("scroll", onFirstScroll);
      }
    }, 2000);
  }

  // 기존 트리거 제거 방지용: matchMedia로 데스크톱/모바일 분리
  ScrollTrigger.matchMedia({
    // 🖥 Desktop: 세 장을 하나의 블록으로 처리
    "(min-width: 769px)": () => {
      ScrollTrigger.create({
        trigger: wrap,
        start: "center 60%",
        end: "center+=200 center",
        onEnter() {
          if (!ready || imgs[0].__isFlipped) return;
          flipAllToAlt();
        },
        onEnterBack() {
          if (!ready || imgs[0].__isFlipped) return;
          flipAllToAlt();
        },
        onLeaveBack() {
          flipAllToOriginal();
        },
      });
    },

    // 📱 Mobile: 세로로 나열, 각 이미지를 개별 처리
    "(max-width: 768px)": () => {
      imgs.forEach((img) => {
        ScrollTrigger.create({
          trigger: img,
          start: "center 60%",
          end: "center+=150 center",
          onEnter() {
            if (!ready || img.__isFlipped) return;
            flipToAlt(img);
          },
          onEnterBack() {
            if (!ready || img.__isFlipped) return;
            flipToAlt(img);
          },
          onLeaveBack() {
            flipToOriginal(img);
          },
        });
      });
    },
  });
}

// window load 이후: lazy 이미지 포함 전체 레이아웃 확정 후 플립 초기화
function initFlipWhenReady() {
  function waitForFlipDeps() {
    // GSAP와 ScrollTrigger 스크립트가 모두 로드되었는지 확인
    if (window.gsap && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      initTripleFlip();
    } else {
      setTimeout(waitForFlipDeps, 50);
    }
  }
  waitForFlipDeps();
}

// 페이지 로드 상태에 따라 처리
if (document.readyState === 'loading') {
  // 아직 로딩 중이면 load 이벤트 대기
  window.addEventListener("load", initFlipWhenReady);
} else {
  // 이미 로드 완료됨 (페이지 중간으로 직접 이동한 경우)
  setTimeout(initFlipWhenReady, 100);
}

// ─── 언어 토글 ────────────────────────────────────────────────
const LANG_KEY = "preferred-lang";

// 브라우저 언어 설정에서 기본값 결정 (ko 계열이면 ko, 나머지는 en)
function getDefaultLang() {
  const browserLang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  return browserLang.startsWith("ko") ? "ko" : "en";
}

// thumb 위치를 활성 버튼에 맞게 이동
function updateLangThumb(lang) {
  document.querySelectorAll(".header__lang").forEach((track) => {
    const thumb = track.querySelector(".lang-thumb");
    const activeBtn = track.querySelector(`.btn-lang[data-lang="${lang}"]`);
    if (!thumb || !activeBtn) return;

    const btnRect = activeBtn.getBoundingClientRect();
    if (btnRect.width === 0) return; // 숨겨진 요소는 skip

    const trackRect = track.getBoundingClientRect();
    thumb.style.left = btnRect.left - trackRect.left + "px";
    thumb.style.width = btnRect.width + "px";
  });
}

function applyLang(lang) {
  document.querySelectorAll(".lang-en").forEach((el) => {
    el.hidden = lang !== "en";
  });
  document.querySelectorAll(".lang-ko").forEach((el) => {
    el.hidden = lang !== "ko";
  });
  document.querySelectorAll(".btn-lang").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  document.documentElement.setAttribute("lang", lang);
  localStorage.setItem(LANG_KEY, lang);
  updateLangThumb(lang);
}

function initLangToggle() {
  // localStorage 저장값 우선, 없으면 브라우저 언어 사용
  const saved = localStorage.getItem(LANG_KEY) || getDefaultLang();
  applyLang(saved);

  if (!document.__langToggleBound) {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-lang");
      if (btn && btn.dataset.lang) {
        applyLang(btn.dataset.lang);
      }
    });
    document.__langToggleBound = true;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();
});

// 영상 Intersection Observer: viewport 진입 시 재생, 벗어나면 정지
document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll("video[preload='none'], video[preload=none]");
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );

  videos.forEach((video) => {
    video.muted = true;
    video.loop = true;
    observer.observe(video);
  });
});
