document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const businessNameInput = document.getElementById('businessName');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const loginBtn = document.getElementById('loginBtn');
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    const errorMessageElement = document.getElementById('errorMessage');

    // Get references to the invalid-feedback elements for business name and password
    const businessNameFeedback = businessNameInput.nextElementSibling;
    const passwordFeedback = passwordInput.nextElementSibling;

    // Store original feedback messages to restore them later
    const originalBusinessNameFeedbackText = businessNameFeedback.textContent;
    const originalPasswordFeedbackText = passwordFeedback.textContent;

    // Function to validate business name (not empty)
    const validateBusinessName = () => {
        if (businessNameInput.value.trim().length > 0) {
            businessNameInput.classList.remove('is-invalid');
            businessNameInput.classList.add('is-valid');
            return true;
        } else {
            businessNameInput.classList.remove('is-valid');
            businessNameInput.classList.add('is-invalid');
            return false;
        }
    };

    // Function to validate password (not empty)
    const validatePassword = () => {
        if (passwordInput.value.length > 0) {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            return true;
        } else {
            passwordInput.classList.remove('is-valid');
            passwordInput.classList.add('is-invalid');
            return false;
        }
    };

    // Add real-time validation listeners
    businessNameInput.addEventListener('input', () => {
        validateBusinessName();
        // Clear any custom error message when user starts typing
        businessNameFeedback.textContent = originalBusinessNameFeedbackText;
    });
    passwordInput.addEventListener('input', () => {
        validatePassword();
        // Clear any custom error message when user starts typing
        passwordFeedback.textContent = originalPasswordFeedbackText;
    });

    // Handle "Remember me" functionality
    const savedBusinessName = localStorage.getItem('rememberedBusinessName');
    if (savedBusinessName) {
        businessNameInput.value = savedBusinessName;
        rememberMeCheckbox.checked = true;
        validateBusinessName(); // Validate the pre-filled business name
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        event.stopPropagation(); // Stop event propagation

        // Run all validations
        const isBusinessNameValid = validateBusinessName();
        const isPasswordValid = validatePassword();

        // Check if all fields are valid
        if (isBusinessNameValid && isPasswordValid) {
            loginBtn.disabled = true; // Disable button to prevent multiple submissions
            loginBtn.textContent = 'Logging in...';

            const loginData = {
                business_name: businessNameInput.value.trim(),
                password: passwordInput.value,
            };

            // Save/remove business name based on "Remember me" checkbox
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberedBusinessName', loginData.businessName);
            } else {
                localStorage.removeItem('rememberedBusinessName');
            }

            // API call
            try {
                const API_URL = 'https://smart-invoice-backend-ukob.onrender.com/api/login'; // Your backend API endpoint for login
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(loginData),
                });

                


                if (response.ok) {
                    const result = await response.json();
                    console.log('Login successful:', result);
                    successModal.show(); // Show success modal

                    localStorage.setItem('authToken', result.token);

                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = 'invoice.html';
                    }, 1500); // Redirect after 1.5 seconds

                    // Clear form fields and validation classes on successful login
                    loginForm.reset();
                    businessNameInput.classList.remove('is-valid', 'is-invalid');
                    passwordInput.classList.remove('is-valid', 'is-invalid');
                    businessNameFeedback.textContent = originalBusinessNameFeedbackText;
                    passwordFeedback.textContent = originalPasswordFeedbackText;


                } else {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || 'An unknown error occurred during login.';
                    console.error('Login failed:', errorMessage);

                    // Display specific error message in the error modal
                    errorMessageElement.textContent = errorMessage;
                    errorModal.show();

                    // Mark fields as invalid if the error is related to credentials
                    if (errorMessage.includes('Incorrect business name') || errorMessage.includes('Incorrect password')) {
                        businessNameInput.classList.add('is-invalid');
                        passwordInput.classList.add('is-invalid');
                    }
                }

            } catch (error) {
                console.error('Network error or API call failed:', error);
                // Display a generic network error message in the error modal
                errorMessageElement.textContent = 'Network error. Please check your internet connection and try again.';
                errorModal.show();
            } finally {
                loginBtn.disabled = false; // Re-enable button
                loginBtn.textContent = 'Login';
            }
        } else {
            // If client-side validation fails, add Bootstrap's 'was-validated' class to show feedback
            loginForm.classList.add('was-validated');
        }
    });

    // Placeholder for "Forgot password?" link functionality
    const forgotPasswordLink = document.getElementById('forgotPassword');
    forgotPasswordLink.addEventListener('click', (event) => {
        event.preventDefault();
        // In a real application, you would redirect to a "forgot password" page
        console.log('Forgot password link clicked. Implement redirection or modal here.');
        // Example: window.location.href = 'forgot_password.html';
    });
});
