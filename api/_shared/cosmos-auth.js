const { CosmosClient } = require('@azure/cosmos');

function parsePrincipalHeader(req) {
  const header = req.headers['x-ms-client-principal'];
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
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim() || 'https';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) {
    return '';
  }

  return `${proto}://${host}`;
}

function isSameOriginRequest(req) {
  const expectedOrigin = parseRequestOrigin(req);
  if (!expectedOrigin) {
    return false;
  }

  const originHeader = String(req.headers.origin || '').trim();
  if (originHeader) {
    return originHeader === expectedOrigin;
  }

  const refererHeader = String(req.headers.referer || '').trim();
  if (!refererHeader) {
    return false;
  }

  try {
    return new URL(refererHeader).origin === expectedOrigin;
  } catch (_error) {
    return false;
  }
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