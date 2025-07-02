document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    
    // Check for remembered credentials
    if (localStorage.getItem('rememberBusiness') && localStorage.getItem('rememberBusiness') === 'true') {
        document.getElementById('businessName').value = localStorage.getItem('businessName') || '';
        document.getElementById('password').value = localStorage.getItem('password') || '';
        document.getElementById('rememberMe').checked = true;
    }
    
    // Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset validation
        const inputs = loginForm.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
        
        // Get form values
        const businessName = document.getElementById('businessName').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Simple validation
        let isValid = true;
        if (businessName === '') {
            document.getElementById('businessName').classList.add('is-invalid');
            isValid = false;
        }
        if (password === '') {
            document.getElementById('password').classList.add('is-invalid');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Handle remember me
        if (rememberMe) {
            localStorage.setItem('rememberBusiness', 'true');
            localStorage.setItem('businessName', businessName);
            localStorage.setItem('password', password);
        } else {
            localStorage.removeItem('rememberBusiness');
            localStorage.removeItem('businessName');
            localStorage.removeItem('password');
        }
        
        // Attempt login
        try {
            const response = await fetch('https://smart-invoice-backend-ukob.onrender.com/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    business_name: businessName,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login successful - store token and redirect
                localStorage.setItem('authToken', data.token);
                window.location.href = './invoices.html'; // Redirect to dashboard
            } else {
                // Show error message
                document.getElementById('errorMessage').textContent = data.message || 'Login failed. Please try again.';
                errorModal.show();
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('errorMessage').textContent = 'Network error. Please try again later.';
            errorModal.show();
        }
    });
    
    // Forgot password handler
    document.getElementById('forgotPassword').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality coming soon!');
    });
});