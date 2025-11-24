// Assessment Comment Generator - Main Application Logic

// ========================
// IndexedDB Database Setup
// ========================

const DB_NAME = 'MR_Assessment_DB';
const DB_VERSION = 1;
const STORE_NAME = 'assessments';

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
            
            // Create object store if it doesn't exist
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

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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
        positive: "The company considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "The company has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    lpPms: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    clinicalTrial: {
        positive: "The company considers that there is a possibility that the {events} related to the study {productNames}.",
        negative: "The company has determined that it is unlikely that the {events} related to the study {productNames}.",
    },
    lpClinicalTrial: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the study {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the study {productNames}.",
    },
    sponta: {
        positive: "The company considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "The company has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    lpSponta: {
        positive: "{companyName} considers that there is a possibility that the {events} related to the {productNames}.",
        negative: "{companyName} has determined that it is unlikely that the {events} related to the {productNames}.",
    },
    other: {
        not_assessable: "Assessment of case {caseId} involving {productName}: The reported event cannot be adequately assessed due to insufficient information.",
        not_applicable: "Assessment of case {caseId} involving {productName}: The reported event is not applicable for assessment in relation to the product.",
    },
    justifications: {
        medicalHistory: "The subject's medical history, including pre-existing conditions and concomitant medications, has been reviewed and considered in the assessment of the reported event.",
        temporalRelationship: "The temporal relationship between product administration and event onset has been evaluated to determine potential causality.",
        dechallengeRechallenge: "Information regarding dechallenge and rechallenge has been analyzed to assess the likelihood of a causal relationship.",
        alternativeEtiologies: "Potential alternative etiologies for the reported event have been explored and documented.",
        insufficientInformation: "The available information is insufficient to draw definitive conclusions regarding the relationship between the product and the reported event.",
    }
};

function generateComment(caseType, companyName, productNames, events, relatedness, justifications, additionalNotes) {
    // Get the main template
    let template = commentTemplates[caseType]?.[relatedness];
    
    if (!template) {
        return "Error: Invalid case type or relatedness selection.";
    }

    // Format product names and events for natural language
    const formattedProducts = formatListForSentence(productNames);
    const formattedEvents = formatListForSentence(events);

    // Replace placeholders in main template
    let comment = template
        .replace(/{companyName}/g, companyName || 'the company')
        .replace(/{productNames}/g, formattedProducts)
        .replace(/{events}/g, formattedEvents);

    // Add justifications if selected
    if (justifications && justifications.length > 0) {
        comment += "\n\n";
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
        comment += `\n\n${additionalNotes.trim()}`;
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

function formatCaseType(caseType) {
    const caseTypeMap = {
        'pms': 'Post-Marketing Study',
        'lpPms': 'LP - Post-Marketing Study',
        'clinicalTrial': 'Clinical Trial',
        'lpClinicalTrial': 'LP - Clinical Trial',
        'sponta': 'Spontaneous',
        'lpSponta': 'LP - Spontaneous'
    };
    return caseTypeMap[caseType] || caseType;
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
        const headers = ['ID', 'Date', 'Case ID', 'Case Type', 'Company Name', 'Product Names', 'Events', 'Assessment', 'Justifications', 'Additional Notes', 'Generated Comment'];
        
        // CSV rows
        const rows = assessments.map(a => [
            a.id,
            formatDate(a.timestamp),
            a.caseId || '',
            formatCaseType(a.caseType),
            a.companyName || '',
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
                    <td>${formatCaseType(a.caseType)}</td>
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
        document.getElementById('modalCaseType').textContent = formatCaseType(assessment.caseType);
        document.getElementById('modalCompanyName').textContent = assessment.companyName || 'N/A';
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

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadAndDisplayRecords();

        // Show/hide company name field based on case type
        document.getElementById('caseType').addEventListener('change', (e) => {
            const companyNameGroup = document.getElementById('companyNameGroup');
            const companyNameInput = document.getElementById('companyName');
            const isLicensePartner = e.target.value.startsWith('lp');
            
            if (isLicensePartner) {
                companyNameGroup.style.display = 'block';
                companyNameInput.required = true;
            } else {
                companyNameGroup.style.display = 'none';
                companyNameInput.required = false;
                companyNameInput.value = '';
            }
        });

        // Comment form submission
        document.getElementById('commentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const caseId = document.getElementById('caseId').value.trim();
            const caseType = document.getElementById('caseType').value;
            const companyName = document.getElementById('companyName').value.trim();
            const productNames = document.getElementById('productNames').value.trim();
            const events = document.getElementById('events').value.trim();
            const relatedness = document.getElementById('relatedness').value;
            const additionalNotes = document.getElementById('additionalNotes').value.trim();
            
            // Get selected justifications
            const justifications = Array.from(document.querySelectorAll('input[name="justification"]:checked'))
                .map(checkbox => checkbox.value);

            // Generate comment
            const comment = generateComment(caseType, companyName, productNames, events, relatedness, justifications, additionalNotes);
            
            // Store for saving later
            currentGeneratedComment = comment;
            currentAssessmentData = {
                caseId,
                caseType,
                companyName,
                productNames,
                events,
                relatedness,
                justifications,
                additionalNotes,
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
