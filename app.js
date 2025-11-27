// Assessment Comment Generator - Main Application Logic

// ========================
// Constants
// ========================

const COMPANY_NAME = 'Similares'; // Change this to your company name

// Pagination settings
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allFilteredAssessments = [];

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
// CSV Export/Import Functions
// ========================

function escapeCSV(value) {
    if (value == null) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
}

function downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function parseCSV(csvText) {
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentLine.push(currentField);
                currentField = '';
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                if (char === '\r') i++;
                currentLine.push(currentField);
                if (currentLine.some(field => field.trim() !== '')) {
                    lines.push(currentLine);
                }
                currentLine = [];
                currentField = '';
            } else if (char !== '\r') {
                currentField += char;
            }
        }
    }
    
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField);
        if (currentLine.some(field => field.trim() !== '')) {
            lines.push(currentLine);
        }
    }
    
    return lines;
}

// Export Assessments to CSV
async function exportAssessments() {
    try {
        const assessments = await getAllAssessments();
        if (assessments.length === 0) {
            showNotification('No assessments to export', 'error');
            return;
        }
        
        const headers = ['ID', 'Case ID', 'Case Type', 'Is License Partner', 'Follow-up Consent', 'Products', 'Events', 
                        'Relatedness', 'Justifications', 'Additional Notes', 'Free Text Comment', 
                        'Generated Comment', 'Timestamp', 'Sub Comments'];
        
        const rows = assessments.map(a => [
            escapeCSV(a.id),
            escapeCSV(a.caseId),
            escapeCSV(a.caseType),
            escapeCSV(a.isLicensePartner ? 'Yes' : 'No'),
            escapeCSV(a.followUpConsent ? 'Yes' : 'No'),
            escapeCSV(a.productNames),
            escapeCSV(a.events),
            escapeCSV(a.relatedness),
            escapeCSV((a.justifications || []).join('; ')),
            escapeCSV(a.additionalNotes),
            escapeCSV(a.freeTextComment),
            escapeCSV(a.generatedComment),
            escapeCSV(new Date(a.timestamp).toISOString()),
            escapeCSV(a.subComments ? JSON.stringify(a.subComments) : '')
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const filename = `assessments_${new Date().toISOString().split('T')[0]}.csv`;
        
        downloadCSV(filename, csvContent);
        showNotification('Assessments exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting assessments', 'error');
    }
}

// Export Products History to CSV
async function exportProducts() {
    try {
        const products = await getAllProducts();
        if (products.length === 0) {
            showNotification('No products to export', 'error');
            return;
        }
        
        const headers = ['Product Name'];
        const rows = products.map(p => [
            escapeCSV(typeof p === 'string' ? p : p.name)
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const filename = `products_history_${new Date().toISOString().split('T')[0]}.csv`;
        
        downloadCSV(filename, csvContent);
        showNotification('Products history exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting products', 'error');
    }
}

// Export Events History to CSV
async function exportEvents() {
    try {
        const events = await getAllEvents();
        if (events.length === 0) {
            showNotification('No events to export', 'error');
            return;
        }
        
        const headers = ['Event Name'];
        const rows = events.map(e => [
            escapeCSV(typeof e === 'string' ? e : e.name)
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const filename = `events_history_${new Date().toISOString().split('T')[0]}.csv`;
        
        downloadCSV(filename, csvContent);
        showNotification('Events history exported successfully!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting events', 'error');
    }
}

// Import Assessments from CSV
async function importAssessments(file) {
    try {
        const text = await file.text();
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
            showNotification('Invalid CSV file', 'error');
            return;
        }
        
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        let importCount = 0;
        for (const row of dataRows) {
            if (row.length < 12) continue; // Minimum required fields
            
            let subComments = [];
            try {
                if (row[13]) {
                    subComments = JSON.parse(row[13]);
                }
            } catch (e) {
                console.warn('Could not parse subComments for row:', e);
            }
            
            const assessment = {
                caseId: row[1],
                caseType: row[2],
                isLicensePartner: row[3].toLowerCase() === 'yes',
                followUpConsent: row[4] && row[4].toLowerCase() === 'yes',
                productNames: row[5],
                events: row[6],
                relatedness: row[7],
                justifications: row[8] ? row[8].split('; ').filter(j => j) : [],
                additionalNotes: row[9],
                freeTextComment: row[10],
                generatedComment: row[11],
                timestamp: row[12] ? new Date(row[12]).getTime() : Date.now(),
                subComments: subComments
            };
            
            await saveAssessment(assessment);
            importCount++;
        }
        
        await loadAndDisplayRecords();
        showNotification(`Successfully imported ${importCount} assessment(s)!`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Error importing assessments', 'error');
    }
}

// Import Products from CSV
async function importProducts(file) {
    try {
        const text = await file.text();
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
            showNotification('Invalid CSV file', 'error');
            return;
        }
        
        const dataRows = rows.slice(1);
        let importCount = 0;
        
        for (const row of dataRows) {
            if (row.length < 1 || !row[0]) continue;
            
            await saveProduct(row[0]);
            importCount++;
        }
        
        showNotification(`Successfully imported ${importCount} product(s)!`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Error importing products', 'error');
    }
}

// Import Events from CSV
async function importEvents(file) {
    try {
        const text = await file.text();
        const rows = parseCSV(text);
        
        if (rows.length < 2) {
            showNotification('Invalid CSV file', 'error');
            return;
        }
        
        const dataRows = rows.slice(1);
        let importCount = 0;
        
        for (const row of dataRows) {
            if (row.length < 1 || !row[0]) continue;
            
            await saveEvent(row[0]);
            importCount++;
        }
        
        showNotification(`Successfully imported ${importCount} event(s)!`, 'success');
    } catch (error) {
        console.error('Import error:', error);
        showNotification('Error importing events', 'error');
    }
}

// ========================
// Comment Template Engine
// ========================

const commentTemplates = {
    pms: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
        lpNotAssessable: "LP not assesable case, no comment provided.",
        notApplicable: "Not applicable events for assessment in relation to the product. no comment provided.",
    },
    clinicalTrial: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the study {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the study {productNames}.",
        lpNotAssessable: "LP not assesable case, no comment provided.",
        notApplicable: "Not applicable events for assessment in relation to the product. no comment provided.",
        unblindingPlacebo: "Blinding broken for study termination, placebo case, no comment provided.",
    },
    spontaneous: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
        lpNotAssessable: "LP not assesable case, no comment provided.",
        notApplicable: "Not applicable events for assessment in relation to the product. no comment provided.",
    },
    justifications: {
        positive: {
            reportIsConsistent: "The case has a probable causal relation based on",
            consistentEvidences: {
            timeToOnset:"plausible time to onset",
            biologicalPlausibility: "biological plausibility",
            noAltEtiology: "absence of alternative etiologies",
            populationBased: "known population-based causal relation",
            positiveRechallenge: "positive rechallenge",
            specificTest: "specific test proving causality",

        },
            eventIsListed: "The reported event is listed in the product's {RSI}",
            noAltExplanations: "no alternative explanations  were identified.",
    },
        negative: {
            medicalHistory: "The subject's medical history, has been reviewed and considered in the assessment of the reported event. {extraInfoJustifications}.",
            alternativeEtiologies: "Potential alternative etiologies {extraInfoJustifications}.",
            coMedications: "The role of concomitant medications {extraInfoJustifications} is considered as a possible cause.",
            eventResolved: "The event resolved without any changes to the product administration.",
            remoteTime: "The time between {extraInfoJustifications} product administration and event onset is not consistent with a causal relationship.",
            rechallenge: "negative rechallenge",
            insufficientInformation: "Not enough info. {followUpText}",
            listedness: "The reported event is not listed in the product's reference safety information, which has been taken into consideration during the assessment.",
            notAdministered: "The product was not administered to the subject."
        }
    }
};

function generateComment(caseType, isLicensePartner, productNames, events, relatedness, justifications, additionalNotes, freeTextComment, followUpConsent) {
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

    // Add justifications if selected (only for positive/negative relatedness)
    if (justifications && justifications.length > 0 && (relatedness === 'positive' || relatedness === 'negative')) {
        comment += " ";
        const justificationTemplates = commentTemplates.justifications[relatedness];
        if (justificationTemplates) {
            justifications.forEach((justKey, index) => {
                if (justificationTemplates[justKey]) {
                    let justificationText = justificationTemplates[justKey];
                    
                    // Handle insufficient information justification with follow-up consent
                    if (justKey === 'insufficientInformation') {
                        const followUpText = followUpConsent 
                            ? 'Follow-up has been sought.' 
                            : 'No follow-up possible.';
                        justificationText = justificationText.replace(/{followUpText}/g, followUpText);
                    }
                    
                    comment += justificationText;
                    if (index < justifications.length - 1) {
                        comment += " ";
                    }
                }
            });
        }
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
    const formatMap = {
        'positive': 'Positive',
        'negative': 'Negative',
        'multiple': 'Multiple Assessments',
        'lpNotAssessable': 'LP Not Assessable',
        'notApplicable': 'Not Applicable',
        'unblindingPlacebo': 'Unblinding Placebo'
    };
    
    return formatMap[relatedness] || relatedness
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

// Export/Import functions removed - will be reimplemented later

// ========================
// UI Functions
// ========================
// Sub-Comment Management
// ========================

let subComments = []; // Array to store multiple sub-comments
let subCommentCounter = 0; // Counter for unique IDs

// Create a new sub-comment section
function createSubCommentSection() {
    const subCommentId = ++subCommentCounter;
    
    const section = document.createElement('div');
    section.className = 'sub-comment-section';
    section.dataset.subCommentId = subCommentId;
    
    // Number will be set dynamically
    section.innerHTML = `
        <div class="sub-comment-header">
            <h4>Comment Section #<span class="section-number">1</span></h4>
            <button type="button" class="btn-icon remove-sub-comment" data-id="${subCommentId}" title="Remove this section">
                ✕
            </button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label for="relatedness-${subCommentId}">Relatedness *</label>
                <select id="relatedness-${subCommentId}" class="sub-relatedness" required>
                    <option value="">-- Select Relatedness --</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="lpNotAssessable">No assessment</option>
                    <option value="notApplicable">Not applicable</option>
                    <option value="unblindingPlacebo">Unblinding Placebo</option>
                </select>
            </div>
            <div class="form-group full-width">
                <label for="productNames-${subCommentId}">Product Name(s) *</label>
                <input type="text" id="productNames-${subCommentId}" class="sub-products" required placeholder="e.g., Product X, Product Y">
                <small style="color: #64748b;">Separate multiple products with commas</small>
            </div>

            <div class="form-group full-width">
                <label for="events-${subCommentId}">Event(s) *</label>
                <input type="text" id="events-${subCommentId}" class="sub-events" required placeholder="e.g., pyrexia, cough, rash">
                <small style="color: #64748b;">Separate multiple events with commas</small>
            </div>

            <div class="form-group full-width">
                <label for="freeTextComment-${subCommentId}">Free text comment</label>
                <textarea id="freeTextComment-${subCommentId}" class="sub-freetext" rows="3" placeholder="Provide free text comment..."></textarea>
            </div>

            <div class="form-group full-width justification-container" id="justificationContainer-${subCommentId}" style="display: none;">
                <label>Justification Templates (Optional)</label>
                <div class="checkbox-group" id="justificationCheckboxes-${subCommentId}">
                    <!-- Justification checkboxes will be dynamically populated -->
                </div>
            </div>

            <div class="form-group full-width">
                <label for="additionalNotes-${subCommentId}">Additional Free Text</label>
                <textarea id="additionalNotes-${subCommentId}" class="sub-notes" rows="3" placeholder="Add any specific details, observations, or additional justification..."></textarea>
            </div>
        </div>
        <div class="sub-comment-preview hidden">
            <h5>Preview:</h5>
            <div class="comment-display sub-preview-text"></div>
        </div>
    `;
    
    return section;
}

// Add a new sub-comment section to the container
function addSubCommentSection() {
    const container = document.getElementById('subCommentsContainer');
    const section = createSubCommentSection();
    container.appendChild(section);
    
    // Setup autocomplete for the new inputs
    setupSubCommentAutocomplete(section);
    
    // Add event listeners for real-time preview
    setupSubCommentPreview(section);
    
    // Add remove button listener
    const removeBtn = section.querySelector('.remove-sub-comment');
    removeBtn.addEventListener('click', () => removeSubCommentSection(section.dataset.subCommentId));
    
    // Renumber all sections
    renumberSubComments();
    
    return section;
}

// Remove a sub-comment section
function removeSubCommentSection(subCommentId) {
    const section = document.querySelector(`[data-sub-comment-id="${subCommentId}"]`);
    if (section) {
        section.remove();
        renumberSubComments();
    }
}

// Renumber all sub-comment sections sequentially
function renumberSubComments() {
    const allSections = document.querySelectorAll('.sub-comment-section');
    allSections.forEach((sec, index) => {
        const numberSpan = sec.querySelector('.section-number');
        if (numberSpan) {
            numberSpan.textContent = index + 1;
        }
    });
}

// Setup autocomplete for a sub-comment section
function setupSubCommentAutocomplete(section) {
    const subCommentId = section.dataset.subCommentId;
    const productsInput = section.querySelector(`#productNames-${subCommentId}`);
    const eventsInput = section.querySelector(`#events-${subCommentId}`);
    
    // Products autocomplete
    setupAutocomplete(productsInput, searchProducts, (selectedProduct) => {
        const input = productsInput;
        const value = input.value;
        const cursorPos = input.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);
        const lastComma = textBeforeCursor.lastIndexOf(',');
        
        if (lastComma >= 0) {
            const beforeComma = textBeforeCursor.substring(0, lastComma + 1);
            input.value = beforeComma + ' ' + selectedProduct + textAfterCursor;
            input.selectionStart = input.selectionEnd = (beforeComma + ' ' + selectedProduct).length;
        } else {
            input.value = selectedProduct + textAfterCursor;
            input.selectionStart = input.selectionEnd = selectedProduct.length;
        }
    });
    
    // Events autocomplete
    setupAutocomplete(eventsInput, searchEvents, (selectedEvent) => {
        const input = eventsInput;
        const value = input.value;
        const cursorPos = input.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const textAfterCursor = value.substring(cursorPos);
        const lastComma = textBeforeCursor.lastIndexOf(',');
        
        if (lastComma >= 0) {
            const beforeComma = textBeforeCursor.substring(0, lastComma + 1);
            input.value = beforeComma + ' ' + selectedEvent + textAfterCursor;
            input.selectionStart = input.selectionEnd = (beforeComma + ' ' + selectedEvent).length;
        } else {
            input.value = selectedEvent + textAfterCursor;
            input.selectionStart = input.selectionEnd = selectedEvent.length;
        }
    });
}

// Setup real-time preview for a sub-comment section
// Toggle justification section based on relatedness
function updateJustificationOptions(subCommentId, relatedness) {
    const container = document.getElementById(`justificationContainer-${subCommentId}`);
    const checkboxesDiv = document.getElementById(`justificationCheckboxes-${subCommentId}`);
    
    if (relatedness === 'positive' || relatedness === 'negative') {
        // Show justification container
        container.style.display = 'block';
        
        // Clear existing checkboxes
        checkboxesDiv.innerHTML = '';
        
        // Add appropriate justification options
        const justificationOptions = {
            positive: [
                { value: 'medicalHistory', label: 'Medical History & Concomitant Medications' },
                { value: 'temporalRelationship', label: 'Temporal Relationship' },
                { value: 'dechallenge', label: 'Dechallenge' },
                { value: 'rechallenge', label: 'Rechallenge' },
                { value: 'alternativeEtiologies', label: 'No Alternative Etiologies' },
                { value: 'insufficientInformation', label: 'Insufficient Information' },
                { value: 'listedness', label: 'Listedness' }
            ],
            negative: [
                { value: 'medicalHistory', label: 'Medical History & Concomitant Medications' },
                { value: 'temporalRelationship', label: 'Temporal Relationship' },
                { value: 'dechallenge', label: 'Dechallenge' },
                { value: 'rechallenge', label: 'Rechallenge' },
                { value: 'alternativeEtiologies', label: 'Alternative Etiologies' },
                { value: 'insufficientInformation', label: 'Insufficient Information' },
                { value: 'listedness', label: 'Listedness' }
            ]
        };
        
        const options = justificationOptions[relatedness];
        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'checkbox-label';
            label.innerHTML = `
                <input type="checkbox" class="sub-justification" data-sub-id="${subCommentId}" value="${option.value}">
                ${option.label}
            `;
            checkboxesDiv.appendChild(label);
        });
        
        // Re-attach event listeners for new checkboxes
        const section = document.querySelector(`[data-sub-comment-id="${subCommentId}"]`);
        const newCheckboxes = checkboxesDiv.querySelectorAll('.sub-justification');
        newCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => updateSubCommentPreview(subCommentId));
        });
    } else {
        // Hide justification container for other relatedness values
        container.style.display = 'none';
        checkboxesDiv.innerHTML = '';
    }
}

function setupSubCommentPreview(section) {
    const subCommentId = section.dataset.subCommentId;
    const inputs = section.querySelectorAll('input, select, textarea');
    
    // Add special handler for relatedness dropdown
    const relatednessSelect = section.querySelector(`#relatedness-${subCommentId}`);
    if (relatednessSelect) {
        relatednessSelect.addEventListener('change', (e) => {
            updateJustificationOptions(subCommentId, e.target.value);
            updateSubCommentPreview(subCommentId);
        });
    }
    
    inputs.forEach(input => {
        input.addEventListener('input', () => updateSubCommentPreview(subCommentId));
        input.addEventListener('change', () => updateSubCommentPreview(subCommentId));
    });
}

// Update preview for a specific sub-comment
function updateSubCommentPreview(subCommentId) {
    const section = document.querySelector(`[data-sub-comment-id="${subCommentId}"]`);
    if (!section) return;
    
    const caseType = document.getElementById('caseType').value;
    const isLicensePartner = document.getElementById('isLicensePartner').checked;
    const followUpConsent = document.getElementById('followUpConsent').checked;
    const productNames = section.querySelector(`#productNames-${subCommentId}`).value.trim();
    const events = section.querySelector(`#events-${subCommentId}`).value.trim();
    const relatedness = section.querySelector(`#relatedness-${subCommentId}`).value;
    const freeText = section.querySelector(`#freeTextComment-${subCommentId}`).value.trim();
    const additionalNotes = section.querySelector(`#additionalNotes-${subCommentId}`).value.trim();
    
    const justifications = Array.from(section.querySelectorAll(`.sub-justification[data-sub-id="${subCommentId}"]:checked`))
        .map(checkbox => checkbox.value);
    
    const previewSection = section.querySelector('.sub-comment-preview');
    const previewText = section.querySelector('.sub-preview-text');
    
    // Only show preview if required fields are filled
    if (caseType && productNames && events && relatedness) {
        const comment = generateComment(caseType, isLicensePartner, productNames, events, relatedness, justifications, additionalNotes, freeText, followUpConsent);
        previewText.textContent = comment;
        previewSection.classList.remove('hidden');
    } else {
        previewSection.classList.add('hidden');
    }
}

// Collect all sub-comment data
function collectSubCommentData() {
    const sections = document.querySelectorAll('.sub-comment-section');
    const subCommentData = [];
    
    sections.forEach(section => {
        const subCommentId = section.dataset.subCommentId;
        
        const data = {
            productNames: section.querySelector(`#productNames-${subCommentId}`).value.trim(),
            events: section.querySelector(`#events-${subCommentId}`).value.trim(),
            relatedness: section.querySelector(`#relatedness-${subCommentId}`).value,
            freeText: section.querySelector(`#freeTextComment-${subCommentId}`).value.trim(),
            additionalNotes: section.querySelector(`#additionalNotes-${subCommentId}`).value.trim(),
            justifications: Array.from(section.querySelectorAll(`.sub-justification[data-sub-id="${subCommentId}"]:checked`))
                .map(checkbox => checkbox.value)
        };
        
        // Only include if required fields are filled
        if (data.productNames && data.events && data.relatedness) {
            subCommentData.push(data);
        }
    });
    
    return subCommentData;
}

// Generate combined comment from all sub-comments
function generateCombinedComment() {
    const caseType = document.getElementById('caseType').value;
    const isLicensePartner = document.getElementById('isLicensePartner').checked;
    const followUpConsent = document.getElementById('followUpConsent').checked;
    const subCommentData = collectSubCommentData();
    
    if (!caseType || subCommentData.length === 0) {
        return '';
    }
    
    const comments = subCommentData.map(data => {
        return generateComment(
            caseType,
            isLicensePartner,
            data.productNames,
            data.events,
            data.relatedness,
            data.justifications,
            data.additionalNotes,
            data.freeText,
            followUpConsent
        );
    });
    
    // Join comments with paragraph breaks
    return comments.join('\n');
}

// Clear all sub-comment sections
function clearAllSubComments() {
    const container = document.getElementById('subCommentsContainer');
    container.innerHTML = '';
    subCommentCounter = 0;
}

// ========================
// Global State Variables
// ========================

let currentGeneratedComment = null;
let currentAssessmentData = null;

async function loadAndDisplayRecords(searchTerm = '', filterRelatedness = '', append = false) {
    try {
        // Only fetch and filter if not appending (new search/filter)
        if (!append) {
            currentPage = 1;
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
            
            // Store filtered results
            allFilteredAssessments = assessments;
        }

        const tbody = document.getElementById('recordsTableBody');
        const startIndex = 0;
        const endIndex = currentPage * ITEMS_PER_PAGE;
        const displayedAssessments = allFilteredAssessments.slice(startIndex, endIndex);
        
        if (allFilteredAssessments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-records">No assessments found</td></tr>';
            document.getElementById('paginationContainer').style.display = 'none';
        } else {
            const rows = displayedAssessments.map(a => `
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
            
            tbody.innerHTML = rows;
            
            // Show/hide Load More button
            const paginationContainer = document.getElementById('paginationContainer');
            if (displayedAssessments.length < allFilteredAssessments.length) {
                paginationContainer.style.display = 'block';
            } else {
                paginationContainer.style.display = 'none';
            }
        }

        // Update counts
        document.getElementById('displayedRecords').textContent = displayedAssessments.length;
        document.getElementById('totalRecords').textContent = allFilteredAssessments.length;
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

function loadMore() {
    currentPage++;
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const filterRelatedness = document.getElementById('relatednessFilter')?.value || '';
    loadAndDisplayRecords(searchTerm, filterRelatedness, true);
}

async function viewAssessment(id) {
    try {
        const assessment = await getAssessmentById(id);
        if (!assessment) return;

        document.getElementById('modalDate').textContent = formatDate(assessment.timestamp);
        document.getElementById('modalCaseId').textContent = assessment.caseId || 'N/A';
        document.getElementById('modalCaseType').textContent = formatCaseType(assessment.caseType, assessment.isLicensePartner);
        document.getElementById('modalCompanyName').textContent = assessment.isLicensePartner ? 'Yes' : 'No';
        document.getElementById('modalFollowUpConsent').textContent = assessment.followUpConsent ? 'Yes' : 'No';
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
    // Populate case information
    document.getElementById('caseId').value = assessment.caseId;
    document.getElementById('caseType').value = assessment.caseType;
    document.getElementById('isLicensePartner').checked = assessment.isLicensePartner;
    document.getElementById('followUpConsent').checked = assessment.followUpConsent || false;
    
    // Clear existing sub-comments
    clearAllSubComments();
    
    // Check if this assessment has sub-comments data
    if (assessment.subComments && assessment.subComments.length > 0) {
        // Recreate sub-comments from saved data
        assessment.subComments.forEach(subData => {
            const section = addSubCommentSection();
            const subCommentId = section.dataset.subCommentId;
            
            section.querySelector(`#productNames-${subCommentId}`).value = subData.productNames;
            section.querySelector(`#events-${subCommentId}`).value = subData.events;
            section.querySelector(`#relatedness-${subCommentId}`).value = subData.relatedness;
            section.querySelector(`#freeTextComment-${subCommentId}`).value = subData.freeText || '';
            section.querySelector(`#additionalNotes-${subCommentId}`).value = subData.additionalNotes || '';
            
            // Update justification options based on relatedness
            updateJustificationOptions(subCommentId, subData.relatedness);
            
            // Set justifications after options are created
            setTimeout(() => {
                subData.justifications?.forEach(justValue => {
                    const checkbox = section.querySelector(`.sub-justification[data-sub-id="${subCommentId}"][value="${justValue}"]`);
                    if (checkbox) checkbox.checked = true;
                });
                // Update preview
                updateSubCommentPreview(subCommentId);
            }, 0);
        });
    } else {
        // Legacy assessment without sub-comments - create one sub-comment with all data
        const section = addSubCommentSection();
        const subCommentId = section.dataset.subCommentId;
        
        section.querySelector(`#productNames-${subCommentId}`).value = assessment.productNames;
        section.querySelector(`#events-${subCommentId}`).value = assessment.events;
        section.querySelector(`#relatedness-${subCommentId}`).value = assessment.relatedness;
        section.querySelector(`#freeTextComment-${subCommentId}`).value = assessment.freeTextComment || '';
        section.querySelector(`#additionalNotes-${subCommentId}`).value = assessment.additionalNotes || '';
        
        // Update justification options based on relatedness
        updateJustificationOptions(subCommentId, assessment.relatedness);
        
        // Set justifications after options are created
        setTimeout(() => {
            assessment.justifications?.forEach(justValue => {
                const checkbox = section.querySelector(`.sub-justification[data-sub-id="${subCommentId}"][value="${justValue}"]`);
                if (checkbox) checkbox.checked = true;
            });
            // Update preview
            updateSubCommentPreview(subCommentId);
        }, 0);
    }

    showNotification('Form populated with previous assessment data', 'success');
}

// ========================
// Event Handlers
// ========================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadAndDisplayRecords();

        // Setup autocomplete for Case ID only
        const caseIdInput = document.getElementById('caseId');

        // Case ID autocomplete - retrieves and populates full assessment
        setupAutocomplete(caseIdInput, searchCaseIds, (selectedAssessment) => {
            populateFormWithAssessment(selectedAssessment);
        });

        // Add Sub-Comment button
        document.getElementById('addSubComment').addEventListener('click', () => {
            addSubCommentSection();
        });

        // Initialize with one sub-comment section
        addSubCommentSection();

        // Add event listener for followUpConsent changes to update previews
        document.getElementById('followUpConsent').addEventListener('change', () => {
            // Update all sub-comment previews
            const allSections = document.querySelectorAll('.sub-comment-section');
            allSections.forEach(section => {
                updateSubCommentPreview(section.dataset.subCommentId);
            });
        });

        // Comment form submission - Generate combined comment
        document.getElementById('commentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const caseId = document.getElementById('caseId').value.trim();
            const caseType = document.getElementById('caseType').value;
            const isLicensePartner = document.getElementById('isLicensePartner').checked;
            const followUpConsent = document.getElementById('followUpConsent').checked;
            
            if (!caseType) {
                showNotification('Please select a Case Type', 'error');
                return;
            }

            const subCommentData = collectSubCommentData();
            
            if (subCommentData.length === 0) {
                showNotification('Please fill in at least one comment section', 'error');
                return;
            }

            // Generate combined comment
            const comment = generateCombinedComment();
            
            // Collect all products and events from all sub-comments
            const allProducts = subCommentData.map(d => d.productNames).join(', ');
            const allEvents = subCommentData.map(d => d.events).join(', ');
            
            // Collect all justifications (unique)
            const allJustifications = [...new Set(subCommentData.flatMap(d => d.justifications))];
            
            // Combine all additional notes
            const allNotes = subCommentData
                .map(d => d.additionalNotes)
                .filter(n => n)
                .join(' | ');
            
            // Determine relatedness: if all sub-comments have the same relatedness, use that; otherwise mark as 'multiple'
            const uniqueRelatedness = [...new Set(subCommentData.map(d => d.relatedness))];
            const finalRelatedness = uniqueRelatedness.length === 1 ? uniqueRelatedness[0] : 'multiple';
            
            // Store for saving later
            currentGeneratedComment = comment;
            currentAssessmentData = {
                caseId,
                caseType,
                isLicensePartner,
                followUpConsent,
                productNames: allProducts,
                events: allEvents,
                relatedness: finalRelatedness,
                justifications: allJustifications,
                additionalNotes: allNotes,
                freeTextComment: '',
                generatedComment: comment,
                timestamp: Date.now(),
                subComments: subCommentData // Store sub-comment details
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
                clearAllSubComments();
                addSubCommentSection(); // Add one empty section
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
            clearAllSubComments();
            addSubCommentSection(); // Add one empty section
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

        // Load More button
        document.getElementById('loadMoreBtn').addEventListener('click', loadMore);

        // Export buttons
        document.getElementById('exportAssessments').addEventListener('click', (e) => {
            e.preventDefault();
            exportAssessments();
        });
        
        document.getElementById('exportProducts').addEventListener('click', (e) => {
            e.preventDefault();
            exportProducts();
        });
        
        document.getElementById('exportEvents').addEventListener('click', (e) => {
            e.preventDefault();
            exportEvents();
        });

        // Import buttons
        document.getElementById('importAssessments').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('fileInputAssessments').click();
        });
        
        document.getElementById('importProducts').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('fileInputProducts').click();
        });
        
        document.getElementById('importEvents').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('fileInputEvents').click();
        });

        // File input handlers
        document.getElementById('fileInputAssessments').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importAssessments(file);
                e.target.value = ''; // Reset input
            }
        });
        
        document.getElementById('fileInputProducts').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importProducts(file);
                e.target.value = '';
            }
        });
        
        document.getElementById('fileInputEvents').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importEvents(file);
                e.target.value = '';
            }
        });

        // Dropdown toggle functionality
        document.getElementById('exportBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('exportMenu');
            const importMenu = document.getElementById('importMenu');
            menu.classList.toggle('show');
            importMenu.classList.remove('show');
        });
        
        document.getElementById('importBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('importMenu');
            const exportMenu = document.getElementById('exportMenu');
            menu.classList.toggle('show');
            exportMenu.classList.remove('show');
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('exportMenu').classList.remove('show');
            document.getElementById('importMenu').classList.remove('show');
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
