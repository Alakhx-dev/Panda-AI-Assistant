// Password toggle function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// Login function
function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/home';
        } else {
            alert('Invalid login');
        }
    })
    .catch(() => alert('Login error'));
}

// Signup function
function signupUser() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/login';
        } else {
            alert('Signup failed');
        }
    })
    .catch(() => alert('Signup error'));
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

// Global functions for profile and settings
let cropper;

function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

function openProfileModal() {
    document.getElementById('profileModal').style.display = 'block';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function openCamera() {
    closeProfileModal();
    document.getElementById('cameraInput').click();
}

function openGallery() {
    closeProfileModal();
    document.getElementById('galleryInput').click();
}

function showBuiltInAvatars() {
    closeProfileModal();
    document.getElementById('avatarsModal').style.display = 'block';
}

function closeAvatarsModal() {
    document.getElementById('avatarsModal').style.display = 'none';
}

function closeCropModal() {
    document.getElementById('cropModal').style.display = 'none';
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}

function selectBuiltInAvatar(imgSrc) {
    localStorage.setItem('profileImage', imgSrc);
    document.getElementById('profileImage').src = imgSrc;
    closeAvatarsModal();
}

function cropAndSaveImage() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            width: 100,
            height: 100,
        });
        const dataURL = canvas.toDataURL('image/png');
        localStorage.setItem('profileImage', dataURL);
        document.getElementById('profileImage').src = dataURL;
        closeCropModal();
    }
}

function logoutUser() {
    localStorage.removeItem('username');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('language');
    window.location.href = '/logout';
}

function applyLanguage(lang) {
    localStorage.setItem('language', lang);
    document.documentElement.className = lang === 'hi' ? 'language-hi' : '';
    // No reload, just update the class
}

// Event listeners for file inputs
document.getElementById('cameraInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showCropModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('galleryInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showCropModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

function showCropModal(imageSrc) {
    const cropContainer = document.getElementById('cropContainer');
    cropContainer.innerHTML = `<img id="cropImage" src="${imageSrc}" style="max-width: 100%;">`;
    document.getElementById('cropModal').style.display = 'block';

    const image = document.getElementById('cropImage');
    cropper = new Cropper(image, {
        aspectRatio: 1,
        viewMode: 1,
        responsive: true,
        restore: false,
        checkCrossOrigin: false,
        checkOrientation: false,
        modal: true,
        guides: true,
        center: true,
        highlight: false,
        background: false,
        autoCrop: true,
        autoCropArea: 0.8,
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    const profileModal = document.getElementById('profileModal');
    const avatarsModal = document.getElementById('avatarsModal');
    const cropModal = document.getElementById('cropModal');
    const uploadModal = document.getElementById('uploadModal');
    const settingsMenu = document.getElementById('settingsMenu');

    if (event.target == profileModal) {
        profileModal.style.display = 'none';
    }
    if (event.target == avatarsModal) {
        avatarsModal.style.display = 'none';
    }
    if (event.target == cropModal) {
        closeCropModal();
    }
    if (event.target == uploadModal) {
        uploadModal.style.display = 'none';
    }
    if (!event.target.closest('.settings-button') && !event.target.closest('.settings-dropdown')) {
        settingsMenu.style.display = 'none';
    }
}
