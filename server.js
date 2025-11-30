const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'clipboard-data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ text: '', timestamp: Date.now() }));
}

// Get clipboard text
app.get('/api/clipboard', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

// Save clipboard text
app.post('/api/clipboard', (req, res) => {
    const { text } = req.body;
    const data = { text, timestamp: Date.now() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
    res.json({ success: true, data });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Open this URL on any device on your network');
});
