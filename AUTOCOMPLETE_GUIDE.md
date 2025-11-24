# Autocomplete Feature Guide

## Overview
The Assessment Comment Generator now includes intelligent autocomplete functionality for three key fields:
- **Case ID**: Retrieves and auto-populates the entire previous assessment
- **Product Names**: Suggests previously used product names
- **Events**: Suggests previously used event names

## How It Works

### 1. Case ID Autocomplete
**Purpose**: Quickly work on follow-up assessments for the same case by retrieving all previous data.

**Usage**:
1. Start typing a Case ID in the "Case ID" field
2. A dropdown will appear showing matching Case IDs from your saved assessments
3. Click on a Case ID or use arrow keys and Enter to select
4. The **entire form** will be populated with the most recent assessment data for that Case ID:
   - Case Type
   - License Partner status
   - Product Names
   - Events
   - Assessment (Relatedness)
   - Justifications
   - Additional Notes

**Workflow**:
```
Type "CASE-001" → Select from dropdown → Form auto-fills → Modify as needed → Save as new record
```

### 2. Product Names Autocomplete
**Purpose**: Quickly add products you've used before without retyping.

**Usage**:
1. Start typing in the "Product Names" field
2. Dropdown shows matching product names (alphabetically sorted)
3. Select a product to insert it
4. For multiple products: Type comma, then start typing the next product
5. Autocomplete works for each product in the comma-separated list

**Example**:
```
Type "Asp" → Select "Aspirin" → Type ", Par" → Select "Paracetamol"
Result: "Aspirin, Paracetamol"
```

### 3. Events Autocomplete
**Purpose**: Quickly add events you've documented before.

**Usage**:
1. Works exactly like Product Names autocomplete
2. Start typing an event name
3. Select from dropdown
4. Use commas to separate multiple events

**Example**:
```
Type "Head" → Select "Headache" → Type ", Nau" → Select "Nausea"
Result: "Headache, Nausea"
```

## Keyboard Navigation

### Arrow Keys
- **↓ (Down Arrow)**: Move to next suggestion
- **↑ (Up Arrow)**: Move to previous suggestion

### Other Keys
- **Enter**: Select the highlighted suggestion
- **Escape**: Close the dropdown without selecting
- **Tab**: Move to next field (closes dropdown)

## Data Storage

### Products and Events Stores
- Automatically saved when you save an assessment
- Only unique values are stored (no duplicates)
- Sorted alphabetically for easy browsing

### Case ID Store
- Uses the existing assessments database
- Always retrieves the **most recent** assessment for each Case ID
- Allows easy follow-up assessments with minimal data entry

## Technical Details

### Database Structure
The application now uses **IndexedDB version 2** with three object stores:

1. **assessments**: Main storage for all assessment records
2. **products**: Unique product names (keyPath: 'name')
3. **events**: Unique event names (keyPath: 'name')

### Automatic Data Extraction
When you save an assessment:
- Product names are split by commas and saved individually
- Event names are split by commas and saved individually
- Duplicates are automatically prevented by the database structure

## Tips & Best Practices

### For Case IDs
- Use consistent naming conventions (e.g., "CASE-001", "CASE-002")
- The autocomplete helps you find previous work on the same case
- Perfect for creating follow-up assessments with minor changes

### For Products and Events
- Type at least 1 character to see suggestions
- Suggestions are filtered as you type (partial matching)
- Use consistent naming for better autocomplete results
- Comma-separated lists are fully supported

### Maximum Results
- Autocomplete shows up to **10 suggestions** at a time
- Results are the most relevant matches based on what you've typed

## Browser Compatibility
- Works in all modern browsers (Chrome, Edge, Firefox, Safari)
- Uses native IndexedDB (no external dependencies)
- Fully offline - no internet connection required

## Troubleshooting

### Autocomplete not showing?
- Type at least 1 character
- Make sure you have saved at least one assessment first
- Check browser console for errors (F12)

### Wrong data populated?
- The system always retrieves the **most recent** assessment for that Case ID
- If you need older data, manually enter it

### Dropdown appears in wrong position?
- The dropdown is positioned relative to the input field
- Scroll the page if needed to see all suggestions

## Privacy & Security
- All data is stored **locally** in your browser
- No data is sent to any server
- Database persists between browser sessions
- Use browser's "Clear browsing data" to reset completely
