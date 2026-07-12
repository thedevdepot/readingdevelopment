const { getContainer, normalizePrincipal, parsePrincipalHeader } = require('../_shared/cosmos-auth');

module.exports = async function (context, req) {
  const principal = parsePrincipalHeader(req);
  const auth = normalizePrincipal(principal);
  if (!auth.authenticated) {
    context.res = {
      status: 401,
      body: {
        authenticated: false,
        reason: 'not-authenticated'
      }
    };
    return;
  }

  try {
    const container = getContainer();
    const email = auth.user.email;
    let profile = null;

    try {
      const { resource } = await container.item(email, email).read();
      profile = resource || null;
    } catch (error) {
      const statusCode = Number(error && (error.code || error.statusCode));
      if (statusCode !== 404) {
        throw error;
      }
    }

    const scores = Array.isArray(profile && profile.quiz_scores) ? profile.quiz_scores : [];
    context.res = {
      status: 200,
      body: {
        authenticated: true,
        user: auth.user,
        profile,
        scores
      }
    };
  } catch (error) {
    context.log.error('Profile API failure', error);
    context.res = {
      status: 500,
      body: {
        authenticated: true,
        reason: 'profile-read-failed',
        message: String(error && error.message ? error.message : error)
      }
    };
  }
};