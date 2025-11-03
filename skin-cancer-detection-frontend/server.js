const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the Angular app build directory
app.use(express.static(path.join(__dirname, 'dist/skin-cancer-detection-frontend')));

// Handle Angular routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/skin-cancer-detection-frontend/index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
