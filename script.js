document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    
    // Form validation
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset validation
        const inputs = registrationForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
        
        // Get form values
        const businessName = document.getElementById('businessName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        let isValid = true;
        
        // Validate business name
        if (businessName.length < 2) {
            document.getElementById('businessName').classList.add('is-invalid');
            isValid = false;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('email').classList.add('is-invalid');
            isValid = false;
        }
        
        // Validate password
        if (password.length < 8) {
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            document.getElementById('confirmPassword').classList.add('is-invalid');
            isValid = false;
        }
        
        if (isValid) {
            registerUser({
                business_name: businessName,
                email: email,
                password: password
            });
        }
    });
    
    // API call to register user
    async function registerUser(userData) {
        try {
            const response = await fetch('https://smart-invoice-backend-ukob.onrender.com/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Registration successful
                successModal.show();
                registrationForm.reset();
            } else {
                // Handle errors
                if (data?.error?.includes('business_name')) {
                    document.getElementById('businessName').classList.add('is-invalid');
                    document.getElementById('businessName').nextElementSibling.textContent = 
                        'Business name already exists. Please choose another.';
                } else if (data.error.includes('email')) {
                    document.getElementById('email').classList.add('is-invalid');
                    document.getElementById('email').nextElementSibling.textContent = 
                        'Email already registered. Please use another email.';
                } else {
                    alert('Registration failed: ' + data.error);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration. Please try again.');
        }
    }
    
    
    // Password strength indicator (optional enhancement)
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const strengthBar = document.createElement('div');
            strengthBar.className = 'password-strength-bar';
            const strength = calculatePasswordStrength(this.value);
            
            // Update strength bar color based on strength
            if (strength < 30) {
                strengthBar.style.backgroundColor = '#dc3545'; // Red
            } else if (strength < 70) {
                strengthBar.style.backgroundColor = '#ffc107'; // Yellow
            } else {
                strengthBar.style.backgroundColor = '#28a745'; // Green
            }
            
            strengthBar.style.width = strength + '%';
            
            // Update or create the strength bar
            let strengthContainer = this.nextElementSibling.nextElementSibling;
            if (!strengthContainer || !strengthContainer.classList.contains('password-strength')) {
                strengthContainer = document.createElement('div');
                strengthContainer.className = 'password-strength';
                this.parentNode.insertBefore(strengthContainer, this.nextElementSibling.nextElementSibling);
            }
            
            strengthContainer.innerHTML = '';
            strengthContainer.appendChild(strengthBar);
        });
    }
    
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length contributes up to 40%
        strength += Math.min(password.length / 12 * 40, 40);
        
        // Character variety
        if (/[A-Z]/.test(password)) strength += 10;
        if (/[a-z]/.test(password)) strength += 10;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^A-Za-z0-9]/.test(password)) strength += 10;
        
        // Deductions for common patterns
        if (password.length > 0 && password.length < 6) strength -= 20;
        if (password === password.toLowerCase()) strength -= 5;
        if (password === password.toUpperCase()) strength -= 5;
        if (/^[0-9]+$/.test(password)) strength -= 15;
        
        return Math.max(0, Math.min(100, strength));
    }
});