(function () {
  function sanitizeName(value) {
    return String(value || "").trim();
  }

  function getClaim(claims, types) {
    if (!Array.isArray(claims)) {
      return "";
    }

    for (let i = 0; i < claims.length; i += 1) {
      const claim = claims[i];
      const type = String(claim.typ || "").toLowerCase();
      const val = String(claim.val || "").trim();
      if (!val) {
        continue;
      }

      if (types.some(candidate => type === candidate)) {
        return val;
      }
    }

    return "";
  }

  function extractUserPrincipal(payload) {
    if (Array.isArray(payload) && payload.length > 0) {
      return payload[0] && payload[0].clientPrincipal ? payload[0].clientPrincipal : null;
    }

    if (payload && payload.clientPrincipal) {
      return payload.clientPrincipal;
    }

    return null;
  }

  function normalizeScores(scores) {
    if (!Array.isArray(scores)) {
      return [];
    }

    return scores
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value >= 0)
      .map(value => Math.round(value));
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      }
    }, options || {}));

    if (!response.ok) {
      const text = await response.text();
      const detail = text ? " Response body: " + text.slice(0, 600) : "";
      const error = new Error("Request failed: " + response.status + " " + response.statusText + detail);
      error.status = response.status;
      error.body = text;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      const parseError = new Error("Response was not valid JSON");
      parseError.status = response.status;
      parseError.body = text.slice(0, 600);
      throw parseError;
    }
  }

  async function getCurrentUser() {
    try {
      const payload = await fetchJson("/.auth/me", { method: "GET" });
      const principal = extractUserPrincipal(payload);

      if (!principal || !principal.userId) {
        return { authenticated: false };
      }

      const claims = principal.claims || [];
      const email = (
        getClaim(claims, [
          "emails",
          "email",
          "emailaddress",
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
          "preferred_username",
          "upn"
        ]) || principal.userDetails || ""
      ).toLowerCase();
      const firstName = sanitizeName(getClaim(claims, ["given_name", "name"])) || sanitizeName((principal.userDetails || "").split("@")[0]);

      if (!email) {
        return { authenticated: false };
      }

      return {
        authenticated: true,
        id: principal.userId,
        email,
        first_name: firstName || "Reader",
        provider: principal.identityProvider || "unknown"
      };
    } catch (error) {
      console.warn("Unable to read auth state", error);
      return { authenticated: false, error };
    }
  }

  async function getCurrentUserProfileWithScores() {
    const user = await getCurrentUser();
    if (!user.authenticated) {
      return {
        authenticated: false,
        user: null,
        profile: null,
        scores: []
      };
    }

    try {
      const payload = await fetchJson("/api/profile", { method: "GET" });
      const profile = payload && payload.profile ? payload.profile : null;
      const scores = normalizeScores(payload && payload.scores ? payload.scores : (profile ? profile.quiz_scores : []));

      return {
        authenticated: true,
        user: payload && payload.user ? payload.user : user,
        profile,
        scores
      };
    } catch (error) {
      console.error("Unable to load profile via backend API", error);
      return {
        authenticated: true,
        user,
        profile: null,
        scores: []
      };
    }
  }

  async function saveQuizGradeForCurrentUser(grade) {
    const user = await getCurrentUser();

    if (!user.authenticated) {
      return {
        saved: false,
        reason: "not-authenticated"
      };
    }

    const numericGrade = Math.max(1, Math.min(6, Math.round(Number(grade) || 1)));

    try {
      const payload = await fetchJson("/api/score", {
        method: "POST",
        body: JSON.stringify({ grade: numericGrade })
      });

      if (payload && payload.saved) {
        return {
          saved: true,
          user: payload.user || user,
          profile: payload.profile || null
        };
      }

      return {
        saved: false,
        reason: payload && payload.reason ? payload.reason : "save-failed",
        errorStatus: null,
        errorBody: payload && payload.message ? String(payload.message).slice(0, 300) : ""
      };
    } catch (error) {
      console.error("Unable to save quiz grade", error);
      return {
        saved: false,
        reason: "save-failed",
        error,
        errorStatus: error && error.status ? error.status : null,
        errorBody: error && error.body ? String(error.body).slice(0, 300) : "",
        failures: [],
        user
      };
    }
  }

  window.readingAppUserData = {
    getCurrentUser,
    getCurrentUserProfileWithScores,
    saveQuizGradeForCurrentUser
  };
}());
