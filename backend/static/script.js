// Password toggle function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// Signup
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('error-message');

        if (password !== confirmPassword) {
            errorDiv.innerText = 'Passwords do not match.';
            errorDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Account created successfully!');
                window.location.href = '/login';
            } else {
                errorDiv.innerText = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.innerText = 'Error creating account.';
            errorDiv.style.display = 'block';
        }
    });
}

// Login
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message') || document.createElement('div');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                window.location.href = '/home';
            } else {
                if (!document.getElementById('error-message')) {
                    errorDiv.id = 'error-message';
                    errorDiv.style.color = 'red';
                    document.querySelector('.auth-card').appendChild(errorDiv);
                }
                errorDiv.innerText = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.innerText = 'Error logging in.';
            errorDiv.style.display = 'block';
        }
    });
}

// Upload Image for Summary
async function uploadImage() {
    const fileInput = document.getElementById("imageInput");
    const cameraInput = document.getElementById("cameraInput");
    const linkInput = document.getElementById("linkInput");
    const resultDiv = document.getElementById("result");

    let file = null;
    if (fileInput && fileInput.files.length) {
        file = fileInput.files[0];
    } else if (cameraInput && cameraInput.files.length) {
        file = cameraInput.files[0];
    }

    if (!file && !linkInput.value) {
        resultDiv.innerText = "Please select an image or paste a link.";
        resultDiv.style.display = 'block';
        return;
    }

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = 'Processing...';

    const formData = new FormData();
    if (file) {
        formData.append("image", file);
    } else {
        // For link, but endpoint expects image, so perhaps handle differently, but for now assume image
        resultDiv.innerText = "Link input not implemented for image upload.";
        return;
    }

    try {
        const response = await fetch("/upload-image", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.summary && data.mcqs) {
            let html = `<strong>Summary:</strong> ${data.summary}<br><br><strong>MCQs:</strong><ul>`;
            data.mcqs.forEach(q => {
                html += `<li><strong>${q.question}</strong><br>`;
                html += `Options: ${q.options.join(', ')}<br>`;
                html += `Answer: ${q.answer}</li>`;
            });
            html += "</ul>";
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = 'Error: Invalid response format.';
        }

    } catch (error) {
        resultDiv.innerText = "Error processing.";
    }
}

// Solve Question
async function solveQuestion() {
    const fileInput = document.getElementById("imageInput");
    const cameraInput = document.getElementById("cameraInput");
    const linkInput = document.getElementById("linkInput");
    const resultDiv = document.getElementById("result");
    const spinner = document.getElementById("spinner");

    let question = '';
    if (fileInput && fileInput.files.length) {
        // For simplicity, assume text extraction, but endpoint expects JSON with question
        resultDiv.innerText = "Image input for questions not implemented.";
        resultDiv.style.display = 'block';
        return;
    } else if (linkInput.value) {
        question = linkInput.value;
    } else {
        resultDiv.innerText = "Please provide a question.";
        resultDiv.style.display = 'block';
        return;
    }

    resultDiv.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const response = await fetch('/solve-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        if (data.solution) {
            let html = '<strong>Solution:</strong><br>';
            html += '<strong>Steps:</strong><ul>';
            data.solution.steps.forEach(step => {
                html += `<li>${step}</li>`;
            });
            html += '</ul>';
            html += `<strong>Final Answer:</strong> ${data.solution.final_answer}`;
            resultDiv.innerHTML = html;
            resultDiv.style.display = 'block';
        } else {
            resultDiv.innerHTML = 'Error: Invalid response format.';
            resultDiv.style.display = 'block';
        }
    } catch (error) {
        resultDiv.innerHTML = 'Error solving question.';
        resultDiv.style.display = 'block';
    } finally {
        spinner.style.display = 'none';
    }
}

// Process Video for Notes
async function processVideo() {
    const fileInput = document.getElementById("imageInput");
    const cameraInput = document.getElementById("cameraInput");
    const youtubeInput = document.getElementById("youtubeInput");
    const resultDiv = document.getElementById("result");
    const spinner = document.getElementById("spinner");

    let url = '';
    if (youtubeInput.value) {
        url = youtubeInput.value;
    } else {
        resultDiv.innerText = "Please enter a YouTube URL.";
        resultDiv.style.display = 'block';
        return;
    }

    resultDiv.style.display = 'none';
    spinner.style.display = 'block';

    try {
        const response = await fetch("/youtube-process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        let html = `<strong>Summary:</strong> ${data.summary}<br><br><strong>MCQs:</strong><ul>`;
        data.mcqs.forEach(q => {
            html += `<li><strong>${q.question}</strong><br>`;
            html += `Options: ${q.options.join(', ')}<br>`;
            html += `Answer: ${q.answer}</li>`;
        });
        html += "</ul><br><strong>Notes:</strong><ul>";
        data.notes.forEach(note => {
            html += `<li>${note}</li>`;
        });
        html += "</ul>";

        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';

    } catch (error) {
        resultDiv.innerText = "Error processing.";
        resultDiv.style.display = 'block';
    } finally {
        spinner.style.display = 'none';
    }
}

// Modal functions
function openModal() {
    document.getElementById('uploadModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

function openCamera() {
    closeModal();
    document.getElementById('cameraInput').click();
}

function openGallery() {
    closeModal();
    document.getElementById('imageInput').click();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}
