const { CosmosClient } = require('@azure/cosmos');

function getHeader(req, name) {
  const headers = req && req.headers ? req.headers : {};
  const direct = headers[name];
  if (direct !== undefined && direct !== null) {
    return direct;
  }

  const lowerName = String(name || '').toLowerCase();
  const match = Object.keys(headers).find((key) => String(key).toLowerCase() === lowerName);
  return match ? headers[match] : undefined;
}

function parsePrincipalHeader(req) {
  const header = getHeader(req, 'x-ms-client-principal');
  if (!header) {
    return null;
  }

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

function parseRequestOrigin(req) {
  const proto = String(getHeader(req, 'x-forwarded-proto') || 'https').split(',')[0].trim() || 'https';
  const host = String(getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || '').split(',')[0].trim();
  if (!host) {
    return '';
  }

  return `${proto}://${host}`;
}

function parseOriginHost(originValue) {
  if (!originValue) {
    return '';
  }

  try {
    return new URL(String(originValue).trim()).host.toLowerCase();
  } catch (_error) {
    return '';
  }
}

function parseExpectedHosts(req) {
  const originalUrl = String(getHeader(req, 'x-ms-original-url') || '').trim();
  const originalUrlHost = parseOriginHost(originalUrl);
  const hosts = [
    getHeader(req, 'x-forwarded-host'),
    getHeader(req, 'x-original-host'),
    getHeader(req, 'x-ms-original-host'),
    getHeader(req, 'x-arr-original-host'),
    originalUrlHost,
    getHeader(req, 'host')
  ];

  const parsedHosts = hosts
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(parsedHosts));
}

function isTrustedFetchSite(req) {
  const secFetchSite = String(getHeader(req, 'sec-fetch-site') || '').toLowerCase().trim();
  if (!secFetchSite) {
    return false;
  }

  return secFetchSite === 'same-origin' || secFetchSite === 'same-site' || secFetchSite === 'none';
}

function isSameOriginRequest(req) {
  const expectedHosts = parseExpectedHosts(req);
  const expectedOrigin = parseRequestOrigin(req);
  if (!expectedOrigin && expectedHosts.length === 0) {
    return false;
  }

  const originHeader = String(getHeader(req, 'origin') || '').trim();
  if (originHeader) {
    if (originHeader === expectedOrigin) {
      return true;
    }

    const originHost = parseOriginHost(originHeader);
    if (!!originHost && expectedHosts.includes(originHost)) {
      return true;
    }

    return isTrustedFetchSite(req);
  }

  const refererHeader = String(getHeader(req, 'referer') || '').trim();
  if (refererHeader) {
    try {
      if (new URL(refererHeader).origin === expectedOrigin) {
        return true;
      }
    } catch (_error) {
      return false;
    }

    const refererHost = parseOriginHost(refererHeader);
    if (!!refererHost && expectedHosts.includes(refererHost)) {
      return true;
    }

    return isTrustedFetchSite(req);
  }

  return isTrustedFetchSite(req);
}

function getClaim(claims, types) {
  if (!Array.isArray(claims)) {
    return '';
  }

  for (let i = 0; i < claims.length; i += 1) {
    const claim = claims[i] || {};
    const type = String(claim.typ || '').toLowerCase();
    const value = String(claim.val || '').trim();
    if (!value) {
      continue;
    }

    if (types.includes(type)) {
      return value;
    }
  }

  return '';
}

function normalizePrincipal(principal) {
  if (!principal) {
    return { authenticated: false };
  }

  const roles = Array.isArray(principal.userRoles) ? principal.userRoles : [];
  const authenticated = roles.includes('authenticated');
  if (!authenticated) {
    return { authenticated: false };
  }

  const claims = Array.isArray(principal.claims) ? principal.claims : [];
  const email = (
    getClaim(claims, [
      'emails',
      'email',
      'emailaddress',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      'preferred_username',
      'upn'
    ]) || principal.userDetails || ''
  ).toLowerCase();

  const firstName = (
    getClaim(claims, ['given_name', 'name']) || String((principal.userDetails || '').split('@')[0] || '')
  ).trim() || 'Reader';

  if (!email) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    user: {
      id: principal.userId || '',
      email,
      first_name: firstName,
      provider: principal.identityProvider || 'unknown'
    }
  };
}

let cachedContainer = null;

function getContainer() {
  if (cachedContainer) {
    return cachedContainer;
  }

  const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Missing COSMOSDB_CONNECTION_STRING');
  }

  const databaseId = process.env.COSMOSDB_DATABASE_ID || 'quizdatabase';
  const containerId = process.env.COSMOSDB_CONTAINER_ID || 'Users';

  const client = new CosmosClient(connectionString);
  cachedContainer = client.database(databaseId).container(containerId);
  return cachedContainer;
}

module.exports = {
  getContainer,
  normalizePrincipal,
  parsePrincipalHeader,
  isSameOriginRequest
};