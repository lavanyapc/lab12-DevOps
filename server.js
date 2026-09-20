const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_COLOR = process.env.APP_COLOR || 'blue';
const APP_VERSION = process.env.APP_VERSION || '1';

app.get('/', (req, res) => {
    res.send(`
        <h1>${APP_COLOR.toUpperCase()} Environment</h1>
        <p>Node.js Application - Version ${APP_VERSION}</p>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        color: APP_COLOR,
        version: APP_VERSION
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});