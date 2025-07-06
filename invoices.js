document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const logoutButton = document.getElementById('logoutButton');
    const invoiceList = document.getElementById('invoiceList');
    const createInvoiceModal = document.getElementById('createInvoiceModal');
    const viewInvoiceModal = document.getElementById('viewInvoiceModal');
    const invoiceForm = document.getElementById('invoiceForm');
    const addItemBtn = document.getElementById('addItem');
    const invoiceItems = document.getElementById('invoiceItems');
    const saveInvoiceBtn = document.getElementById('saveInvoice');
    const printInvoiceBtn = document.getElementById('printInvoice');
    const pagination = document.querySelector('.pagination');
    
    // State variables
    let currentPage = 1;
    const invoicesPerPage = 10;
    let invoices = [];
    const token = localStorage.getItem('authToken');
    const API_BASE_URL = 'https://smart-invoice-backend-ukob.onrender.com/api';
    
    // Initialize the application
    init();
    
    function init() {
        // Check authentication
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default dates
        setDefaultDates();
        
        // Generate invoice number on focus if empty
        setupInvoiceNumberGeneration();
        
        // Load invoices
        loadInvoiceData();
    }
    
    function setupEventListeners() {
        // Sidebar toggle for mobile
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.add('show');
            });
        }
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('show');
            });
        }
        
        // Logout
        if (logoutButton) {
            logoutButton.addEventListener('click', logoutUser);
        }
        
        // Add invoice item
        if (addItemBtn) {
            addItemBtn.addEventListener('click', addInvoiceItem);
        }
        
        // Save invoice
        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', saveInvoice);
        }
        
        // Print invoice
        if (printInvoiceBtn) {
            printInvoiceBtn.addEventListener('click', printInvoice);
        }
        
        // Calculate totals when values change
        if (invoiceItems) {
            invoiceItems.addEventListener('input', function(e) {
                if (e.target.classList.contains('quantity') || e.target.classList.contains('price')) {
                    calculateTotals();
                }
            });
        }
        
        // Tax rate change
        const taxRateInput = document.getElementById('taxRate');
        if (taxRateInput) {
            taxRateInput.addEventListener('input', calculateTotals);
        }
        
        // Remove item
        if (invoiceItems) {
            invoiceItems.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
                    e.preventDefault();
                    const itemRow = e.target.closest('.item-row');
                    if (invoiceItems.children.length > 1) {
                        itemRow.remove();
                        calculateTotals();
                    } else {
                        showAlert('danger', 'You must have at least one item on the invoice.');
                    }
                }
            });
        }
        
        // View invoice (delegated event for dynamic content)
        if (invoiceList) {
            invoiceList.addEventListener('click', function(e) {
                if (e.target.classList.contains('view-invoice') || e.target.closest('.view-invoice')) {
                    e.preventDefault();
                    const row = e.target.closest('tr');
                    const invoiceId = row.dataset.id;
                    viewInvoice(invoiceId);
                }
                
                if (e.target.classList.contains('send-invoice') || e.target.closest('.send-invoice')) {
                    e.preventDefault();
                    const row = e.target.closest('tr');
                    const invoiceId = row.dataset.id;
                    const clientEmail = row.dataset.email;
                    sendInvoice(invoiceId, clientEmail);
                }
            });
        }
        
        // Pagination
        if (pagination) {
            pagination.addEventListener('click', function(e) {
                e.preventDefault();
                const pageItem = e.target.closest('.page-item');
                if (!pageItem || pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) return;
                
                const pageText = e.target.textContent.trim();
                if (pageText === 'Previous') {
                    currentPage--;
                } else if (pageText === 'Next') {
                    currentPage++;
                } else {
                    currentPage = parseInt(pageText);
                }
                
                loadInvoiceData();
            });
        }
    }
    
    function setDefaultDates() {
        // Current date for default values
        const today = new Date().toISOString().split('T')[0];
        const invoiceDate = document.getElementById('invoiceDate');
        if (invoiceDate) invoiceDate.value = today;
        
        // Set due date to 30 days from now by default
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateInput = document.getElementById('dueDate');
        if (dueDateInput) dueDateInput.value = dueDate.toISOString().split('T')[0];
    }
    
    function setupInvoiceNumberGeneration() {
        const invoiceNumberInput = document.getElementById('invoiceNumber');
        if (invoiceNumberInput) {
            invoiceNumberInput.addEventListener('focus', function() {
                if (!this.value) {
                    this.value = 'INV-' + Math.floor(1000 + Math.random() * 9000);
                }
            });
        }
    }
    
    // API Functions
    async function loadInvoiceData() {
        try {
            // Show loading spinner
            if (invoiceList) {
                invoiceList.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </td>
                    </tr>
                `;
            }

            const response = await fetch(`${API_BASE_URL}/invoices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.status === 401) {
                alert("Session expired. Please log in again.");
                localStorage.removeItem('authToken');
                window.location.href = 'login.html';
                return;
            }

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            invoices = await response.json();
            
            if (invoiceList) {
                renderInvoices();
                updatePagination();
            }
        } catch (error) {
            console.error("Error loading invoices:", error);
            showAlert('danger', 'Failed to load invoices. Please try again.');
        }
    }
    
    async function getInvoice(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch invoice');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching invoice:', error);
            showAlert('danger', 'Failed to load invoice details. Please try again.');
            return null;
        }
    }
    
    async function createInvoice(invoiceData) {
        try {
            const response = await fetch(`${API_BASE_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(invoiceData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create invoice');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating invoice:', error);
            showAlert('danger', 'Failed to create invoice. Please try again.');
            return null;
        }
    }
    
    async function sendInvoice(id, email) {
        if (!confirm(`Are you sure you want to send this invoice to ${email}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/invoices/${id}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to send invoice');
            }
            
            showAlert('success', 'Invoice sent successfully!');
            loadInvoiceData();
        } catch (error) {
            console.error('Error sending invoice:', error);
            showAlert('danger', 'Failed to send invoice. Please try again.');
        }
    }
    
    // UI Functions
    function renderInvoices() {
        const startIdx = (currentPage - 1) * invoicesPerPage;
        const endIdx = startIdx + invoicesPerPage;
        const displayedInvoices = invoices.slice(startIdx, endIdx);
        
        invoiceList.innerHTML = '';
        
        if (displayedInvoices.length === 0) {
            invoiceList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        No invoices found. Create your first invoice!
                    </td>
                </tr>
            `;
            return;
        }
        
        displayedInvoices.forEach(invoice => {
            const status = getInvoiceStatus(invoice.date, invoice.due_date);
            const statusClass = {
                'Paid': 'bg-success',
                'Pending': 'bg-warning',
                'Overdue': 'bg-danger'
            }[status];
            
            const row = document.createElement('tr');
            row.dataset.id = invoice.id;
            row.dataset.email = invoice.client_email;
            row.innerHTML = `
                <td>${invoice.invoice_number}</td>
                <td>${invoice.client_name}</td>
                <td>${formatDate(invoice.date)}</td>
                <td>${formatDate(invoice.due_date)}</td>
                <td>${formatCurrency(invoice.total_amount)}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-invoice">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-invoice">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success send-invoice">
                        <i class="bi bi-envelope"></i>
                    </button>
                </td>
            `;
            
            invoiceList.appendChild(row);
        });
        
        // Update showing info
        document.getElementById('showingFrom').textContent = startIdx + 1;
        document.getElementById('showingTo').textContent = Math.min(endIdx, invoices.length);
        document.getElementById('totalInvoices').textContent = invoices.length;
    }
    
    function updatePagination() {
        const totalPages = Math.ceil(invoices.length / invoicesPerPage);
        const paginationList = pagination.querySelector('ul');
        
        // Clear existing pagination
        paginationList.innerHTML = '';
        
        // Previous button
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = '<a class="page-link" href="#">Previous</a>';
        paginationList.appendChild(prevItem);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            paginationList.appendChild(pageItem);
        }
        
        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = '<a class="page-link" href="#">Next</a>';
        paginationList.appendChild(nextItem);
    }
    
    async function viewInvoice(id) {
        const invoice = await getInvoice(id);
        if (!invoice) return;
        
        const invoiceDetails = document.getElementById('invoiceDetails');
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
        
        invoiceDetails.innerHTML = `
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
        
        // Show the modal
        const modal = new bootstrap.Modal(viewInvoiceModal);
        modal.show();
    }
    
    function addInvoiceItem() {
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
    }
    
    function calculateTotals() {
        let subtotal = 0;
        
        // Calculate subtotal from items
        const itemRows = invoiceItems.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const price = parseFloat(row.querySelector('.price').value) || 0;
            subtotal += quantity * price;
        });
        
        // Calculate tax
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        
        // Update UI
        document.getElementById('subtotal').textContent = formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
        document.getElementById('totalAmount').textContent = formatCurrency(total);
    }
    
    async function saveInvoice() {
        // Validate form
        if (!invoiceForm.checkValidity()) {
            invoiceForm.classList.add('was-validated');
            return;
        }
        
        // Disable button during submission
        saveInvoiceBtn.disabled = true;
        saveInvoiceBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        
        // Collect form data
        const itemRows = invoiceItems.querySelectorAll('.item-row');
        const items = Array.from(itemRows).map(row => {
            return {
                description: row.querySelector('input[type="text"]').value,
                quantity: parseFloat(row.querySelector('.quantity').value),
                price: parseFloat(row.querySelector('.price').value)
            };
        });
        
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const taxAmount = subtotal * (taxRate / 100);
        
        const invoiceData = {
            invoice_number: document.getElementById('invoiceNumber').value,
            date: document.getElementById('invoiceDate').value,
            due_date: document.getElementById('dueDate').value,
            client_name: document.getElementById('clientName').value,
            client_email: document.getElementById('clientEmail').value,
            items: items,
            subtotal: subtotal,
            tax: taxAmount,
            total_amount: subtotal + taxAmount,
            notes: document.getElementById('notes').value
        };
        
        // Create invoice
        const newInvoice = await createInvoice(invoiceData);
        if (newInvoice) {
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(createInvoiceModal);
            modal.hide();
            invoiceForm.reset();
            invoiceForm.classList.remove('was-validated');
            invoiceItems.innerHTML = '';
            addInvoiceItem(); // Add one empty item
            
            // Reload invoices
            loadInvoiceData();
            
            showAlert('success', 'Invoice created successfully!');
        }
        
        // Re-enable button
        saveInvoiceBtn.disabled = false;
        saveInvoiceBtn.textContent = 'Save Invoice';
    }
    
    function printInvoice() {
        window.print();
    }
    
    async function logoutUser() {
        try {
            // Optional: Send a request to invalidate the token on the server
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
    
    // Helper Functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function formatCurrency(amount) {
        const number = Number(amount || 0);
        return '₵' + number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function getInvoiceStatus(date, dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        
        if (today > due) {
            return 'Overdue';
        } else {
            return 'Pending';
        }
    }
    
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
    
    // Initialize with one empty item
    if (invoiceItems && invoiceItems.children.length === 0) {
        addInvoiceItem();
    }
});