import { NextRequest } from 'next/server';

const BLOCKED_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
]);

function ieErrorPage(title: string, heading: string, body: string, url: string): Response {
  const html = `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:Tahoma,'Segoe UI',Arial,sans-serif;font-size:11px;color:#000;background:#fff">

<div style="background:#ECE9D8;border-bottom:1px solid #ACA899;padding:8px 16px">
  <span style="font-size:13px;font-weight:bold;color:#333">${heading}</span>
</div>

<div style="padding:20px 24px 10px 24px">
  <table cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:16px;vertical-align:top">
      <div style="width:48px;height:48px;background:#FFF1A8;border:2px solid #D4A017;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;color:#D4A017;text-align:center;line-height:48px">!</div>
    </td>
    <td style="vertical-align:top">
      ${body}
    </td>
  </tr></table>
</div>

<div style="padding:10px 24px 20px 88px">
  <hr style="border:none;border-top:1px solid #ccc;margin:12px 0">
  <p style="color:#666;font-size:10px;margin:4px 0">
    <b>Technical Information</b><br>
    URL: ${url}
  </p>
</div>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function ieNotFoundPage(url: string): Response {
  return ieErrorPage(
    'HTTP 404 Not Found',
    'The page cannot be found',
    `<p style="margin:0 0 8px 0">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>
       <li>Open the <a href="/" style="color:#0066CC">home page</a>, and then look for links to the information you want.</li>
       <li>Click the <b>Back</b> button to try another link.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">HTTP 404 - File not found<br>Internet Explorer</p>`,
    url,
  );
}

function ieServerErrorPage(status: number, url: string): Response {
  return ieErrorPage(
    `HTTP ${status} Error`,
    'The page cannot be displayed',
    `<p style="margin:0 0 8px 0">The Web site encountered an unexpected error and was unable to complete your request.</p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>Click the <b>Refresh</b> button, or try again later.</li>
       <li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>
       <li>Contact the Web site administrator to let them know this page has a problem.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">HTTP ${status} - Internal Server Error<br>Internet Explorer</p>`,
    url,
  );
}

function ieForbiddenPage(url: string): Response {
  return ieErrorPage(
    'HTTP 403 Forbidden',
    'You are not authorized to view this page',
    `<p style="margin:0 0 8px 0">You might not have permission to view this directory or page using the credentials that you supplied.</p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>Click the <b>Back</b> button to try another link.</li>
       <li>If you believe you should be able to view this directory or page, please contact the Web site administrator.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">HTTP 403 - Forbidden<br>Internet Explorer</p>`,
    url,
  );
}

function ieConnectionErrorPage(url: string, detail: string): Response {
  return ieErrorPage(
    'The page cannot be displayed',
    'The page cannot be displayed',
    `<p style="margin:0 0 8px 0">The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.</p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>Click the <b>Refresh</b> button, or try again later.</li>
       <li>If you typed the page address in the Address bar, make sure that it is spelled correctly.</li>
       <li>To check your connection settings, click the <b>Tools</b> menu, and then click <b>Internet Options</b>. On the <b>Connections</b> tab, click <b>Settings</b>.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">Cannot find server or DNS Error<br>${detail}<br>Internet Explorer</p>`,
    url,
  );
}

function ieDnsErrorPage(url: string, hostname: string): Response {
  return ieErrorPage(
    'The page cannot be displayed',
    'The page cannot be displayed',
    `<p style="margin:0 0 8px 0">DNS Lookup failed for: <b>${hostname}</b></p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>Check that you have typed the Web page address correctly.</li>
       <li>If you are sure the address is correct, try visiting the page later.</li>
       <li>Verify that your Internet connection is working by visiting another Web site.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">Cannot find server or DNS Error<br>Internet Explorer</p>`,
    url,
  );
}

function ieTimeoutPage(url: string): Response {
  return ieErrorPage(
    'The page cannot be displayed',
    'The page cannot be displayed',
    `<p style="margin:0 0 8px 0">The operation timed out when attempting to contact the Web site.</p>
     <p style="margin:0 0 12px 0"><b>Please try the following:</b></p>
     <ul style="margin:0 0 8px 0;padding-left:20px;line-height:1.8">
       <li>Click the <b>Refresh</b> button, or try again later.</li>
       <li>The server might be busy or temporarily unavailable. Try again in a few moments.</li>
       <li>If you are unable to load any pages, check your network connection.</li>
     </ul>
     <p style="margin:8px 0 0 0;font-size:10px;color:#888">Connection Timed Out<br>Internet Explorer</p>`,
    url,
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return ieConnectionErrorPage(url || '', 'Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return ieConnectionErrorPage(url, 'Only HTTP/HTTPS URLs are allowed');
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Return IE error pages for HTTP errors
    if (response.status === 404) return ieNotFoundPage(url);
    if (response.status === 403) return ieForbiddenPage(url);
    if (response.status >= 500) return ieServerErrorPage(response.status, url);

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      if (!BLOCKED_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      let html = await response.text();

      const baseTag = `<base href="${parsed.origin}${parsed.pathname}">`;

      // Strip CSP meta tags from the HTML itself
      html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?content-security-policy["']?[^>]*>/gi, '');

      // Strip meta refresh redirects that bypass the proxy
      html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');

      // Injected script: intercepts all navigation and sends postMessage
      // to the parent React component, which handles loading via proxy.
      // The iframe never navigates itself — the parent always controls src.
      const proxyScript = `<script>
(function() {
  var BASE = '${parsed.origin}';

  function toAbsolute(href) {
    if (!href) return null;
    href = String(href).trim();
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('data:') || href.startsWith('blob:') || href.startsWith('about:') || href.startsWith('mailto:')) return null;
    if (href.startsWith('#')) return null;
    if (href.startsWith('//')) return 'https:' + href;
    if (href.startsWith('/')) return BASE + href;
    if (/^https?:\\/\\//i.test(href)) return href;
    return BASE + '/' + href;
  }

  function navigate(href) {
    var abs = toAbsolute(href);
    if (abs) {
      window.parent.postMessage({ type: 'ie-navigate', url: abs }, '*');
      return true;
    }
    return false;
  }

  // Intercept link clicks
  document.addEventListener('click', function(e) {
    var a = e.target;
    while (a && a.tagName !== 'A') a = a.parentElement;
    if (!a) return;
    var href = a.getAttribute('href');
    if (href && navigate(href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var action = form.getAttribute('action') || '/';
    var abs = toAbsolute(action);
    if (!abs) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    var fd = new FormData(form);
    var params = new URLSearchParams(fd).toString();
    var sep = abs.includes('?') ? '&' : '?';
    window.parent.postMessage({ type: 'ie-navigate', url: abs + sep + params }, '*');
  }, true);

  // Intercept location.assign / location.replace
  var origAssign = window.location.assign.bind(window.location);
  var origReplace = window.location.replace.bind(window.location);

  window.location.assign = function(href) {
    if (!navigate(href)) origAssign(href);
  };
  window.location.replace = function(href) {
    if (!navigate(href)) origReplace(href);
  };

  // Intercept window.open
  var origOpen = window.open;
  window.open = function(href) {
    if (href && navigate(href)) return null;
    return origOpen.apply(this, arguments);
  };
})();
</script>`;

      const headMatch = html.match(/<head[^>]*>/i);
      if (headMatch) {
        html = html.replace(headMatch[0], headMatch[0] + baseTag + proxyScript);
      } else {
        html = baseTag + proxyScript + html;
      }

      headers.set('content-type', 'text/html; charset=utf-8');
      headers.delete('content-length');
      headers.delete('content-encoding');

      return new Response(html, { status: response.status, headers });
    }

    return new Response(response.body, { status: response.status, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';

    if (message.includes('abort') || message.includes('timeout')) {
      return ieTimeoutPage(url);
    }

    if (message.includes('ENOTFOUND') || message.includes('getaddrinfo') || message.includes('DNS')) {
      return ieDnsErrorPage(url, parsed.hostname);
    }

    return ieConnectionErrorPage(url, message);
  }
}
