document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const businessNameInput = document.getElementById('businessName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const registerBtn = document.getElementById('registerBtn');
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));

    // Get references to the invalid-feedback elements
    // Assuming they are the immediate next sibling of their respective input
    const businessNameFeedback = businessNameInput.nextElementSibling;
    const emailFeedback = emailInput.nextElementSibling;

    // Store original feedback messages to restore them later
    const originalBusinessNameFeedbackText = businessNameFeedback.textContent;
    const originalEmailFeedbackText = emailFeedback.textContent;

    // Function to validate email format
    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    // Function to check password strength
    const checkPasswordStrength = (password) => {
        let strength = 0;
        const feedback = [];

        if (password.length >= 8) {
            strength += 1;
        } else {
            feedback.push("Password must be at least 8 characters.");
        }
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;

        let barWidth = (strength / 5) * 100;
        let barClass = 'bg-danger';
        let text = 'Weak';

        if (strength >= 4) {
            barClass = 'bg-success';
            text = 'Strong';
        } else if (strength >= 2) {
            barClass = 'bg-warning';
            text = 'Moderate';
        }

        passwordStrengthBar.style.width = `${barWidth}%`;
        passwordStrengthBar.className = `progress-bar ${barClass}`;
        passwordStrengthText.textContent = text;
    };

    // Event listener for password input to update strength
    passwordInput.addEventListener('input', () => {
        checkPasswordStrength(passwordInput.value);
        validateConfirmPassword(); // Re-validate confirm password when main password changes
    });

    /**
     * Sets a custom invalid feedback message for an input field.
     * @param {HTMLElement} inputElement The input field element.
     * @param {HTMLElement} feedbackElement The corresponding invalid-feedback element.
     * @param {string} message The custom error message to display.
     */
    const setCustomInvalidFeedback = (inputElement, feedbackElement, message) => {
        inputElement.classList.remove('is-valid');
        inputElement.classList.add('is-invalid');
        feedbackElement.textContent = message;
    };

    /**
     * Clears custom invalid feedback and restores original message/state.
     * @param {HTMLElement} inputElement The input field element.
     * @param {HTMLElement} feedbackElement The corresponding invalid-feedback element.
     * @param {string} originalMessage The original message for the feedback element.
     */
    const clearCustomInvalidFeedback = (inputElement, feedbackElement, originalMessage) => {
        inputElement.classList.remove('is-invalid', 'is-valid');
        feedbackElement.textContent = originalMessage; // Restore original message
    };

    // Function to validate business name
    const validateBusinessName = () => {
        if (businessNameInput.value.trim().length >= 2) {
            businessNameInput.classList.remove('is-invalid');
            businessNameInput.classList.add('is-valid');
            return true;
        } else {
            businessNameInput.classList.remove('is-valid');
            businessNameInput.classList.add('is-invalid');
            return false;
        }
    };

    // Function to validate email
    const validateEmail = () => {
        if (isValidEmail(emailInput.value.trim())) {
            emailInput.classList.remove('is-invalid');
            emailInput.classList.add('is-valid');
            return true;
        } else {
            emailInput.classList.remove('is-valid');
            emailInput.classList.add('is-invalid');
            return false;
        }
    };

    // Function to validate password
    const validatePassword = () => {
        if (passwordInput.value.length >= 8) {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            return true;
        } else {
            passwordInput.classList.remove('is-valid');
            passwordInput.classList.add('is-invalid');
            return false;
        }
    };

    // Function to validate confirm password
    const validateConfirmPassword = () => {
        if (confirmPasswordInput.value === passwordInput.value && confirmPasswordInput.value !== '') {
            confirmPasswordInput.classList.remove('is-invalid');
            confirmPasswordInput.classList.add('is-valid');
            return true;
        } else {
            confirmPasswordInput.classList.remove('is-valid');
            confirmPasswordInput.classList.add('is-invalid');
            return false;
        }
    };

    // Add real-time validation listeners
    businessNameInput.addEventListener('input', () => {
        validateBusinessName();
        // Clear any backend-specific error when user starts typing again
        clearCustomInvalidFeedback(businessNameInput, businessNameFeedback, originalBusinessNameFeedbackText);
    });
    emailInput.addEventListener('input', () => {
        validateEmail();
        // Clear any backend-specific error when user starts typing again
        clearCustomInvalidFeedback(emailInput, emailFeedback, originalEmailFeedbackText);
    });
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);


    // Form submission handler
    registrationForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        event.stopPropagation(); // Stop event propagation

        // Run all validations
        const isBusinessNameValid = validateBusinessName();
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();

        // Check if all fields are valid
        if (isBusinessNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
            registerBtn.disabled = true; // Disable button to prevent multiple submissions
            registerBtn.textContent = 'Registering...';

            const businessData = {
                business_name: businessNameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value, // In a real app, hash this before sending
            };

            // API call
            try {
                const API_URL = 'https://smart-invoice-backend-ukob.onrender.com/api/register'; // Your backend API endpoint for registration
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(businessData),
                });

                setTimeout(() => {
                        window.location.href = './login.html'; // Redirect to dashboard page
                    }, 1500); // Redirect after 1.5 seconds

                if (response.ok) {
                    const result = await response.json();
                    console.log('Registration successful:', result);
                    successModal.show(); // Show success modal
                    registrationForm.reset(); // Clear form fields
                    // Remove all validation classes and reset password strength
                    businessNameInput.classList.remove('is-valid', 'is-invalid');
                    emailInput.classList.remove('is-valid', 'is-invalid');
                    passwordInput.classList.remove('is-valid', 'is-invalid');
                    confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
                    passwordStrengthBar.style.width = '0%';
                    passwordStrengthBar.className = 'progress-bar bg-danger';
                    passwordStrengthText.textContent = 'Weak';
                    // Also clear any custom feedback messages
                    businessNameFeedback.textContent = originalBusinessNameFeedbackText;
                    emailFeedback.textContent = originalEmailFeedbackText;

                } else {
                    const errorData = await response.json();
                    const errorMessage = errorData.message || 'An unknown error occurred during registration.';
                    console.error('Registration failed:', errorMessage);

                    // Check for specific backend error messages
                    if (errorMessage.includes('Business name already exists')) {
                        setCustomInvalidFeedback(businessNameInput, businessNameFeedback, 'This business name is already taken.');
                    } else if (errorMessage.includes('Email already exists')) {
                        setCustomInvalidFeedback(emailInput, emailFeedback, 'This email address is already registered.');
                    } else {
                        // For other general errors, you might want to display them in a general error area
                        // For now, we'll just log them and keep the existing validation feedback.
                        console.error('General registration error:', errorMessage);
                    }
                }

            } catch (error) {
                console.error('Network error or API call failed:', error);
                // Handle network errors or other exceptions
                // Consider adding a general error message display for the user here too.
            } finally {
                registerBtn.disabled = false; // Re-enable button
                registerBtn.textContent = 'Register';
            }
        } else {
            // If client-side validation fails, add Bootstrap's 'was-validated' class to show feedback
            registrationForm.classList.add('was-validated');
        }
    });

    // Initial check for password strength on load if there's pre-filled data (unlikely for registration)
    checkPasswordStrength(passwordInput.value);
});
