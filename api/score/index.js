const { getContainer, normalizePrincipal, parsePrincipalHeader } = require('../_shared/cosmos-auth');

function clampGrade(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 1;
  }
  return Math.max(1, Math.min(6, Math.round(numeric)));
}

module.exports = async function (context, req) {
  const principal = parsePrincipalHeader(req);
  const auth = normalizePrincipal(principal);
  if (!auth.authenticated) {
    context.res = {
      status: 401,
      body: {
        authenticated: false,
        saved: false,
        reason: 'not-authenticated'
      }
    };
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const grade = clampGrade(body.grade);
    const email = auth.user.email;
    const container = getContainer();

    let existing = null;
    try {
      const { resource } = await container.item(email, email).read();
      existing = resource || null;
    } catch (error) {
      const statusCode = Number(error && (error.code || error.statusCode));
      if (statusCode !== 404) {
        throw error;
      }
    }

    const currentScores = Array.isArray(existing && existing.quiz_scores)
      ? existing.quiz_scores.filter(value => Number.isFinite(Number(value))).map(value => Math.round(Number(value)))
      : [];

    const nextScores = currentScores.concat(grade).slice(-100);
    const profile = {
      id: email,
      email,
      first_name: auth.user.first_name || 'Reader',
      quiz_scores: nextScores
    };

    await container.items.upsert(profile);

    context.res = {
      status: 200,
      body: {
        authenticated: true,
        saved: true,
        user: auth.user,
        profile
      }
    };
  } catch (error) {
    context.log.error('Score API failure', error);
    context.res = {
      status: 500,
      body: {
        authenticated: true,
        saved: false,
        reason: 'save-failed',
        message: String(error && error.message ? error.message : error)
      }
    };
  }
};