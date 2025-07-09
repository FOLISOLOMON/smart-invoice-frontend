document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const logoutButton = document.getElementById('logoutButton');
    const logoutText = document.querySelector('.logout-text');
    const logoutSpinner = document.querySelector('.logout-spinner');

    const invoiceList = document.getElementById('invoiceList');
    const paginationContainer = document.getElementById('pagination');
    const showingFromSpan = document.getElementById('showingFrom');
    const showingToSpan = document.getElementById('showingTo');
    const totalInvoicesSpan = document.getElementById('totalInvoices');

    // Create/Edit Invoice Modal Elements
    const createInvoiceModalElement = document.getElementById('createInvoiceModal');
    const createInvoiceModal = new bootstrap.Modal(createInvoiceModalElement);
    const createInvoiceModalLabel = document.getElementById('createInvoiceModalLabel');
    const invoiceForm = document.getElementById('invoiceForm');
    const invoiceNumberInput = document.getElementById('invoiceNumber');
    const invoiceDateInput = document.getElementById('invoiceDate');
    const dueDateInput = document.getElementById('dueDate');
    const clientNameInput = document.getElementById('clientName');
    const clientEmailInput = document.getElementById('clientEmail');
    const invoiceItemsContainer = document.getElementById('invoiceItems');
    const addItemButton = document.getElementById('addItem');
    const notesInput = document.getElementById('notes');
    const subtotalSpan = document.getElementById('subtotal');
    const taxRateInput = document.getElementById('taxRate');
    const taxAmountSpan = document.getElementById('taxAmount');
    const totalAmountSpan = document.getElementById('totalAmount');
    const saveInvoiceButton = document.getElementById('saveInvoice');
    const saveButtonText = document.getElementById('saveButtonText');
    const saveButtonSpinner = document.getElementById('saveButtonSpinner');
    
    // View Invoice Modal Elements
    const viewInvoiceModalElement = document.getElementById('viewInvoiceModal');
    const viewInvoiceModal = new bootstrap.Modal(viewInvoiceModalElement);
    const invoiceDetailsDiv = document.getElementById('invoiceDetails');
    const printInvoiceButton = document.getElementById('printInvoice');
    const token = localStorage.getItem('authToken');

    // Success Modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));

    // --- Global Variables ---
    const API_BASE_URL = 'https://smart-invoice-backend-ukob.onrender.com/api/invoices';
    const INVOICES_PER_PAGE = 10;
    let currentPage = 1;
    let totalInvoices = 0;
    let allInvoices = []; // Store all invoices fetched from backend
    let currentInvoiceId = null; // Used for editing existing invoices
    let lastInvoiceNumber = 0; // Used to track the last invoice number for sequential generation

    // --- Utility Functions ---

    /**
     * Formats a number as currency (GHS).
     * @param {number} amount
     * @returns {string}
     */
    const formatCurrency = (amount) => {
        return `GHS ${parseFloat(amount).toFixed(2)}`;
    };

    /**
     * Validates an email address.
     * @param {string} email
     * @returns {boolean}
     */
    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    /**
     * Shows a SweetAlert2 success message.
     * @param {string} title
     * @param {string} text
     */
    const showSuccessAlert = (title, text) => {
        Swal.fire({
            icon: 'success',
            title: title,
            text: text,
            showConfirmButton: false,
            timer: 2000
        });
    };

    /**
     * Shows a custom alert message (used instead of SweetAlert for some cases).
     * @param {string} message - The message to display.
     * @param {string} type - The Bootstrap alert type (e.g., 'danger', 'success').
     */
    function showAlert(message, type = 'danger') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.padding = '10px';
        alertDiv.style.borderRadius = '5px';
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    /**
     * Shows a SweetAlert2 error message.
     * @param {string} title
     * @param {string} text
     */
    const showErrorAlert = (title, text) => {
        Swal.fire({
            icon: 'error',
            title: title,
            text: text,
            confirmButtonText: 'OK'
        });
    };

    /**
     * Sets validation feedback for an input.
     * @param {HTMLElement} inputElement
     * @param {boolean} isValid
     */
    const setValidationState = (inputElement, isValid) => {
        if (isValid) {
            inputElement.classList.remove('is-invalid');
            inputElement.classList.add('is-valid');
        } else {
            inputElement.classList.remove('is-valid');
            inputElement.classList.add('is-invalid');
        }
    };

    /**
     * Resets validation state for all inputs in a form.
     * @param {HTMLFormElement} formElement
     */
    const resetFormValidation = (formElement) => {
        formElement.classList.remove('was-validated');
        Array.from(formElement.querySelectorAll('.form-control')).forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
    };

    // --- Invoice Number Generation ---

    /**
     * Generates a sequential invoice number based on the last invoice number.
     * Format: INV-YYYYMMDD-XXXX (where XXXX is a sequential number)
     * @returns {string}
     */
    const generateInvoiceNumber = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `INV-${timestamp}-${random}`;
        };

    document.addEventListener('DOMContentLoaded', () => {
        const invoice_number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log(invoice_number); // ✅ No error
        });



    /**
     * Extracts the numeric part from the last invoice number to maintain sequence.
     * @param {string[]} invoiceNumbers - Array of existing invoice numbers
     */
    const initializeInvoiceNumberSequence = (invoices) => {
    if (invoices.length === 0) {
        lastInvoiceNumber = 0;
        return;
    }
    
    // Extract all numbers from existing invoice numbers
    const numbers = invoices
        .filter(inv => inv.invoice_number && inv.invoice_number.trim() !== '')
        .map(inv => {
            const parts = inv.invoice_number.split('-');
            return parseInt(parts[parts.length - 1]) || 0;
        });
    
    // If we found numbers, use the highest one
    if (numbers.length > 0) {
        lastInvoiceNumber = Math.max(...numbers);
    } else {
        // If all invoice numbers are empty, start from 0
        lastInvoiceNumber = 0;
    }
};



    // --- Invoice Item Management ---

    /**
     * Adds a new item row to the invoice form.
     * @param {object} [item={}] - Optional item data to pre-fill the row.
     */
    const addInvoiceItemRow = (item = {}) => {
        const itemRow = document.createElement('div');
        itemRow.classList.add('item-row', 'row', 'mb-3', 'animate__animated', 'animate__fadeIn');
        itemRow.innerHTML = `
            <div class="col-md-6">
                <input type="text" class="form-control item-description" placeholder="Description" value="${item.description || ''}" required>
                <div class="invalid-feedback">Description is required.</div>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="${item.quantity || 1}" required>
                <div class="invalid-feedback">Quantity is required and must be at least 1.</div>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control unit-price" placeholder="Unit Price" min="0" step="0.01" value="${item.unitPrice || 0}" required>
                <div class="invalid-feedback">Unit price is required and must be non-negative.</div>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm remove-item">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        invoiceItemsContainer.appendChild(itemRow);

        // Add event listeners for new row
        const quantityInput = itemRow.querySelector('.quantity');
        const unitPriceInput = itemRow.querySelector('.unit-price');
        const removeItemButton = itemRow.querySelector('.remove-item');

        quantityInput.addEventListener('input', calculateInvoiceTotals);
        unitPriceInput.addEventListener('input', calculateInvoiceTotals);
        removeItemButton.addEventListener('click', () => {
            itemRow.classList.add('animate__animated', 'animate__fadeOut');
            setTimeout(() => {
                itemRow.remove();
                calculateInvoiceTotals();
            }, 300);
        });

        // Initial validation for new inputs
        quantityInput.addEventListener('input', () => setValidationState(quantityInput, quantityInput.value >= 1));
        unitPriceInput.addEventListener('input', () => setValidationState(unitPriceInput, unitPriceInput.value >= 0));
        itemRow.querySelector('.item-description').addEventListener('input', (e) => setValidationState(e.target, e.target.value.trim().length > 0));

        calculateInvoiceTotals(); // Recalculate totals after adding an item
    };

    /**
     * Calculates and updates subtotal, tax, and total amounts for the invoice form.
     */
    const calculateInvoiceTotals = () => {
        let subtotal = 0;
        const itemRows = invoiceItemsContainer.querySelectorAll('.item-row');

        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
            const unitPrice = parseFloat(row.querySelector('.unit-price').value) || 0;
            subtotal += (quantity * unitPrice);
        });

        const taxRate = parseFloat(taxRateInput.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const totalAmount = subtotal + taxAmount;

        subtotalSpan.textContent = formatCurrency(subtotal);
        taxAmountSpan.textContent = formatCurrency(taxAmount);
        totalAmountSpan.textContent = formatCurrency(totalAmount);
    };

    // --- API Calls ---

    /**
     * Fetches invoices from the backend API.
     * This function now fetches ALL invoices for the user and handles client-side pagination.
     */
    const fetchInvoices = async () => {
        invoiceList.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Loading invoices...
                </td>
            </tr>
        `;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found. User might not be logged in.');
                invoiceList.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-warning">Please log in to view invoices.</td></tr>`;
                return; // Stop execution if no token
            }

            // Backend's getAllInvoices does not support pagination, fetches all
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Raw API response status (getAllInvoices):', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API response error text (getAllInvoices):', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API response data (getAllInvoices):', data); // This should be an array of invoices

            // The backend's getAllInvoices returns an array directly
            allInvoices = Array.isArray(data) ? data : [];
            totalInvoices = allInvoices.length; // Total invoices is now the length of the fetched array

            initializeInvoiceNumberSequence(allInvoices);

            // Initialize invoice number sequence
            const invoiceNumbers = allInvoices.map(inv => inv.invoice_number);
            initializeInvoiceNumberSequence(invoiceNumbers);

            console.log('Processed allInvoices:', allInvoices);
            console.log('Processed totalInvoices:', totalInvoices);
            console.log('Last invoice number:', lastInvoiceNumber);

            renderInvoices(); // Render current page of invoices
            renderPagination(); // Update pagination controls

        } catch (error) {
            console.error('Error fetching invoices:', error);
            invoiceList.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-danger">
                        Failed to load invoices. Please try again.
                    </td>
                </tr>
            `;
            showErrorAlert('Error', 'Failed to load invoices. Please check your connection or ensure you are logged in.');
            lastInvoiceNumber = 0;
        }
    };

    /**
     * Creates or updates an invoice via the backend API.
     * @param {object} invoiceData - The invoice data to send.
     * @param {string|null} invoiceId - The ID of the invoice to update, or null for creation.
     */
    const saveInvoice = async (invoiceData, invoiceId = null) => {
        saveInvoiceButton.disabled = true;
        saveButtonText.textContent = invoiceId ? 'Updating...' : 'Saving...';
        saveButtonSpinner.classList.remove('d-none');

        const method = invoiceId ? 'PUT' : 'POST';
        const url = invoiceId ? `${API_BASE_URL}/${invoiceId}` : API_BASE_URL;

        const token = localStorage.getItem('authToken');
        if (!token) {
            showErrorAlert('Error', 'No token found. Please log in again.');
            saveInvoiceButton.disabled = false;
            saveButtonText.textContent = invoiceId ? 'Update Invoice' : 'Save Invoice';
            saveButtonSpinner.classList.add('d-none');
            return;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(invoiceData),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message || 'Failed to save invoice.');
            }

            const result = await response.json();
            console.log('Invoice saved successfully:', result);
            createInvoiceModal.hide();
            showSuccessAlert('Success!', invoiceId ? 'Invoice updated successfully.' : 'Invoice created successfully.');
            fetchInvoices(); // Re-fetch all invoices to update the dashboard

        } catch (error) {
            console.error('Error saving invoice:', error);
            showErrorAlert('Error', error.message || 'Failed to save invoice. Please try again.');
        } finally {
            saveInvoiceButton.disabled = false;
            saveButtonText.textContent = invoiceId ? 'Update Invoice' : 'Save Invoice';
            saveButtonSpinner.classList.add('d-none');
        }
    };

    /**
     * Fetches a single invoice by ID.
     * @param {string} id - The ID of the invoice to fetch.
     * @returns {Promise<object|null>} The invoice object or null if not found/error.
     */
    const getInvoiceById = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showErrorAlert('Error', 'No token found. Please log in again.');
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Raw API response status (getInvoice):', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API response error text (getInvoice):', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('API response data (getInvoice):', data); // Should be { invoice, items }

            // Backend returns { invoice, items }, so we need to extract and combine
            if (data && data.invoice) {
                // Combine invoice details with items
                return { ...data.invoice, items: data.items || [] };
            }
            return null; // Invoice not found or malformed response
        } catch (error) {
            console.error('Error fetching invoice by ID:', error);
            showErrorAlert('Error', 'Failed to load invoice details.');
            return null;
        }
    };

    /**
     * Deletes an invoice by ID.
     * @param {string} id - The ID of the invoice to delete.
     */
    const deleteInvoice = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        showErrorAlert('Error', 'No token found. Please log in again.');
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorBody = await response.json();
                        throw new Error(errorBody.message || 'Failed to delete invoice.');
                    }

                    showSuccessAlert('Deleted!', 'The invoice has been deleted.');
                    fetchInvoices(); // Re-fetch all invoices to update the dashboard
                } catch (error) {
                    console.error('Error deleting invoice:', error);
                    showErrorAlert('Error', error.message || 'Failed to delete invoice. Please try again.');
                }
            }
        });
    };

    /**
     * Sends an invoice to the client's email.
     * @param {string} id - The ID of the invoice to send.
     */
    const sendInvoiceEmail = async (id) => {
        Swal.fire({
            title: 'Send Invoice?',
            text: "Do you want to send this invoice to the client's email?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, send it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        showErrorAlert('Error', 'No token found. Please log in again.');
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/${id}/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({}) // Send an empty body or any required data
                    });

                    if (!response.ok) {
                        const errorBody = await response.json();
                        throw new Error(errorBody.message || 'Failed to send invoice email.');
                    }

                    showSuccessAlert('Sent!', 'Invoice has been sent to the client.');
                } catch (error) {
                    console.error('Error sending invoice email:', error);
                    showErrorAlert('Error', error.message || 'Failed to send invoice email. Please try again.');
                }
            }
        });
    };

    // --- Rendering Functions ---

    /**
     * Renders the invoices in the table for the current page.
     */
    const renderInvoices = () => {
        if (!Array.isArray(allInvoices)) {
            console.error('renderInvoices: allInvoices is not an array', allInvoices);
            invoiceList.innerHTML = `
                <tr><td colspan="7" class="text-center py-4 text-danger">
                    Failed to load invoices.
                </td></tr>`;
            return;
        }

        invoiceList.innerHTML = ''; // Clear existing invoices

        // Calculate invoices for the current page
        const startIndex = (currentPage - 1) * INVOICES_PER_PAGE;
        const endIndex = startIndex + INVOICES_PER_PAGE;
        const invoicesToDisplay = allInvoices.slice(startIndex, endIndex);

        if (invoicesToDisplay.length === 0) {
            invoiceList.innerHTML = `
                <tr><td colspan="7" class="text-center py-4">
                    No invoices found for this page. Create one or adjust filters!
                </td></tr>`;
            return;
        }

        invoicesToDisplay.forEach(invoice => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoice_number}</td>
                <td>${invoice.client_name}</td>
                <td>${new Date(invoice.date).toLocaleDateString()}</td>
                <td>${new Date(invoice.due_date).toLocaleDateString()}</td>
                <td>${formatCurrency(invoice.total_amount)}</td>
                <td><span class="badge ${getBadgeClass(invoice.status || 'Pending')}">${invoice.status || 'Pending'}</span></td>
                <td>
                    <button class="btn btn-info btn-sm view-invoice-btn me-1" data-id="${invoice.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-warning btn-sm edit-invoice-btn me-1" data-id="${invoice.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-success btn-sm send-invoice-btn me-1" data-id="${invoice.id}">
                        <i class="bi bi-envelope"></i> Send
                    </button>
                    <button class="btn btn-danger btn-sm delete-invoice-btn" data-id="${invoice.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            invoiceList.appendChild(row);
        });

        // Attach event listeners to action buttons
        invoiceList.querySelectorAll('.view-invoice-btn').forEach(button => {
            button.addEventListener('click', (e) => viewInvoice(e.currentTarget.dataset.id));
        });
        invoiceList.querySelectorAll('.edit-invoice-btn').forEach(button => {
            button.addEventListener('click', (e) => editInvoice(e.currentTarget.dataset.id));
        });
        invoiceList.querySelectorAll('.send-invoice-btn').forEach(button => {
            button.addEventListener('click', (e) => sendInvoiceEmail(e.currentTarget.dataset.id));
        });
        invoiceList.querySelectorAll('.delete-invoice-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteInvoice(e.currentTarget.dataset.id));
        });
    };

    /**
     * Determines the Bootstrap badge class based on invoice status.
     * @param {string} status
     * @returns {string}
     */
    const getBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'bg-success';
            case 'pending': return 'bg-warning text-dark';
            case 'overdue': return 'bg-danger';
            case 'draft': return 'bg-secondary';
            default: return 'bg-info';
        }
    };

    /**
     * Renders the pagination controls.
     */
    const renderPagination = () => {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalInvoices / INVOICES_PER_PAGE);

        if (totalInvoices === 0) {
            showingFromSpan.textContent = '0';
            showingToSpan.textContent = '0';
            totalInvoicesSpan.textContent = '0';
            return;
        }

        // Update showing X to Y of Z
        const from = (currentPage - 1) * INVOICES_PER_PAGE + 1;
        const to = Math.min(currentPage * INVOICES_PER_PAGE, totalInvoices);
        showingFromSpan.textContent = from;
        showingToSpan.textContent = to;
        totalInvoicesSpan.textContent = totalInvoices;

        // Previous button
        const prevLi = document.createElement('li');
        prevLi.classList.add('page-item');
        if (currentPage === 1) prevLi.classList.add('disabled');
        prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
        prevLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--; // Decrement current page
                renderInvoices(); // Re-render invoices for new page
                renderPagination(); // Re-render pagination controls
            }
        });
        paginationContainer.appendChild(prevLi);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.classList.add('page-item');
            if (i === currentPage) pageLi.classList.add('active');
            pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            pageLi.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i; // Set current page
                renderInvoices(); // Re-render invoices for new page
                renderPagination(); // Re-render pagination controls
            });
            paginationContainer.appendChild(pageLi);
        }

        // Next button
        const nextLi = document.createElement('li');
        nextLi.classList.add('page-item');
        if (currentPage === totalPages) nextLi.classList.add('disabled');
        nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
        nextLi.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++; // Increment current page
                renderInvoices(); // Re-render invoices for new page
                renderPagination(); // Re-render pagination controls
            }
        });
        paginationContainer.appendChild(nextLi);
    };

    /**
     * Populates and shows the view invoice modal.
     * @param {string} invoiceId
     */
    const viewInvoice = async (invoiceId) => {
        invoiceDetailsDiv.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div> Loading invoice details...</div>`;
        viewInvoiceModal.show();

        const invoiceData = await getInvoiceById(invoiceId); // This returns { invoice, items }
        if (invoiceData) {
            const invoice = invoiceData; // Now invoiceData is the combined object
            invoiceDetailsDiv.innerHTML = `
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Invoice #:</strong> ${invoice.invoice_number}
                    </div>
                    <div class="col-sm-6">
                        <strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Client Name:</strong> ${invoice.client_name}
                    </div>
                    <div class="col-sm-6">
                        <strong>Client Email:</strong> ${invoice.client_email}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-sm-6">
                        <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}
                    </div>
                    <div class="col-sm-6">
                        <strong>Status:</strong> <span class="badge ${getBadgeClass(invoice.status || 'Pending')}">${invoice.status || 'Pending'}</span>
                    </div>
                </div>
                <h5 class="mt-4 mb-3">Items</h5>
                <table class="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.unit_price)}</td>
                                <td>${formatCurrency(item.quantity * item.unit_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="text-end">
                    <p class="mb-1"><strong>Subtotal:</strong> ${formatCurrency(invoice.subtotal)}</p>
                    <p class="mb-1"><strong>Tax (${invoice.tax}%):</strong> ${formatCurrency(invoice.tax_amount)}</p>
                    <h4 class="fw-bold">Total: ${formatCurrency(invoice.total_amount)}</h4>
                </div>
                ${invoice.notes ? `<h5 class="mt-4 mb-3">Notes</h5><p>${invoice.notes}</p>` : ''}
            `;
            // Set print button functionality
            printInvoiceButton.onclick = () => printInvoice(invoice.id); // Use invoice.id
        } else {
            invoiceDetailsDiv.innerHTML = `<div class="text-center py-4 text-danger">Failed to load invoice details.</div>`;
        }
    };

    /**
     * Populates the create/edit invoice modal for editing.
     * @param {string} invoiceId
     */
    const editInvoice = async (invoiceId) => {
        currentInvoiceId = invoiceId;
        createInvoiceModalLabel.textContent = 'Edit Invoice';
        saveButtonText.textContent = 'Update Invoice';
        invoiceForm.reset(); // Clear form
        resetFormValidation(invoiceForm); // Clear validation states
        invoiceItemsContainer.innerHTML = ''; // Clear existing items

        const invoiceData = await getInvoiceById(invoiceId); // This returns { invoice, items }
        if (invoiceData) {
            const invoice = invoiceData; // Now invoiceData is the combined object

            invoiceNumberInput.value = invoice.invoice_number;
            invoiceDateInput.value = invoice.date.split('T')[0]; // Format date for input
            dueDateInput.value = invoice.due_date.split('T')[0]; // Format date for input
            clientNameInput.value = invoice.client_name;
            clientEmailInput.value = invoice.client_email;
            notesInput.value = invoice.notes || '';
            taxRateInput.value = invoice.tax || 0; // Use 'tax' from backend

            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => addInvoiceItemRow({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unit_price // Use 'unit_price' from backend
                }));
            } else {
                addInvoiceItemRow(); // Add at least one empty row if no items
            }
            calculateInvoiceTotals(); // Ensure totals are correct after populating

            // Make invoice number read-only when editing
            invoiceNumberInput.readOnly = true;

            createInvoiceModal.show();
        } else {
            // If invoice not found, reset to create mode
            currentInvoiceId = null;
            createInvoiceModalLabel.textContent = 'Create New Invoice';
            saveButtonText.textContent = 'Save Invoice';
            invoiceForm.reset();
            resetFormValidation(invoiceForm);
            invoiceItemsContainer.innerHTML = '';
            addInvoiceItemRow(); // Start with one empty item row
            calculateInvoiceTotals();
            // Ensure invoice number is not read-only for new creation if it was for edit
            invoiceNumberInput.readOnly = false;
        }
    };

    /**
     * Handles printing the invoice.
     * @param {string} invoiceId
     */
    const printInvoice = async (invoiceId) => {
        // For a full print-friendly view, you'd typically open a new window
        // with a dedicated print template or generate a PDF on the backend.
        // For simplicity, this will print the content of the modal body.
        const printContent = invoiceDetailsDiv.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Invoice</title>');
        printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">');
        printWindow.document.write('<style>body { font-family: "Inter", sans-serif; padding: 20px; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // --- Event Listeners ---

    // Sidebar toggle for mobile
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close sidebar on mobile
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('show');
    });

    // Logout button handler
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Are you sure you want to log out?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, log me out!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                logoutText.classList.add('d-none');
                logoutSpinner.classList.remove('d-none');
                logoutButton.disabled = true;

                try {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

                    // Clear any local storage tokens/session data
                    localStorage.removeItem('authToken'); // Example
                    showSuccessAlert('Logged Out!', 'You have been successfully logged out.');
                    setTimeout(() => {
                        window.location.href = 'login.html'; // Redirect to login page
                    }, 1000); // Give time for alert to show

                } catch (error) {
                    console.error('Logout error:', error);
                    showErrorAlert('Logout Failed', 'Could not log out. Please try again.');
                } finally {
                    logoutText.classList.remove('d-none');
                    logoutSpinner.classList.add('d-none');
                    logoutButton.disabled = false;
                }
            }
        });
    });

    // Add Item button in Create/Edit Invoice Modal
    addItemButton.addEventListener('click', () => addInvoiceItemRow());

    // Tax rate input change listener
    taxRateInput.addEventListener('input', calculateInvoiceTotals);

    // Save Invoice button handler
    saveInvoiceButton.addEventListener('click', async () => {
        // Client-side validation for the form
        const formInputs = invoiceForm.querySelectorAll('[required]');
        let allValid = true;
        formInputs.forEach(input => {
            if (!input.checkValidity()) {
                setValidationState(input, false);
                allValid = false;
            } else {
                setValidationState(input, true);
            }
        });

        // Specific validation for email
        if (!isValidEmail(clientEmailInput.value.trim())) {
            setValidationState(clientEmailInput, false);
            allValid = false;
        } else {
            setValidationState(clientEmailInput, true);
        }

        // Validate item rows
        const itemRows = invoiceItemsContainer.querySelectorAll('.item-row');
        if (itemRows.length === 0) {
            showErrorAlert('Validation Error', 'Please add at least one item to the invoice.');
            allValid = false;
        } else {
            itemRows.forEach(row => {
                const descriptionInput = row.querySelector('.item-description');
                const quantityInput = row.querySelector('.quantity');
                const unitPriceInput = row.querySelector('.unit-price');

                if (!descriptionInput.value.trim()) {
                    setValidationState(descriptionInput, false);
                    allValid = false;
                } else {
                    setValidationState(descriptionInput, true);
                }

                if (parseFloat(quantityInput.value) < 1 || !quantityInput.value.trim()) {
                    setValidationState(quantityInput, false);
                    allValid = false;
                } else {
                    setValidationState(quantityInput, true);
                }

                if (parseFloat(unitPriceInput.value) < 0 || !unitPriceInput.value.trim()) {
                    setValidationState(unitPriceInput, false);
                    allValid = false;
                } else {
                    setValidationState(unitPriceInput, true);
                }
            });
        }

        if (!allValid) {
            invoiceForm.classList.add('was-validated'); // Show Bootstrap validation feedback
            showErrorAlert('Validation Error', 'Please fill in all required fields correctly.');
            return;
        }

        // Gather invoice data and map to backend's snake_case and calculate item total
        const items = Array.from(invoiceItemsContainer.querySelectorAll('.item-row')).map(row => {
            const quantity = parseFloat(row.querySelector('.quantity').value);
            const unitPrice = parseFloat(row.querySelector('.unit-price').value);
            return {
                description: row.querySelector('.item-description').value.trim(),
                quantity: quantity,
                unit_price: unitPrice, // Map to unit_price
                total: quantity * unitPrice // Calculate item total
            };
        });

        const invoiceData = {
            invoice_number: invoiceNumberInput.value.trim(), // Use the generated/existing number
            client_name: clientNameInput.value.trim(), // Map to client_name
            client_email: clientEmailInput.value.trim(), // Map to client_email
            date: invoiceDateInput.value, // Map to date
            due_date: dueDateInput.value, // Map to due_date
            subtotal: parseFloat(subtotalSpan.textContent.replace('GHS ', '')),
            tax: parseFloat(taxRateInput.value) || 0, // Map to tax
            total_amount: parseFloat(totalAmountSpan.textContent.replace('GHS ', '')), // Map to total_amount
            notes: notesInput.value.trim(),
            items: items,
            // status: 'Pending' // Backend might set default status, or you can send it if needed
        };

        await saveInvoice(invoiceData, currentInvoiceId);
    });

    // Handle modal shown event for creating new invoices
    createInvoiceModalElement.addEventListener('shown.bs.modal', () => {
    if (!currentInvoiceId) {
        // Generate number immediately
        const newInvoiceNumber = generateInvoiceNumber();
        invoiceNumberInput.value = newInvoiceNumber;
        invoiceNumberInput.readOnly = true;
        
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        invoiceDateInput.value = today;
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        dueDateInput.value = dueDate.toISOString().split('T')[0];
        
        // Reset other fields
        createInvoiceModalLabel.textContent = 'Create New Invoice';
        saveButtonText.textContent = 'Save Invoice';
        invoiceForm.reset();
        resetFormValidation(invoiceForm);
        invoiceItemsContainer.innerHTML = '';
        addInvoiceItemRow();
        calculateInvoiceTotals();
    }

});

    // Reset form and currentInvoiceId when create invoice modal is hidden
    createInvoiceModalElement.addEventListener('hidden.bs.modal', () => {
        invoiceForm.reset();
        resetFormValidation(invoiceForm);
        invoiceItemsContainer.innerHTML = ''; // Clear items
        addInvoiceItemRow(); // Add one empty item row for next creation
        calculateInvoiceTotals(); // Reset totals display
        currentInvoiceId = null; // Reset for new invoice creation
        invoiceNumberInput.readOnly = false; // Ensure it's editable for next new invoice
    });

    // --- Initial Load ---
    fetchInvoices(); // Load invoices on page load
});