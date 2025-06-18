document.addEventListener("DOMContentLoaded", function () {
        const checkboxes = document.querySelectorAll(".answer-checkbox");

        checkboxes.forEach((checkbox) => {
          checkbox.addEventListener("change", function () {
            const inputBox = this.parentElement.querySelector(".answer-input");

            if (this.checked) {
              inputBox.style.backgroundColor = "rgb(220, 255, 220, 0.9)"; // Light green
            } else {
              inputBox.style.backgroundColor = "";
            }
          });
        });
      });