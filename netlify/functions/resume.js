// netlify/functions/resume.js
// Handles both uploading (POST) and downloading (GET) the resume PDF
// Uses Netlify Blobs for permanent storage — no database needed

import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const store = getStore('resume-store');

  // ── GET: serve the PDF to visitors ──
  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      const blob = await store.get('resume.pdf', { type: 'arrayBuffer' });
      if (!blob) {
        return new Response('No resume uploaded yet.', { status: 404 });
      }
      return new Response(req.method === 'HEAD' ? null : blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="Adwait_Raich_Resume.pdf"',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      return new Response('Error fetching resume: ' + err.message, { status: 500 });
    }
  }

  // ── POST: admin uploads the PDF ──
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (!body.pdf) {
        return Response.json({ error: 'No PDF data provided.' }, { status: 400 });
      }
      // Decode base64 → binary
      const binary = Uint8Array.from(atob(body.pdf), c => c.charCodeAt(0));
      await store.set('resume.pdf', binary, {
        metadata: { uploadedAt: new Date().toISOString() },
      });
      return Response.json({ success: true, message: 'Resume uploaded successfully.' });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = {
  path: '/.netlify/functions/resume',
};