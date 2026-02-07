const API_BASE = "http://localhost:5000";

const imageForm = document.getElementById("imageForm");
const imageInput = document.getElementById("imageInput");
const imageResult = document.getElementById("imageResult");

const questionForm = document.getElementById("questionForm");
const questionText = document.getElementById("questionText");
const questionImage = document.getElementById("questionImage");
const solutionResult = document.getElementById("solutionResult");

const youtubeForm = document.getElementById("youtubeForm");
const youtubeUrl = document.getElementById("youtubeUrl");
const youtubeResult = document.getElementById("youtubeResult");

// Password toggle logic for login page
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
  });
}

function setLoading(container, text = "Working on it...") {
  container.innerHTML = `<p>${text}</p>`;
}

function renderSummaryAndMcq(container, summary, mcqs) {
  container.innerHTML = "";
  const summaryBlock = document.createElement("div");
  summaryBlock.innerHTML = `<h4>Summary</h4><p>${summary}</p>`;
  container.appendChild(summaryBlock);

  if (!Array.isArray(mcqs)) return;
  const mcqBlock = document.createElement("div");
  mcqBlock.innerHTML = `<h4>MCQ Quiz</h4>`;
  container.appendChild(mcqBlock);

  let score = 0;
  let answered = 0;

  mcqs.forEach((mcq, index) => {
    const item = document.createElement("div");
    item.className = "mcq-item";
    const q = document.createElement("p");
    q.textContent = `${index + 1}. ${mcq.question}`;
    item.appendChild(q);

    const options = document.createElement("div");
    options.className = "mcq-options";

    mcq.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const buttons = options.querySelectorAll("button");
        buttons.forEach((b) => (b.disabled = true));
        answered += 1;
        if (opt.trim() === mcq.answer.trim()) {
          btn.classList.add("correct");
          btn.textContent = `${opt} ✔`;
          score += 1;
        } else {
          btn.classList.add("wrong");
          btn.textContent = `${opt} ❌`;
        }
        if (answered === mcqs.length) {
          const scoreEl = document.createElement("p");
          scoreEl.className = "score";
          scoreEl.textContent = `Final Score: ${score} / ${mcqs.length}`;
          container.appendChild(scoreEl);
        }
      });
      options.appendChild(btn);
    });

    item.appendChild(options);
    container.appendChild(item);
  });
}

imageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!imageInput.files[0]) {
    imageResult.innerHTML = "<p>Please upload an image.</p>";
    return;
  }
  setLoading(imageResult);

  const formData = new FormData();
  formData.append("image", imageInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/upload-image`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Processing failed");
    renderSummaryAndMcq(imageResult, data.summary, data.mcqs);
  } catch (err) {
    imageResult.innerHTML = `<p>${err.message}</p>`;
  }
});

questionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(solutionResult);

  const formData = new FormData();
  formData.append("question", questionText.value.trim());
  if (questionImage.files[0]) {
    formData.append("image", questionImage.files[0]);
  }

  try {
    const res = await fetch(`${API_BASE}/solve-question`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to solve question");
    solutionResult.innerHTML = `<h4>Solution</h4><p>${data.solution}</p>`;
  } catch (err) {
    solutionResult.innerHTML = `<p>${err.message}</p>`;
  }
});

youtubeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoading(youtubeResult);

  try {
    const res = await fetch(`${API_BASE}/youtube-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: youtubeUrl.value.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to process video");
    renderSummaryAndMcq(youtubeResult, data.summary, data.mcqs);
    const notesBlock = document.createElement("div");
    notesBlock.innerHTML = `<h4>Notes</h4><p>${data.notes}</p>`;
    youtubeResult.appendChild(notesBlock);
  } catch (err) {
    youtubeResult.innerHTML = `<p>${err.message}</p>`;
  }
});
