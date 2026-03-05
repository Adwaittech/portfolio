// netlify/functions/resume.js
const { getStore } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const store = getStore('resume-store');

  // ── GET/HEAD: serve PDF to visitors ──
  if (event.httpMethod === 'GET' || event.httpMethod === 'HEAD') {
    try {
      const blob = await store.get('resume.pdf', { type: 'arrayBuffer' });
      if (!blob) {
        return { statusCode: 404, body: 'No resume uploaded yet.' };
      }
      const buffer = Buffer.from(blob);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Adwait_Raich_Resume.pdf"',
          'Cache-Control': 'no-cache',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (err) {
      return { statusCode: 500, body: 'Error: ' + err.message };
    }
  }

  // ── POST: admin uploads PDF ──
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      if (!body.pdf) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No PDF provided.' }) };
      }
      const binary = Buffer.from(body.pdf, 'base64');
      await store.set('resume.pdf', binary, {
        metadata: { uploadedAt: new Date().toISOString() },
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};