document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const invoiceForm = document.getElementById('invoiceForm');
    const invoiceList = document.getElementById('invoiceList');
    const addItemBtn = document.getElementById('addItem');
    const invoiceItems = document.getElementById('invoiceItems');
    const saveInvoiceBtn = document.getElementById('saveInvoice');
    const viewInvoiceModal = new bootstrap.Modal(document.getElementById('viewInvoiceModal'));

     const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('show');
        });
    }

    
    // Check authentication
    checkAuthentication();

    function checkAuthentication() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html';
        }
    }

    // Current date for default values
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Set due date to 30 days from now by default
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    
    // Generate a random invoice number if field is empty
    document.getElementById('invoiceNumber').addEventListener('focus', function() {
        if (!this.value) {
            this.value = 'INV-' + Math.floor(1000 + Math.random() * 9000);
        }
    });
    
    // Add item row
    addItemBtn.addEventListener('click', function() {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row row mb-3';
        itemRow.innerHTML = `
            <div class="col-md-6">
                <input type="text" class="form-control" placeholder="Description" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="1" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control price" placeholder="Price" min="0" step="0.01" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm remove-item">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        invoiceItems.appendChild(itemRow);
        
        // Add event listener to the new remove button
        itemRow.querySelector('.remove-item').addEventListener('click', function() {
            if (invoiceItems.children.length > 1) {
                itemRow.remove();
                calculateTotals();
            } else {
                showAlert('danger', 'You must have at least one item on the invoice.');
            }
        });
        
        // Add event listeners for quantity/price changes
        itemRow.querySelector('.quantity').addEventListener('input', calculateTotals);
        itemRow.querySelector('.price').addEventListener('input', calculateTotals);
    });
    
    // Remove item row (for the initial row)
    const initialRemoveBtn = document.querySelector('.remove-item');
    if (initialRemoveBtn) {
        initialRemoveBtn.addEventListener('click', function() {
            if (invoiceItems.children.length > 1) {
                this.closest('.item-row').remove();
                calculateTotals();
            } else {
                showAlert('danger', 'You must have at least one item on the invoice.');
            }
        });
    }
    
    // Calculate invoice totals
    function calculateTotals() {
        let subtotal = 0;
        
        document.querySelectorAll('.item-row').forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            subtotal += quantity * price;
        });
        
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const totalAmount = subtotal + taxAmount;
        
        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
        document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    }
    
    // Format currency
  function formatCurrency(amount) {
    const number = Number(amount || 0); // Converts string/undefined/null safely
    return '₵' + number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}
    
    // Tax rate change handler
    document.getElementById('taxRate').addEventListener('input', calculateTotals);
    
    // Quantity/price change handlers for initial row
    const initialQuantity = document.querySelector('.quantity');
    const initialPrice = document.querySelector('.price');
    if (initialQuantity) initialQuantity.addEventListener('input', calculateTotals);
    if (initialPrice) initialPrice.addEventListener('input', calculateTotals);
    
    // Save invoice
    saveInvoiceBtn.addEventListener('click', async function() {
        // Validate form
        if (!invoiceForm.checkValidity()) {
            invoiceForm.classList.add('was-validated');
            return;
        }
        
        // Disable button during submission
        saveInvoiceBtn.disabled = true;
        saveInvoiceBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Gather invoice data
        const invoiceData = {
            invoice_number: document.getElementById('invoiceNumber').value,
            client_name: document.getElementById('clientName').value,
            client_email: document.getElementById('clientEmail').value,
            date: document.getElementById('invoiceDate').value,
            due_date: document.getElementById('dueDate').value,
            notes: document.getElementById('notes').value,
            items: [],
            subtotal: parseFloat(document.getElementById('subtotal').textContent.replace(/[^0-9.-]+/g, "")),
            tax: parseFloat(document.getElementById('taxAmount').textContent.replace(/[^0-9.-]+/g, "")),
            total_amount: parseFloat(document.getElementById('totalAmount').textContent.replace(/[^0-9.-]+/g, ""))
        };
        
        // Gather items
        document.querySelectorAll('.item-row').forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            const total = quantity * price;
            
            invoiceData.items.push({
                description: row.querySelector('input[type="text"]').value,
                quantity: quantity,
                price: price,
                amount: total
            });
        });
        
        try {
            // Send to server
            const response = await fetch('https://smart-invoice-backend-ukob.onrender.com/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(invoiceData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success - show feedback
                showAlert('success', 'Invoice created successfully!');
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('createInvoiceModal')).hide();
                
                // Reset form
                invoiceForm.reset();
                invoiceForm.classList.remove('was-validated');
                
                // Reset items to one row
                while (invoiceItems.children.length > 1) {
                    invoiceItems.lastChild.remove();
                }
                document.querySelector('.quantity').value = 1;
                document.querySelector('.price').value = '';
                document.querySelector('input[type="text"]').value = '';
                calculateTotals();
                
                // Reload invoices
                loadInvoiceData();
            } else {
                showAlert('danger', 'Error saving invoice: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to save invoice. Please try again.');
        } finally {
            // Re-enable button
            saveInvoiceBtn.disabled = false;
            saveInvoiceBtn.textContent = 'Save Invoice';
        }
    });
    
    // Load invoice data
   async function loadInvoiceData() {
    try {
        // Show loading spinner
        invoiceList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        const response = await fetch('https://smart-invoice-backend-ukob.onrender.com/api/invoices', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (response.status === 401) {
            alert("Session expired. Please log in again.");
            localStorage.removeItem('authToken');  // Clean up old token
            window.location.href = 'login.html';   // Redirect to login
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        console.log("Parsed invoices:", data);

        if (data.length === 0) {
            invoiceList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        No invoices found. Create your first invoice to get started.
                    </td>
                </tr>
            `;
            return;
        }

        renderInvoices(data);

    } catch (error) {
        console.error("Error loading invoices:", error);
        alert("Failed to load invoices. Please try again.");
    }
}


    
    // Render invoices
    function renderInvoices(invoices) {
        invoiceList.innerHTML = '';
        
        invoices.forEach(invoice => {
            const status = getInvoiceStatus(invoice.date, invoice.due_date);
            const statusClass = {
                'Paid': 'bg-success',
                'Pending': 'bg-warning',
                'Overdue': 'bg-danger'
            }[status];
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoice_number}</td>
                <td>${invoice.client_name}</td>
                <td>${formatDate(invoice.date)}</td>
                <td>${formatDate(invoice.due_date)}</td>
                <td>${formatCurrency(invoice.total_amount)}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-invoice" data-id="${invoice.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-invoice" data-id="${invoice.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success send-invoice" data-id="${invoice.id}" data-email="${invoice.client_email}">
                        <i class="bi bi-envelope"></i>
                    </button>
                </td>
            `;
            invoiceList.appendChild(row);
        });
        
        // Add event listeners to view buttons
        document.querySelectorAll('.view-invoice').forEach(btn => {
            btn.addEventListener('click', function() {
                viewInvoice(this.getAttribute('data-id'));
            });
        });
        
        // Add event listeners to send buttons
        document.querySelectorAll('.send-invoice').forEach(btn => {
            btn.addEventListener('click', function() {
                sendInvoice(this.getAttribute('data-id'), this.getAttribute('data-email'));
            });
        });
    }
    
    // View invoice details
    async function viewInvoice(invoiceId) {
        try {
            const response = await fetch(`https://smart-invoice-backend-ukob.onrender.com/api/invoices/${invoiceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            const invoice = await response.json();
            
            if (response.ok) {
                renderInvoiceDetails(invoice);
                viewInvoiceModal.show();
            } else {
                showAlert('danger', 'Error loading invoice: ' + (invoice.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to load invoice. Please try again.');
        }
    }
    
    // Send invoice
    async function sendInvoice(invoiceId, clientEmail) {
        if (!confirm(`Are you sure you want to send this invoice to ${clientEmail}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`https://smart-invoice-backend-ukob.onrender.com/api/invoices/${invoiceId}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert('success', 'Invoice sent successfully!');
            } else {
                showAlert('danger', 'Error sending invoice: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('danger', 'Failed to send invoice. Please try again.');
        }
    }
    
   // Updated renderInvoiceDetails function to fix amount display
    function renderInvoiceDetails(invoice) {
        const status = getInvoiceStatus(invoice.date, invoice.due_date);
        const statusClass = {
            'Paid': 'badge-paid',
            'Pending': 'badge-pending',
            'Overdue': 'badge-overdue'
        }[status];
        
        let itemsHtml = '';
        if (invoice.items && invoice.items.length > 0) {
            itemsHtml = invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unit_price || item.price)}</td>
                    <td>${formatCurrency(item.total || item.amount)}</td>
                </tr>
            `).join('');
        }
        
        document.getElementById('invoiceDetails').innerHTML = `
            <div class="container">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <h3>Invoice ${invoice.invoice_number}</h3>
                        <p class="mb-1"><strong>Status:</strong> <span class="badge ${statusClass}">${status}</span></p>
                        <p class="mb-1"><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                        <p class="mb-1"><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <h5>${invoice.client_name}</h5>
                        <p>${invoice.client_email}</p>
                    </div>
                </div>
                
                <div class="table-responsive mb-4">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Subtotal</strong></td>
                                <td>${formatCurrency(invoice.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Tax</strong></td>
                                <td>${formatCurrency(invoice.tax)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" class="text-end"><strong>Total Amount</strong></td>
                                <td>${formatCurrency(invoice.total_amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                ${invoice.notes ? `<div class="mb-3">
                    <h5>Notes</h5>
                    <p>${invoice.notes}</p>
                </div>` : ''}
            </div>
        `;
    }
    
    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    // Determine invoice status
    function getInvoiceStatus(date, dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        
        if (today > due) {
            return 'Overdue';
        } else {
            return 'Pending';
        }
    }
    
    // Print invoice
    document.getElementById('printInvoice')?.addEventListener('click', function() {
        window.print();
    });
    
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
            // Optional: Send a request to invalidate the token on the server
            await fetch('https://smart-invoice-backend-ukob.onrender.com/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('businessName');
            localStorage.removeItem('rememberBusiness');
            
            // Redirect to login page
            window.location.href = 'login.html';
        }
    }
    
    // Logout button event listener
    document.getElementById('logoutButton')?.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
    });
    
    // Initial load
    loadInvoiceData();
    console.log(localStorage.getItem('authToken'));

});