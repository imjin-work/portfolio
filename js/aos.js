// AOS auto-attach + init
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll("#main .card-list, #project .detail .section");
  items.forEach((el, i) => {
    el.setAttribute("data-aos", "fade-up");
    // delay 상한 160ms: 빠르게 스크롤해도 요소가 사라지기 전에 애니메이션 시작
    el.setAttribute("data-aos-delay", String(Math.min(i * 80, 160)));
  });

  AOS.init({
    duration: 600,
    easing: "ease-out-cubic",
    once: false,   // 다시 올라왔을 때도 재생 (once: true면 놓친 요소 영구 미출현)
    offset: 20,    // 더 일찍 트리거 (40 → 20)
  });

  AOS.refresh();
});
