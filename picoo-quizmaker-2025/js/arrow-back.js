document.addEventListener("DOMContentLoaded", function () {
    const backArrow = document.querySelector(".arrow-back");

    if (backArrow) {
      backArrow.addEventListener("click", function () {
        if (document.referrer !== "") {
          window.history.back();
        } else {
          window.location.href = "/"; // Fallback if no history
        }
      });
    }
});
