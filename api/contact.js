const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbYF4Cf_SVqf2PsD7EtsjuccxpfV_dtoaMX2Pq1V0vozXZS6wNF0g8FSxsnbjQGHpsga/exec';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { success: false, message: 'Method not allowed' });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return json(res, 500, { success: false, message: 'Server misconfigured' });
  }

  let body;
  try {
    // Vercel may already parse JSON into req.body
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      body = req.body;
    } else if (typeof req.body === 'string') {
      body = req.body ? JSON.parse(req.body) : {};
    } else {
      body = await readBody(req);
    }
  } catch {
    return json(res, 400, { success: false, message: 'Invalid JSON' });
  }

  // Honeypot: quiet success if filled
  if (body._honey) {
    return json(res, 200, { success: true });
  }

  const token =
    body['cf-turnstile-response'] ||
    body.turnstileToken ||
    '';

  if (!token) {
    return json(res, 400, { success: false, message: 'Turnstile token missing' });
  }

  try {
    const verifyParams = new URLSearchParams();
    verifyParams.set('secret', secret);
    verifyParams.set('response', token);
    const forwarded = req.headers['x-forwarded-for'];
    const remoteip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded || '').split(',')[0].trim() || req.headers['x-real-ip'] || '';
    if (remoteip) verifyParams.set('remoteip', remoteip);

    const verifyRes = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return json(res, 400, {
        success: false,
        message: 'Turnstile verification failed',
      });
    }
  } catch {
    return json(res, 502, {
      success: false,
      message: 'Turnstile verification unavailable',
    });
  }

  const payload = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    interest: String(body.interest || '').trim(),
    interest_label: String(body.interest_label || '').trim(),
    message: String(body.message || '').trim(),
    intent: String(body.intent || '').trim(),
    page: String(body.page || '').trim(),
    user_agent: String(body.user_agent || '').trim(),
    _subject: String(body._subject || '').trim(),
    _honey: String(body._honey || ''),
  };

  try {
    const forwardRes = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    let ok = forwardRes.ok;
    try {
      const data = await forwardRes.json();
      if (data && (data.success === true || data.ok === true)) {
        ok = true;
      } else if (data && (data.success === false || data.ok === false)) {
        ok = false;
      }
    } catch {
      // Non-JSON / redirect opacity — rely on HTTP status
    }

    if (!ok) {
      return json(res, 502, {
        success: false,
        message: 'Failed to deliver message',
      });
    }

    return json(res, 200, { success: true });
  } catch {
    return json(res, 502, {
      success: false,
      message: 'Failed to deliver message',
    });
  }
}
