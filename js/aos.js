// AOS auto-attach + init
document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".card-list, #project .detail .section");
  items.forEach((el, i) => {
    el.setAttribute("data-aos", "fade-up");
    el.setAttribute("data-aos-delay", String(i * 80)); // optional stagger
  });

  // 2) Init AOS
  AOS.init({
    duration: 600,
    easing: "ease-out-cubic",
    once: true,
    offset: 40,
  });

  // 3) Refresh to be safe if late-rendered content exists
  AOS.refresh();
});
