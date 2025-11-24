// Assessment Comment Generator - Main Application Logic

// ========================
// Constants
// ========================

const COMPANY_NAME = 'Similares'; // Change this to your company name

// ========================
// IndexedDB Database Setup
// ========================

const DB_NAME = 'MR_Assessment_DB';
const DB_VERSION = 2; // Incremented for new stores
const STORE_NAME = 'assessments';
const PRODUCTS_STORE = 'products';
const EVENTS_STORE = 'events';

let db = null;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create assessments object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                // Create indexes for searching
                objectStore.createIndex('caseId', 'caseId', { unique: false });
                objectStore.createIndex('caseType', 'caseType', { unique: false });
                objectStore.createIndex('productNames', 'productNames', { unique: false });
                objectStore.createIndex('events', 'events', { unique: false });
                objectStore.createIndex('relatedness', 'relatedness', { unique: false });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Create products object store
            if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
                db.createObjectStore(PRODUCTS_STORE, { 
                    keyPath: 'name' // Ensures uniqueness
                });
            }

            // Create events object store
            if (!db.objectStoreNames.contains(EVENTS_STORE)) {
                db.createObjectStore(EVENTS_STORE, { 
                    keyPath: 'name' // Ensures uniqueness
                });
            }
        };
    });
}

// ========================
// Database Operations
// ========================

function saveAssessment(assessment) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(assessment);

        request.onsuccess = () => {
            // Save products and events to their respective stores
            saveProductsFromAssessment(assessment.productNames);
            saveEventsFromAssessment(assessment.events);
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

// Save products from comma-separated string
function saveProductsFromAssessment(productNames) {
    if (!productNames) return;
    const products = productNames.split(',').map(p => p.trim()).filter(p => p);
    products.forEach(name => saveProduct(name));
}

// Save events from comma-separated string
function saveEventsFromAssessment(events) {
    if (!events) return;
    const eventList = events.split(',').map(e => e.trim()).filter(e => e);
    eventList.forEach(name => saveEvent(name));
}

// Save a single product (uniqueness handled by keyPath)
function saveProduct(name) {
    if (!name) return;
    const transaction = db.transaction([PRODUCTS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(PRODUCTS_STORE);
    objectStore.put({ name: name });
}

// Save a single event (uniqueness handled by keyPath)
function saveEvent(name) {
    if (!name) return;
    const transaction = db.transaction([EVENTS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(EVENTS_STORE);
    objectStore.put({ name: name });
}

// Get all products alphabetically
function getAllProducts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PRODUCTS_STORE], 'readonly');
        const objectStore = transaction.objectStore(PRODUCTS_STORE);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const products = request.result.map(p => p.name).sort();
            resolve(products);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get all events alphabetically
function getAllEvents() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([EVENTS_STORE], 'readonly');
        const objectStore = transaction.objectStore(EVENTS_STORE);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const events = request.result.map(e => e.name).sort();
            resolve(events);
        };
        request.onerror = () => reject(request.error);
    });
}

// Search products by partial name
function searchProducts(query) {
    return getAllProducts().then(products => {
        if (!query) return products;
        const lowerQuery = query.toLowerCase();
        return products.filter(p => p.toLowerCase().includes(lowerQuery));
    });
}

// Search events by partial name
function searchEvents(query) {
    return getAllEvents().then(events => {
        if (!query) return events;
        const lowerQuery = query.toLowerCase();
        return events.filter(e => e.toLowerCase().includes(lowerQuery));
    });
}

// Get unique case IDs with their most recent assessment
function getUniqueCaseIds() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const assessments = request.result;
            // Group by caseId and keep only the most recent for each
            const caseMap = new Map();
            assessments.forEach(assessment => {
                const existing = caseMap.get(assessment.caseId);
                if (!existing || assessment.timestamp > existing.timestamp) {
                    caseMap.set(assessment.caseId, assessment);
                }
            });
            // Sort case IDs alphabetically
            const sortedCases = Array.from(caseMap.values()).sort((a, b) => 
                a.caseId.localeCompare(b.caseId)
            );
            resolve(sortedCases);
        };
        request.onerror = () => reject(request.error);
    });
}

// Search case IDs by partial match
function searchCaseIds(query) {
    return getUniqueCaseIds().then(cases => {
        if (!query) return cases;
        const lowerQuery = query.toLowerCase();
        return cases.filter(c => c.caseId.toLowerCase().includes(lowerQuery));
    });
}

function getAllAssessments() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteAssessment(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getAssessmentById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ========================
// Comment Template Engine
// ========================

const commentTemplates = {
    pms: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    clinicalTrial: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the study {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the study {productNames}.",
    },
    spontaneous: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    other: {
        lp_not_assessable: "LP not assesable case, no comment provided.",
        not_applicable: "Not applicable events for assessment in relation to the product. no comment provided.",
        unblinding_placebo: "Blinding broken for study termination, placebo case, no comment provided.",
    },
    justifications: {
        medicalHistory: "The subject's medical history, including pre-existing conditions and concomitant medications, has been reviewed and considered in the assessment of the reported event.",
        temporalRelationship: "The temporal relationship between product administration and event onset has been evaluated to determine potential causality.",
        dechallengeRechallenge: "Information regarding dechallenge and rechallenge has been analyzed to assess the likelihood of a causal relationship.",
        alternativeEtiologies: "Potential alternative etiologies for the reported event have been explored and documented.",
        insufficientInformation: "The available information is insufficient to draw definitive conclusions regarding the relationship between the product and the reported event.",
    }
};

function generateComment(caseType, isLicensePartner, productNames, events, relatedness, justifications, additionalNotes, freeTextComment) {
    // Get the main template
    let template = commentTemplates[caseType]?.[relatedness];
    
    if (!template) {
        return "Error: Invalid case type or relatedness selection.";
    }

    // Add free text comment if provided
    if (freeTextComment && freeTextComment.trim()) {
        return freeTextComment.trim();
    }

    // Format product names and events for natural language
    const formattedProducts = formatListForSentence(productNames);
    const formattedEvents = formatListForSentence(events);

    // Determine company name based on LP status
    const companyName = isLicensePartner ? COMPANY_NAME : 'The company';

    // Replace placeholders in main template
    let comment = template
        .replace(/{companyName}/g, companyName)
        .replace(/{productNames}/g, formattedProducts)
        .replace(/{events}/g, formattedEvents);

    // Add justifications if selected
    if (justifications && justifications.length > 0) {
        comment += " ";
        justifications.forEach((justKey, index) => {
            if (commentTemplates.justifications[justKey]) {
                comment += commentTemplates.justifications[justKey];
                if (index < justifications.length - 1) {
                    comment += " ";
                }
            }
        });
    }

    // Add additional free text if provided
    if (additionalNotes && additionalNotes.trim()) {
        comment += ` ${additionalNotes.trim()}`;
    }

    return comment;
}

function formatListForSentence(itemsString) {
    const items = itemsString.split(',').map(item => item.trim()).filter(item => item);
    
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    
    // For 3 or more items: "item1, item2, and item3"
    const allButLast = items.slice(0, -1).join(', ');
    const last = items[items.length - 1];
    return `${allButLast}, and ${last}`;
}

// ========================
// Utility Functions
// ========================

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCaseType(caseType, isLicensePartner = false) {
    const caseTypeMap = {
        'pms': 'Post-Marketing Study',
        'clinicalTrial': 'Clinical Trial',
        'spontaneous': 'Spontaneous'
    };
    const baseType = caseTypeMap[caseType] || caseType;
    return isLicensePartner ? `LP - ${baseType}` : baseType;
}

function formatEvents(events) {
    return events;
}

function formatRelatedness(relatedness) {
    return relatedness
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================
// Export/Import Functions
// ========================

async function exportToJSON() {
    try {
        const assessments = await getAllAssessments();
        const dataStr = JSON.stringify(assessments, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `assessments_export_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed', 'error');
    }
}

async function exportToCSV() {
    try {
        const assessments = await getAllAssessments();
        
        if (assessments.length === 0) {
            showNotification('No data to export', 'info');
            return;
        }

        // CSV headers
        const headers = ['ID', 'Date', 'Case ID', 'Case Type', 'Is License Partner', 'Product Names', 'Events', 'Assessment', 'Justifications', 'Additional Notes', 'Generated Comment'];
        
        // CSV rows
        const rows = assessments.map(a => [
            a.id,
            formatDate(a.timestamp),
            a.caseId || '',
            formatCaseType(a.caseType, a.isLicensePartner),
            a.isLicensePartner ? 'Yes' : 'No',
            a.productNames,
            a.events,
            formatRelatedness(a.relatedness),
            (a.justifications || []).join(', '),
            a.additionalNotes || '',
            a.generatedComment.replace(/\n/g, ' ')
        ]);

        // Escape CSV values
        const escapeCsv = (value) => {
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCsv).join(','),
            ...rows.map(row => row.map(escapeCsv).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `assessments_export_${Date.now()}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('CSV exported successfully!', 'success');
    } catch (error) {
        console.error('CSV export error:', error);
        showNotification('CSV export failed', 'error');
    }
}

async function importFromJSON(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format');
        }

        let imported = 0;
        for (const item of data) {
            // Remove id if it exists (let IndexedDB auto-generate)
            const { id, ...itemWithoutId } = item;
            await saveAssessment(itemWithoutId);
            imported++;
        }

        await loadAndDisplayRecords();
        showNotification(`Imported ${imported} records successfully!`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Import failed - invalid file format', 'error');
    }
}

// ========================
// UI Functions
// ========================

let currentGeneratedComment = null;
let currentAssessmentData = null;

async function loadAndDisplayRecords(searchTerm = '', filterRelatedness = '') {
    try {
        let assessments = await getAllAssessments();
        
        // Apply filters
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            assessments = assessments.filter(a => 
                (a.caseId && a.caseId.toLowerCase().includes(term)) ||
                a.productNames.toLowerCase().includes(term) ||
                a.events.toLowerCase().includes(term) ||
                formatCaseType(a.caseType).toLowerCase().includes(term)
            );
        }

        if (filterRelatedness) {
            assessments = assessments.filter(a => a.relatedness === filterRelatedness);
        }

        // Sort by timestamp (newest first)
        assessments.sort((a, b) => b.timestamp - a.timestamp);

        const tbody = document.getElementById('recordsTableBody');
        
        if (assessments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-records">No assessments found</td></tr>';
        } else {
            tbody.innerHTML = assessments.map(a => `
                <tr>
                    <td>${formatDate(a.timestamp)}</td>
                    <td>${escapeHtml(a.caseId || 'N/A')}</td>
                    <td>${formatCaseType(a.caseType, a.isLicensePartner)}</td>
                    <td>${escapeHtml(a.productNames)}</td>
                    <td><span class="badge badge-${a.relatedness}">${formatRelatedness(a.relatedness)}</span></td>
                    <td>
                        <button class="btn-icon" onclick="viewAssessment(${a.id})" title="View">👁️</button>
                        <button class="btn-icon" onclick="deleteRecord(${a.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        // Update total count
        document.getElementById('totalRecords').textContent = assessments.length;
    } catch (error) {
        console.error('Error loading records:', error);
        showNotification('Error loading records', 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function viewAssessment(id) {
    try {
        const assessment = await getAssessmentById(id);
        if (!assessment) return;

        document.getElementById('modalDate').textContent = formatDate(assessment.timestamp);
        document.getElementById('modalCaseId').textContent = assessment.caseId || 'N/A';
        document.getElementById('modalCaseType').textContent = formatCaseType(assessment.caseType, assessment.isLicensePartner);
        document.getElementById('modalCompanyName').textContent = assessment.isLicensePartner ? 'Yes' : 'No';
        document.getElementById('modalProduct').textContent = assessment.productNames;
        document.getElementById('modalEvents').textContent = assessment.events;
        document.getElementById('modalRelatedness').textContent = formatRelatedness(assessment.relatedness);
        document.getElementById('modalJustifications').textContent = (assessment.justifications || []).join(', ') || 'None';
        document.getElementById('modalNotes').textContent = assessment.additionalNotes || 'None';
        document.getElementById('modalComment').textContent = assessment.generatedComment;

        // Store comment for copying
        document.getElementById('modalCopy').onclick = () => {
            copyToClipboard(assessment.generatedComment);
        };

        document.getElementById('viewModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing assessment:', error);
        showNotification('Error loading assessment', 'error');
    }
}

async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
        await deleteAssessment(id);
        await loadAndDisplayRecords();
        showNotification('Assessment deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting assessment:', error);
        showNotification('Error deleting assessment', 'error');
    }
}

// ========================
// Event Listeners
// ========================
// Autocomplete Functionality
// ========================

function setupAutocomplete(inputElement, searchFunction, onSelect) {
    let currentFocus = -1;
    let autocompleteList = null;

    // Create autocomplete dropdown
    function createDropdown(items, currentValue) {
        closeAllLists();
        if (!items.length) return;

        autocompleteList = document.createElement('div');
        autocompleteList.setAttribute('class', 'autocomplete-items');
        inputElement.parentNode.appendChild(autocompleteList);

        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            const displayText = typeof item === 'string' ? item : item.caseId;
            
            // Highlight matching text
            const lowerDisplay = displayText.toLowerCase();
            const lowerValue = currentValue.toLowerCase();
            const startIndex = lowerDisplay.indexOf(lowerValue);
            
            if (startIndex >= 0) {
                itemDiv.innerHTML = displayText.substring(0, startIndex) +
                    '<strong>' + displayText.substring(startIndex, startIndex + currentValue.length) + '</strong>' +
                    displayText.substring(startIndex + currentValue.length);
            } else {
                itemDiv.textContent = displayText;
            }

            itemDiv.addEventListener('click', () => {
                onSelect(item);
                closeAllLists();
            });

            autocompleteList.appendChild(itemDiv);
        });
    }

    // Close all autocomplete lists
    function closeAllLists() {
        const items = document.getElementsByClassName('autocomplete-items');
        Array.from(items).forEach(item => item.parentNode.removeChild(item));
        currentFocus = -1;
    }

    // Handle input changes
    inputElement.addEventListener('input', async (e) => {
        const value = e.target.value;
        currentFocus = -1;

        // Get the current word being typed (for comma-separated lists)
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastComma = textBeforeCursor.lastIndexOf(',');
        const currentWord = textBeforeCursor.substring(lastComma + 1).trim();

        if (currentWord.length < 1) {
            closeAllLists();
            return;
        }

        try {
            const results = await searchFunction(currentWord);
            createDropdown(results.slice(0, 10), currentWord); // Limit to 10 items
        } catch (error) {
            console.error('Autocomplete error:', error);
        }
    });

    // Handle keyboard navigation
    inputElement.addEventListener('keydown', (e) => {
        if (!autocompleteList) return;
        const items = autocompleteList.getElementsByTagName('div');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            closeAllLists();
        }
    });

    function addActive(items) {
        if (!items.length) return;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }

    function removeActive(items) {
        Array.from(items).forEach(item => item.classList.remove('autocomplete-active'));
    }

    // Close lists when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== inputElement) {
            closeAllLists();
        }
    });
}

// Populate form with assessment data
function populateFormWithAssessment(assessment) {
    document.getElementById('caseId').value = assessment.caseId;
    document.getElementById('caseType').value = assessment.caseType;
    document.getElementById('isLicensePartner').checked = assessment.isLicensePartner;
    document.getElementById('productNames').value = assessment.productNames;
    document.getElementById('events').value = assessment.events;
    document.getElementById('relatedness').value = assessment.relatedness;
    document.getElementById('additionalNotes').value = assessment.additionalNotes || '';
    
    // Set justification checkboxes
    document.querySelectorAll('input[name="justification"]').forEach(checkbox => {
        checkbox.checked = assessment.justifications?.includes(checkbox.value) || false;
    });

    showNotification('Form populated with previous assessment data', 'success');
}

// ========================
// Event Handlers
// ========================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadAndDisplayRecords();

        // Setup autocomplete for inputs
        const caseIdInput = document.getElementById('caseId');
        const productsInput = document.getElementById('productNames');
        const eventsInput = document.getElementById('events');

        // Case ID autocomplete - retrieves and populates full assessment
        setupAutocomplete(caseIdInput, searchCaseIds, (selectedAssessment) => {
            populateFormWithAssessment(selectedAssessment);
        });

        // Products autocomplete - handles comma-separated lists
        setupAutocomplete(productsInput, searchProducts, (selectedProduct) => {
            const input = productsInput;
            const value = input.value;
            const cursorPos = input.selectionStart;
            const textBeforeCursor = value.substring(0, cursorPos);
            const textAfterCursor = value.substring(cursorPos);
            const lastComma = textBeforeCursor.lastIndexOf(',');
            
            if (lastComma >= 0) {
                // Replace the current word after the last comma
                const beforeComma = textBeforeCursor.substring(0, lastComma + 1);
                input.value = beforeComma + ' ' + selectedProduct + textAfterCursor;
                input.selectionStart = input.selectionEnd = (beforeComma + ' ' + selectedProduct).length;
            } else {
                // Replace entire field
                input.value = selectedProduct + textAfterCursor;
                input.selectionStart = input.selectionEnd = selectedProduct.length;
            }
        });

        // Events autocomplete - handles comma-separated lists
        setupAutocomplete(eventsInput, searchEvents, (selectedEvent) => {
            const input = eventsInput;
            const value = input.value;
            const cursorPos = input.selectionStart;
            const textBeforeCursor = value.substring(0, cursorPos);
            const textAfterCursor = value.substring(cursorPos);
            const lastComma = textBeforeCursor.lastIndexOf(',');
            
            if (lastComma >= 0) {
                // Replace the current word after the last comma
                const beforeComma = textBeforeCursor.substring(0, lastComma + 1);
                input.value = beforeComma + ' ' + selectedEvent + textAfterCursor;
                input.selectionStart = input.selectionEnd = (beforeComma + ' ' + selectedEvent).length;
            } else {
                // Replace entire field
                input.value = selectedEvent + textAfterCursor;
                input.selectionStart = input.selectionEnd = selectedEvent.length;
            }
        });

        // Comment form submission
        document.getElementById('commentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const caseId = document.getElementById('caseId').value.trim();
            const caseType = document.getElementById('caseType').value;
            const isLicensePartner = document.getElementById('isLicensePartner').checked;
            const productNames = document.getElementById('productNames').value.trim();
            const events = document.getElementById('events').value.trim();
            const relatedness = document.getElementById('relatedness').value;
            const freeTextComment = document.getElementById('freeTextComment').value.trim();
            const additionalNotes = document.getElementById('additionalNotes').value.trim();
            
            // Get selected justifications
            const justifications = Array.from(document.querySelectorAll('input[name="justification"]:checked'))
                .map(checkbox => checkbox.value);

            // Generate comment
            const comment = generateComment(caseType, isLicensePartner, productNames, events, relatedness, justifications, additionalNotes, freeTextComment);
            
            // Store for saving later
            currentGeneratedComment = comment;
            currentAssessmentData = {
                caseId,
                caseType,
                isLicensePartner,
                productNames,
                events,
                relatedness,
                justifications,
                additionalNotes,
                freeTextComment,
                generatedComment: comment,
                timestamp: Date.now()
            };

            // Display generated comment
            document.getElementById('generatedCommentText').textContent = comment;
            document.getElementById('generatedCommentSection').classList.remove('hidden');
            
            // Scroll to generated comment
            document.getElementById('generatedCommentSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        });

        // Save comment button
        document.getElementById('saveComment').addEventListener('click', async () => {
            if (!currentAssessmentData) return;

            try {
                await saveAssessment(currentAssessmentData);
                await loadAndDisplayRecords();
                showNotification('Assessment saved successfully!', 'success');
                
                // Clear form and hide generated comment
                document.getElementById('commentForm').reset();
                document.getElementById('generatedCommentSection').classList.add('hidden');
                currentGeneratedComment = null;
                currentAssessmentData = null;
            } catch (error) {
                console.error('Error saving assessment:', error);
                showNotification('Error saving assessment', 'error');
            }
        });

        // Copy comment button
        document.getElementById('copyComment').addEventListener('click', () => {
            if (currentGeneratedComment) {
                copyToClipboard(currentGeneratedComment);
            }
        });

        // Clear form button
        document.getElementById('clearForm').addEventListener('click', () => {
            document.getElementById('commentForm').reset();
            document.getElementById('generatedCommentSection').classList.add('hidden');
            currentGeneratedComment = null;
            currentAssessmentData = null;
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const filterRelatedness = document.getElementById('filterRelatedness').value;
            loadAndDisplayRecords(searchTerm, filterRelatedness);
        });

        // Filter functionality
        document.getElementById('filterRelatedness').addEventListener('change', (e) => {
            const searchTerm = document.getElementById('searchInput').value;
            const filterRelatedness = e.target.value;
            loadAndDisplayRecords(searchTerm, filterRelatedness);
        });

        // Export buttons
        document.getElementById('exportData').addEventListener('click', exportToJSON);
        document.getElementById('exportCSV').addEventListener('click', exportToCSV);

        // Import button
        document.getElementById('importFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importFromJSON(file);
                e.target.value = ''; // Reset file input
            }
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('viewModal').classList.add('hidden');
            });
        });

        // Close modal on outside click
        document.getElementById('viewModal').addEventListener('click', (e) => {
            if (e.target.id === 'viewModal') {
                document.getElementById('viewModal').classList.add('hidden');
            }
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize application', 'error');
    }
});
