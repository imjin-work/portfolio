document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".work__list");
  if (!container || !window.Shuffle) return;

  const Shuffle = window.Shuffle;

  // Shuffle 인스턴스 생성
  const shuffleInstance = new Shuffle(container, {
    itemSelector: ".card-list",
    speed: 400, // 애니메이션 속도(ms)
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  });

  // 필터 버튼 클릭 핸들러
  const filterButtons = document.querySelectorAll(".work__filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      // 버튼 active 상태 업데이트
      filterButtons.forEach((btn) =>
        btn.classList.toggle("is-active", btn === button)
      );

      // 필터 적용
      if (filter === "all") {
        shuffleInstance.filter(Shuffle.ALL);
      } else {
        // data-groups 배열 안에 이 문자열이 포함된 카드만 남김
        shuffleInstance.filter(filter);
      }
    });
  });
});
