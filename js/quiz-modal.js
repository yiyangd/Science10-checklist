import { loadQuizUnit } from "./data-store.js";
import { loadQuizPassState, markPassed } from "./storage.js";

function shuffleChoices(question) {
  const entries = question.choices.map((choice, originalIndex) => ({ choice, originalIndex }));
  for (let index = entries.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [entries[index], entries[swapIndex]] = [entries[swapIndex], entries[index]];
  }
  return entries;
}

function sentence(value) {
  return /[.!?]$/.test(value.trim()) ? value.trim() : `${value.trim()}.`;
}

export class QuizModal {
  constructor({ onPass }) {
    this.onPass = onPass;
    this.modal = document.getElementById("quizModal");
    this.form = document.getElementById("quizForm");
    this.title = document.getElementById("quizTitle");
    this.submit = document.getElementById("quizSubmit");
    this.retry = document.getElementById("quizRetry");
    this.closeButton = document.getElementById("quizClose");
    this.cancel = document.getElementById("quizCancel");
    this.active = null;
    this.previousFocus = null;

    this.form.addEventListener("submit", event => this.handleSubmit(event));
    this.retry.addEventListener("click", () => this.render());
    this.closeButton.addEventListener("click", () => this.close());
    this.cancel.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", event => {
      if (event.target === this.modal) this.close();
    });
    document.addEventListener("keydown", event => this.handleKeydown(event));
  }

  async open(kpId, unitNumber, trigger) {
    const quizzes = await loadQuizUnit(unitNumber);
    const quiz = quizzes[kpId];
    if (!quiz) throw new Error(`No Quiz data found for ${kpId}.`);
    this.active = { kpId, unitNumber, quiz };
    this.previousFocus = trigger || document.activeElement;
    this.render();
    this.modal.hidden = false;
    document.body.classList.add("modal-open");
    document.getElementById("appView").setAttribute("inert", "");
    document.querySelector(".app-bar").setAttribute("inert", "");
    this.title.focus();
  }

  render() {
    if (!this.active) return;
    const { kpId, quiz } = this.active;
    const passed = Boolean(loadQuizPassState()[kpId]);
    this.title.textContent = quiz.title || "Knowledge Point Quiz";
    this.retry.hidden = true;
    this.submit.hidden = false;
    this.form.innerHTML = quiz.questions.map((question, questionIndex) => {
      const choices = shuffleChoices(question).map(({ choice, originalIndex }) => `
        <label class="quiz-choice">
          <input type="radio" name="${question.id}" value="${originalIndex}" required>
          <span>${choice}</span>
        </label>
      `).join("");
      return `
        <fieldset class="quiz-question" data-question-id="${question.id}">
          <legend>${questionIndex + 1}. ${question.prompt}</legend>
          ${choices}
          <div class="quiz-feedback" role="status" aria-live="polite" hidden></div>
        </fieldset>
      `;
    }).join("");
    if (passed) {
      this.form.insertAdjacentHTML("afterbegin", '<div class="quiz-summary-feedback success" role="status">Already passed. Retry for practice without losing progress.</div>');
    }
    this.typeset();
  }

  handleSubmit(event) {
    event.preventDefault();
    if (!this.active) return;
    const { kpId, quiz } = this.active;
    this.form.querySelectorAll(".quiz-summary-feedback").forEach(item => item.remove());
    let correctCount = 0;

    for (const question of quiz.questions) {
      const fieldset = this.form.querySelector(`[data-question-id="${question.id}"]`);
      const selected = this.form.querySelector(`input[name="${question.id}"]:checked`);
      const isCorrect = selected && Number(selected.value) === question.correctIndex;
      if (isCorrect) correctCount += 1;
      fieldset.classList.toggle("is-correct", Boolean(isCorrect));
      fieldset.classList.toggle("is-wrong", !isCorrect);
      const feedback = fieldset.querySelector(".quiz-feedback");
      feedback.hidden = false;
      feedback.className = `quiz-feedback ${isCorrect ? "success" : "error"}`;
      feedback.textContent = isCorrect
        ? `Correct. ${question.explanation}`
        : `Not yet. Correct answer: ${sentence(question.choices[question.correctIndex])} ${question.explanation}`;
    }

    if (correctCount === quiz.questions.length) {
      markPassed(kpId);
      this.onPass(kpId);
      this.form.insertAdjacentHTML("afterbegin", '<div class="quiz-summary-feedback success" role="status" aria-live="assertive">Passed. This Knowledge Point is checked and saved.</div>');
      this.submit.hidden = true;
    } else {
      this.form.insertAdjacentHTML("afterbegin", `<div class="quiz-summary-feedback error" role="status" aria-live="assertive">Score: ${correctCount}/${quiz.questions.length}. Review the feedback, then retry.</div>`);
    }
    this.retry.hidden = false;
    this.form.scrollTop = 0;
    this.typeset();
  }

  handleKeydown(event) {
    if (this.modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...this.modal.querySelectorAll('#quizTitle, button:not([hidden]), input:not([disabled])')]
      .filter(element => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  close() {
    this.modal.hidden = true;
    document.body.classList.remove("modal-open");
    document.getElementById("appView").removeAttribute("inert");
    document.querySelector(".app-bar").removeAttribute("inert");
    this.active = null;
    const focusTarget = this.previousFocus;
    this.previousFocus = null;
    if (focusTarget?.isConnected) focusTarget.focus();
  }

  typeset() {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([this.modal]).catch(() => {});
  }
}
