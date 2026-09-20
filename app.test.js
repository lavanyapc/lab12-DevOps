const request = require('supertest');

const express = require('express');

const app = express();

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

describe('Node.js Application', () => {

    test('GET / should return application page', async () => {
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Environment');
    });

    test('GET /health should return UP status', async () => {
        const response = await request(app).get('/health');

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('UP');
    });

});