document.addEventListener("DOMContentLoaded", function () {
        const questionList = document.getElementById("question-list");
        const questionDisplay = document.getElementById("question-display");
        let activeQuestionIndex = 0;
        

        const titleInput = document.querySelector(".quiz-input");
        const savedTitle = localStorage.getItem("quizTitle");
        if (savedTitle) {
          titleInput.value = savedTitle;
        }

        let questions = JSON.parse(localStorage.getItem("questions")) || [
          {
            text: "Sample Question 1",
            answers: ["", "", "", ""],
            correctAnswers: [false, false, false, false], // ✅
            timeLimit: "30 seconds",
            answerType: "Single select",
            answerCount: 4,
          },
        ];

        const timeLimitSelect = document.querySelector(
          ".right-box select:nth-of-type(1)"
        );
        const answerTypeSelect = document.querySelector(
          ".right-box select:nth-of-type(2)"
        );
        const answerCountSelect = document.querySelector(
          ".right-box select:nth-of-type(3)"
        );

        function saveQuestions() {
          localStorage.setItem("questions", JSON.stringify(questions));

          // Show popup
          const overlay = document.getElementById("popup-overlay");
          overlay.style.display = "flex";

          // Hide popup after 3 seconds
          setTimeout(() => {
            overlay.style.display = "none";
          }, 3000);
        }

        function saveTitle() {
          const titleInput = document.querySelector(".quiz-input");
          localStorage.setItem("quizTitle", titleInput.value);
        }

        function renderQuestionList() {
          questionList.innerHTML = "";
          questions.forEach((question, index) => {
            const questionItem = document.createElement("div");
            questionItem.className = "question-item";
            questionItem.innerText = `Question ${index + 1}`;

            questionItem.onclick = function () {
              showQuestion(index);
              setActiveQuestion(index);
            };

            questionList.appendChild(questionItem);
          });

          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete Question";
          deleteButton.onclick = deleteSelectedQuestion;
          questionList.appendChild(deleteButton);

          if (questions.length > 0) showQuestion(0);
        }
        
        

        function showQuestion(index) {
          if (index >= questions.length) return;

          const question = questions[index];

          // Ensure correctAnswers array exists and is the right length
          if (!question.correctAnswers || question.correctAnswers.length !== question.answerCount) {
            question.correctAnswers = Array(question.answerCount).fill(false);
          }

          questionDisplay.innerHTML = `
            <h2>Question ${index + 1}</h2>
            <input type="text" value="${question.text}" class="question-input" placeholder="Enter here your question."
              onfocus="clearPlaceholder(${index}, this)" 
              oninput="updateQuestionText(${index}, this.value)" />

            <div class="answers-section">
              ${Array.from({ length: question.answerCount })
                .map((_, i) => `
                  <div class="answer">
                    <input type="${question.answerType === "Single select" ? "radio" : "checkbox"}"
                          class="answer-checkbox" 
                          name="answer-${index}" 
                          ${question.correctAnswers[i] ? "checked" : ""} 
                          onchange="toggleChecked(${index}, ${i}, this.checked)" />
                    <input type="text" class="answer-input" 
                          value="${question.answers[i] || ""}" 
                          placeholder="Answer option" 
                          oninput="updateAnswer(${index}, ${i}, this.value)" />
                  </div>
                `)
                .join("")}
            </div>

            <p><strong>Time Limit:</strong> ${question.timeLimit}</p>
          `;
        }


        window.clearPlaceholder = function (index, input) {
          if (
            questions[index].text === "Sample Question 1" ||
            questions[index].text === "New Question"
          ) {
            input.value = "";
            updateQuestionText(index, "");
          }
        };

        window.updateQuestionText = function (index, value) {
          questions[index].text = value;
          // Removed: saveQuestions();
        };

        window.updateAnswer = function (questionIndex, answerIndex, value) {
          questions[questionIndex].answers[answerIndex] = value;
          // Removed: saveQuestions();
        };

        

        window.addQuestion = function () {
          questions.push({
            text: "New Question",
            answers: ["", "", "", ""],
            timeLimit: "30 seconds",
            answerType: "Single select",
            answerCount: 4,
          });
          renderQuestionList();
          showQuestion(questions.length - 1);
          setActiveQuestion(questions.length - 1);

        };

        window.deleteSelectedQuestion = function () {
          if (questions.length > 0) {
            questions.splice(activeQuestionIndex, 1); // Remove the selected question

            if (activeQuestionIndex >= questions.length) {
              activeQuestionIndex = questions.length - 1; // Adjust index if out of range
            }

            renderQuestionList();
            if (questions.length > 0) {
              showQuestion(activeQuestionIndex);
              setActiveQuestion(activeQuestionIndex);
            } else {
              questionDisplay.innerHTML = "<p>You have currently no questions added.</p>";
            }
          }
        };

        document.addEventListener("DOMContentLoaded", function () {
          let activeQuestionIndex = 0; // Track the active question index

          // Event listener for Time Limit dropdown
          timeLimitSelect.addEventListener("change", function () {
            if (questions[activeQuestionIndex]) {
              questions[activeQuestionIndex].timeLimit = this.value;
              showQuestion(activeQuestionIndex); // Re-render the active question
            }
          });

          // Event listener for Answer Type dropdown
          answerTypeSelect.addEventListener("change", function () {
            if (questions[activeQuestionIndex]) {
              questions[activeQuestionIndex].answerType = this.value;
              showQuestion(activeQuestionIndex); // Re-render the active question
            }
          });

          // Event listener for Answer Count dropdown
          answerCountSelect.addEventListener("change", function () {
            if (questions[activeQuestionIndex]) {
              const newAnswerCount = parseInt(this.value.split(" ")[0]); // Extract the number from the dropdown value
              questions[activeQuestionIndex].answerCount = newAnswerCount;

              // Adjust the answers array to match the new count
              const currentAnswers = questions[activeQuestionIndex].answers;
              if (currentAnswers.length > newAnswerCount) {
                questions[activeQuestionIndex].answers = currentAnswers.slice(
                  0,
                  newAnswerCount
                );
              } else {
                while (
                  questions[activeQuestionIndex].answers.length < newAnswerCount
                ) {
                  questions[activeQuestionIndex].answers.push(""); // Add empty answers
                }
              }

              showQuestion(activeQuestionIndex); // Re-render the active question
            }
          });

          // Update activeQuestionIndex when a question is clicked
          function setActiveQuestion(index) {
            activeQuestionIndex = index; // Update the active question index
            const allQuestions = document.querySelectorAll(".question-item");
            allQuestions.forEach((item) => item.classList.remove("active")); // Remove active class from all

            const activeQuestion = allQuestions[index];
            if (activeQuestion) {
              activeQuestion.classList.add("active"); // Add active class to the selected question
            }
          }
        });

        function setActiveQuestion(index) {
          activeQuestionIndex = index; // ✅ Fix is here

          const allQuestions = document.querySelectorAll(".question-item");
          allQuestions.forEach((item) => item.classList.remove("active"));

          const activeQuestion = allQuestions[index];
          if (activeQuestion) {
            activeQuestion.classList.add("active");
          }
        }

        window.toggleChecked = function (questionIndex, answerIndex, isChecked) {
          const q = questions[questionIndex];

          if (q.answerType === "Single select") {
            // Only one answer can be selected
            q.correctAnswers = q.correctAnswers.map(() => false);
          }

          q.correctAnswers[answerIndex] = isChecked;
        };

        const deleteButton = document.querySelector(".delete-button");
        if (deleteButton) {
          deleteButton.addEventListener("click", function () {
            if (questions.length > 0) {
              questions.splice(activeQuestionIndex, 1);

              if (activeQuestionIndex >= questions.length) {
                activeQuestionIndex = questions.length - 1;
              }

              renderQuestionList();

              if (questions.length > 0) {
                showQuestion(activeQuestionIndex);
                setActiveQuestion(activeQuestionIndex);
              } else {
                questionDisplay.innerHTML = "<p>You have currently no questions added.</p>";
              }
            }
          });
        }

        document.querySelectorAll(".save-button").forEach(button => {
          button.addEventListener("click", () => {
            saveQuestions();
            saveTitle();
          });
        });

        renderQuestionList();

        if (questions.length > 0) {
          setActiveQuestion(0);
          showQuestion(0);
        } else {
          questionDisplay.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; text-align: center;">
              <p>You have currently no questions added.</p>
            </div>
          `;
        }
      });