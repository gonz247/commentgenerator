# Assessment Comment Generator

A lightweight, self-contained web application for generating assessment comments based on case definitions, event types, and product relatedness. **No installation required** - runs entirely in your browser!

## 🌟 Features

- **Template-Based Comment Generation**: Pre-configured templates for various event types and relatedness levels
- **Local Database Storage**: Uses IndexedDB to save all assessments locally in your browser
- **Search & Filter**: Quickly find past assessments by case ID, product name, or event type
- **Export/Import**: Backup your data to JSON or CSV files
- **No Installation**: Just double-click the HTML file and start working
- **100% Offline**: Works completely offline after opening
- **No .exe Files**: Perfect for restricted VM environments

## 📋 Supported Event Types

- Adverse Reaction
- Medication Error
- Product Quality Issue
- Lack of Efficacy
- Overdose
- Misuse
- Off-Label Use
- Other

## 🎯 Relatedness Levels

- Related
- Probably Related
- Possibly Related
- Unlikely Related
- Unrelated
- Not Assessable

## 🚀 How to Use

### Getting Started

1. **Copy the files** to your computer (via email, USB, shared folder, etc.)
2. **Double-click `index.html`** to open in your browser
3. **Start generating comments!**

### Generating a Comment

1. Fill in the form fields:
   - **Case ID**: Enter your case identifier (e.g., CASE-2024-001)
   - **Product Name**: Enter the product name
   - **Event Type**: Select from dropdown
   - **Relatedness**: Select the causality assessment
   - **Additional Notes**: (Optional) Add any extra context
2. Click **Generate Comment**
3. Review the generated comment
4. Click **Save to Database** to store it, or **Copy to Clipboard** to use elsewhere

### Viewing Saved Assessments

- All saved assessments appear in the table below the form
- Use the **search box** to filter by case ID, product, or event type
- Use the **relatedness filter** to show only specific relatedness levels
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
2. **Work**: Generate comments for 10 cases
3. **Review**: Search and filter past assessments
4. **End of Day**: Export to JSON as backup
5. **Next Day**: Open same file, all data is still there!

## 🔧 Customization

### Adding New Templates

Edit `app.js` and modify the `commentTemplates` object. Each event type has templates for different relatedness levels:

```javascript
const commentTemplates = {
    your_new_event_type: {
        related: "Your template text with {caseId} and {productName} placeholders",
        probably_related: "...",
        // ... etc
    }
};
```

### Changing Event Types

Edit the `<select>` options in `index.html`:

```html
<option value="your_event_type">Your Event Type</option>
```

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
    "productName": "Product X",
    "eventType": "adverse_reaction",
    "relatedness": "related",
    "additionalNotes": "Patient history relevant",
    "generatedComment": "Assessment of case...",
    "timestamp": 1700000000000
  }
]
```

## 🎨 Features Overview

| Feature | Description |
|---------|-------------|
| **Comment Generation** | Template-based, instant generation |
| **Database** | IndexedDB, stores locally |
| **Search** | Real-time search across all fields |
| **Filter** | Filter by relatedness level |
| **Export** | JSON (backup) or CSV (Excel) |
| **Import** | Restore from JSON backups |
| **View Details** | Modal popup with full assessment |
| **Copy to Clipboard** | One-click copy functionality |
| **Responsive** | Works on desktop and tablets |

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
2. **Naming Convention**: Use consistent case ID formats
3. **Search Shortcuts**: Use partial text for faster searching
4. **Browser Choice**: Edge is pre-installed on Windows VMs
5. **Multiple Versions**: Keep exported JSON files dated

## 📞 Support

If you encounter issues:
1. Check this README's troubleshooting section
2. Try opening in a different browser
3. Clear browser cache and restart
4. Check browser console (F12) for error messages

## 📄 License

This is an internal tool for assessment comment generation. Use in accordance with your organization's policies.

## 🔄 Version History

**Version 1.0** (November 2025)
- Initial release
- 8 event types with comprehensive templates
- 6 relatedness levels
- IndexedDB storage
- JSON/CSV export
- Search and filter functionality
- Responsive design

---

**Enjoy streamlined assessment comment generation! 🎉**
