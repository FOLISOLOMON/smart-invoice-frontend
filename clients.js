document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const clientForm = document.getElementById('clientForm');
    const clientList = document.getElementById('clientList');
    const saveClientBtn = document.getElementById('saveClient');
    const viewClientModal = new bootstrap.Modal(document.getElementById('viewClientModal'));
    
    // Check authentication
    checkAuthentication();

    function checkAuthentication() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html';
        }
    }

    // Save client
    saveClientBtn.addEventListener('click', async function() {
        // Validate form
        if (!clientForm.checkValidity()) {
            clientForm.classList.add('was-validated');
            return;
        }
        
        // Disable button during submission
        saveClientBtn.disabled = true;
        saveClientBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Gather client data
        const clientData = {
            name: document.getElementById('clientName').value,
            email: document.getElementById('clientEmail').value,
            phone: document.getElementById('clientPhone').value,
            company: document.getElementById('clientCompany').value,
            address: document.getElementById('clientAddress').value
        };
        
        try {
            // Send to server
            const response = await fetch('https://c6e8-154-160-6-183.ngrok-free.app/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(clientData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success - show feedback
                showAlert('success', 'Client created successfully!');
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('createClientModal')).hide();
                
                // Reset form
                clientForm.reset();
                clientForm.classList.remove('was-validated');
                
                // Reload clients
                loadClientData();
            } else {
                showAlert('danger', 'Error saving client: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to save client. Please try again.');
        } finally {
            // Re-enable button
            saveClientBtn.disabled = false;
            saveClientBtn.textContent = 'Save Client';
        }
    });
    
    // Load client data
    async function loadClientData() {
        try {
            // Show loading state
            clientList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
            
            // Fetch data from API
            const response = await fetch('https://c6e8-154-160-6-183.ngrok-free.app/api/clients', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const clients = await response.json();
            
            if (clients.length === 0) {
                clientList.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">
                            No clients found. Add your first client to get started.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Render clients
            renderClients(clients);
            
        } catch (error) {
            console.error('Error loading clients:', error);
            clientList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">
                        Failed to load clients. Please try again.
                    </td>
                </tr>
            `;
        }
    }
    
    // Render clients
    function renderClients(clients) {
        clientList.innerHTML = '';
        
        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.company || 'N/A'}</td>
                <td>${client.invoice_count || 0}</td>
                <td>${client.total_value ? formatCurrency(client.total_value) : '$0.00'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-client" data-id="${client.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-client" data-id="${client.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-client" data-id="${client.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            clientList.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-client').forEach(btn => {
            btn.addEventListener('click', function() {
                viewClient(this.getAttribute('data-id'));
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-client').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteClient(this.getAttribute('data-id'));
            });
        });
    }
    
    // View client details
    async function viewClient(clientId) {
        try {
            const response = await fetch(`https://c6e8-154-160-6-183.ngrok-free.app/api/clients/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const client = await response.json();
            
            if (response.ok) {
                renderClientDetails(client);
                viewClientModal.show();
            } else {
                showAlert('danger', 'Error loading client: ' + (client.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to load client. Please try again.');
        }
    }
    
    // Delete client
    async function deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client?')) {
            return;
        }
        
        try {
            const response = await fetch(`https://c6e8-154-160-6-183.ngrok-free.app/api/clients/${clientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert('success', 'Client deleted successfully!');
                loadClientData();
            } else {
                showAlert('danger', 'Error deleting client: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to delete client. Please try again.');
        }
    }
    
    // Render client details in modal
    function renderClientDetails(client) {
        document.getElementById('clientDetails').innerHTML = `
            <div class="container">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h4>${client.name}</h4>
                        <p class="mb-1"><strong>Company:</strong> ${client.company || 'N/A'}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <p class="mb-1"><strong>Email:</strong> ${client.email}</p>
                        <p class="mb-1"><strong>Phone:</strong> ${client.phone || 'N/A'}</p>
                    </div>
                </div>
                
                <div class="mb-3">
                    <h5>Contact Information</h5>
                    <p><strong>Address:</strong></p>
                    <p>${client.address || 'Not specified'}</p>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Client Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Total Invoices:</strong> ${client.invoice_count || 0}</p>
                                <p><strong>Total Value:</strong> ${client.total_value ? formatCurrency(client.total_value) : '$0.00'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Last Invoice Date:</strong> ${client.last_invoice_date ? formatDate(client.last_invoice_date) : 'N/A'}</p>
                                <p><strong>Average Invoice Value:</strong> ${client.avg_invoice_value ? formatCurrency(client.avg_invoice_value) : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Format currency
    function formatCurrency(amount) {
        return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Show alert message
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to the alerts container or create one
        let alertsContainer = document.getElementById('alerts-container');
        if (!alertsContainer) {
            alertsContainer = document.createElement('div');
            alertsContainer.id = 'alerts-container';
            alertsContainer.className = 'position-fixed top-0 end-0 p-3';
            alertsContainer.style.zIndex = '1100';
            document.body.appendChild(alertsContainer);
        }
        
        alertsContainer.appendChild(alertDiv);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }
    
    // Logout function
    async function logoutUser() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('businessName');
            localStorage.removeItem('rememberBusiness');
            window.location.href = 'login.html';
        }
    }
    
    // Logout button event listener
    document.getElementById('logoutButton')?.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Initial load
    loadClientData();
});


// https://github.com/FOLISOLOMON/