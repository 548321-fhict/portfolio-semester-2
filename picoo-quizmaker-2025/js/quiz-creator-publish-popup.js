document.addEventListener("DOMContentLoaded", function () {
  // Create popup elements
  const popupOverlay = document.createElement("div");
  popupOverlay.id = "popup-overlay";
  popupOverlay.style.display = "none";
  popupOverlay.innerHTML = `<div id="popup-message"></div>`;
  document.body.appendChild(popupOverlay);

  const popupMessage = popupOverlay.querySelector("#popup-message");

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(1, 0, 5, 0.55);
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
      color: #292d78;
    }
  `;
  document.head.appendChild(style);

  // Save button
  const saveButton = document.querySelector(".save-button");
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (typeof saveQuestions === "function") {
        saveQuestions();
      }
      showPopup("Questions saved!");
    });
  }

  // Publish button
  const publishButton = document.querySelector(".publish-button");
  if (publishButton) {
    publishButton.addEventListener("click", function (event) {
      event.preventDefault(); // Stop navigation
      showPopup("Quiz published!");

      setTimeout(() => {
        window.location.href = "quiz-creator-home.html"; // Navigate after delay
      }, 3500);
    });
  }

  // Function to show popup with custom message
  function showPopup(message) {
    popupMessage.textContent = message;
    popupOverlay.style.display = "flex";
    setTimeout(() => {
      popupOverlay.style.display = "none";
    }, 3500);
  }
});
