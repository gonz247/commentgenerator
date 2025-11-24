# Assessment Comment Generator

A lightweight, self-contained web application for generating assessment comments based on case definitions, events, and product relatedness. **No installation required** - runs entirely in your browser!

## 🌟 Features

- **Template-Based Comment Generation**: Pre-configured templates for case types with customizable justifications
- **Multi-Product & Multi-Event Support**: Handle multiple products and events in a single assessment
- **Local Database Storage**: Uses IndexedDB to save all assessments locally in your browser
- **Search & Filter**: Quickly find past assessments by case ID, product name, or events
- **Export/Import**: Backup your data to JSON or CSV files
- **No Installation**: Just double-click the HTML file and start working
- **100% Offline**: Works completely offline after opening
- **No .exe Files**: Perfect for restricted VM environments
- **Compact Grid Layout**: Efficient form design minimizes scrolling

## 📋 Case Types

- **Post-Marketing Study (PMS)**
- **Clinical Trial**
- **Spontaneous**

Each case type can be marked as a **License Partner** case using the checkbox.

## 🎯 Assessment Results

- **Positive**: Possibility that events are related to products
- **Negative**: Unlikely that events are related to products

## 📝 Justification Templates (Optional)

Select one or more pre-written justifications to append to your comment:
- Medical History & Concomitant Medications
- Temporal Relationship
- Dechallenge/Rechallenge
- Alternative Etiologies
- Insufficient Information

## 🚀 How to Use

### Getting Started

1. **Copy the files** to your computer (via email, USB, shared folder, etc.)
2. **Double-click `index.html`** to open in your browser
3. **Start generating comments!**

### Generating a Comment

1. Fill in the form fields:
   - **Case ID**: (Optional) Enter your case identifier (e.g., CASE-2024-001)
   - **Case Type**: Select PMS, Clinical Trial, or Spontaneous
   - **Assessment Result**: Choose Positive or Negative
   - **License Partner**: Check if this is a license partner case
   - **Product Name(s)**: Enter one or more products (comma-separated)
   - **Event(s)**: Enter one or more events (comma-separated)
   - **Justification Templates**: (Optional) Select relevant justifications
   - **Additional Free Text**: (Optional) Add specific observations or details
2. Click **Generate Comment**
3. Review the generated comment
4. Click **Save to Database** to store it, or **Copy to Clipboard** to use elsewhere

### Viewing Saved Assessments

- All saved assessments appear in the table below the form
- Use the **search box** to filter by case ID, product, or events
- Use the **assessment filter** to show only Positive or Negative assessments
- Click the 👁️ icon to view full details
- Click the 🗑️ icon to delete an assessment

### Exporting Your Data

#### Export to JSON (Recommended for Backup)
1. Click **Export to JSON**
2. Save the file to your preferred location
3. This file can be imported later to restore all data

#### Export to CSV (For Excel/Spreadsheets)
1. Click **Export to CSV**
2. Open in Excel, Google Sheets, or any spreadsheet application

### Importing Data

1. Click **Import Data**
2. Select a previously exported JSON file
3. All records will be added to your database

## 🏢 Company Name Configuration

The company name is configured as a constant in the code. To change it:

1. Open `app.js` in a text editor
2. Find line 7: `const COMPANY_NAME = 'TBD Company Name';`
3. Replace with your company name: `const COMPANY_NAME = 'Your Company Inc.';`
4. Save the file

This name is used when the "License Partner" checkbox is checked.

## 💾 Data Storage

- Data is stored in **IndexedDB** (browser's local database)
- Each browser has its own separate storage
- Typical capacity: 50MB - 1GB
- Data persists between sessions
- **Important**: Export regularly as backups!

### Data Persistence Notes

✅ **Data stays when you:**
- Close and reopen the browser
- Close and reopen the HTML file
- Restart your computer

⚠️ **Data may be lost if:**
- You clear browser cache/data
- IT department clears browser storage
- You use a different browser
- You move to a different computer

**Solution**: Regularly export your data to JSON files for backup!

## 🏗️ Project Structure

```
commentgenerator/
├── index.html          # Main interface
├── app.js             # Application logic & database
├── styles.css         # Styling
└── README.md          # This file
```

## 🔒 Security & Privacy

- **100% Local**: All data stays on your computer
- **No Internet Required**: Works completely offline
- **No Server**: No data is sent anywhere
- **No Installation**: No admin rights needed
- **No .exe Files**: No company policy concerns

## 🖥️ Browser Compatibility

Works in all modern browsers:
- ✅ Microsoft Edge (recommended for Windows)
- ✅ Google Chrome
- ✅ Mozilla Firefox
- ✅ Safari (Mac)

## 📝 Example Workflow

1. **Morning**: Open `index.html` in your browser
2. **Select Case Type**: Choose PMS, Clinical Trial, or Spontaneous
3. **Enter Details**: Add products (e.g., "Drug A, Drug B") and events (e.g., "fever, headache")
4. **Choose Assessment**: Select Positive or Negative
5. **Add Justifications**: (Optional) Select relevant justification templates
6. **Generate & Save**: Click Generate, review, and save to database
7. **Review**: Search and filter past assessments
8. **End of Day**: Export to JSON as backup
9. **Next Day**: Open same file, all data is still there!

## 🔧 Customization

### Changing Company Name

Edit `app.js` line 7 to set your company name:

```javascript
const COMPANY_NAME = 'Your Company Name'; // Used for License Partner cases
```

### Adding/Modifying Templates

Edit `app.js` and modify the `commentTemplates` object:

```javascript
const commentTemplates = {
    pms: {
        positive: "Template for positive PMS cases...",
        negative: "Template for negative PMS cases..."
    },
    // Add more case types as needed
};
```

### Adding Justification Templates

Edit the `justifications` section in `commentTemplates`:

```javascript
justifications: {
    yourNewJustification: "Your justification text here...",
}
```

Then add the corresponding checkbox in `index.html`.

## 🆘 Troubleshooting

### Comments not saving?
- Make sure you clicked "Save to Database" after generating
- Check browser console (F12) for errors
- Try a different browser

### Data disappeared?
- Did you clear browser cache? Import your JSON backup
- Using a different browser? Data is browser-specific
- Check if you're opening the same HTML file

### Can't export data?
- Check browser's download settings
- Make sure pop-ups aren't blocked
- Try a different browser

### Import not working?
- Make sure you're importing a JSON file exported from this app
- Check the file isn't corrupted
- Try exporting a test record and importing it

## 📊 Data Format

### JSON Export Structure
```json
[
  {
    "caseId": "CASE-2024-001",
    "caseType": "pms",
    "isLicensePartner": false,
    "productNames": "Product X, Product Y",
    "events": "pyrexia, headache",
    "relatedness": "positive",
    "justifications": ["medicalHistory", "temporalRelationship"],
    "additionalNotes": "Patient had concurrent condition",
    "generatedComment": "The company considers that...",
    "timestamp": 1700000000000
  }
]
```

## 🎨 Features Overview

| Feature | Description |
|---------|-------------|
| **Comment Generation** | Template-based with justification options |
| **Multi-Product/Event** | Comma-separated lists with natural formatting |
| **Database** | IndexedDB, stores locally |
| **Search** | Real-time search across all fields |
| **Filter** | Filter by assessment result (Positive/Negative) |
| **Export** | JSON (backup) or CSV (Excel) |
| **Import** | Restore from JSON backups |
| **View Details** | Modal popup with full assessment |
| **Copy to Clipboard** | One-click copy functionality |
| **Responsive** | Works on desktop and tablets |
| **Compact Layout** | Grid design minimizes scrolling |

## ⚡ Performance

- **Instant startup**: No loading time
- **Fast generation**: Comments appear immediately
- **Efficient storage**: Handles thousands of records
- **Quick search**: Real-time filtering

## 🌐 Use Cases

- **Pharmacovigilance**: Medical safety case assessments
- **Clinical Research**: Adverse event documentation
- **Quality Assurance**: Product quality issue tracking
- **Medical Writing**: Standardized medical narratives
- **Regulatory Affairs**: Compliance documentation

## 💡 Tips

1. **Regular Backups**: Export to JSON weekly
2. **Multiple Products/Events**: Use commas to separate items (e.g., "Drug A, Drug B, Drug C")
3. **Justifications**: Select relevant templates to build comprehensive assessments
4. **License Partner Cases**: Check the LP box to use the configured company name
5. **Search Shortcuts**: Use partial text for faster searching
6. **Browser Choice**: Edge is pre-installed on Windows VMs
7. **Keep Exports Dated**: Name your JSON backups with dates for easy tracking

## 📞 Support

If you encounter issues:
1. Check this README's troubleshooting section
2. Try opening in a different browser
3. Clear browser cache and restart
4. Check browser console (F12) for error messages

## 📄 License

This is an internal tool for assessment comment generation. Use in accordance with your organization's policies.

## 🔄 Version History

**Version 2.0** (November 2025)
- Simplified case type structure (3 types: PMS, Clinical Trial, Spontaneous)
- License Partner checkbox instead of separate case types
- Multi-product and multi-event support
- Configurable company name constant
- Justification template system
- Grid layout for compact form design
- Positive/Negative assessment classification
- Enhanced search and filtering

**Version 1.0** (November 2025)
- Initial release
- Basic template system
- IndexedDB storage
- JSON/CSV export
- Search and filter functionality

---

**Enjoy streamlined assessment comment generation! 🎉**
