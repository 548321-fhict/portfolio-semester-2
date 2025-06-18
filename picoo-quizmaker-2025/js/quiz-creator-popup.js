document.addEventListener("DOMContentLoaded", function () {
        // Create popup elements
        const popupOverlay = document.createElement("div");
        popupOverlay.id = "popup-overlay";
        popupOverlay.style.display = "none";
        popupOverlay.innerHTML = `<div id="popup-message">Questions saved!</div>`;
        document.body.appendChild(popupOverlay);

        // Add styles for popup and overlay
        const style = document.createElement("style");
        style.textContent = `
      #popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.1);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-weight: 700;
        color: #292d78;
      }

      #popup-message {
        background: white;
        padding: 50px 90px;
        border-radius: 10px;
        font-size: 18px;
        box-shadow: 0 0 10px rgba(0,0,0,0.4);
      }
    `;
        document.head.appendChild(style);

        // Replace the save button behavior
        const saveButton = document.querySelector(".save-button");
        if (saveButton) {
          saveButton.addEventListener("click", function () {
            // Assuming you already have a saveQuestions function that saves to localStorage
            if (typeof saveQuestions === "function") {
              saveQuestions(); // Save logic stays the same
            }

            // Show popup
            popupOverlay.style.display = "flex";

            // Hide after 3 seconds
            setTimeout(() => {
              popupOverlay.style.display = "none";
            }, 3500);
          });
        } else {
          console.warn("Save button not found");
        }
      });