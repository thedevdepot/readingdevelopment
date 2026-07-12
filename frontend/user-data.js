(function () {
  const restEntityPaths = [
    "/data-api/rest/UserProfile",
    "/data-api/rest/userprofile"
  ];

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

  function parseProfileResponse(payload) {
    if (!payload) {
      return null;
    }

    if (Array.isArray(payload.value)) {
      return payload.value.length > 0 ? payload.value[0] : null;
    }

    if (Array.isArray(payload.items)) {
      return payload.items.length > 0 ? payload.items[0] : null;
    }

    if (Array.isArray(payload)) {
      return payload.length > 0 ? payload[0] : null;
    }

    if (payload.id && payload.email) {
      return payload;
    }

    return null;
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
      const error = new Error("Request failed: " + response.status + " " + response.statusText);
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
      parseError.body = text.slice(0, 400);
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

  function buildFilterUrl(basePath, email) {
    const escaped = email.replace(/'/g, "''");
    return basePath + "?$filter=" + encodeURIComponent("email eq '" + escaped + "'");
  }

  async function getUserProfile(email) {
    const normalizedEmail = String(email || "").toLowerCase();
    if (!normalizedEmail) {
      return null;
    }

    for (let i = 0; i < restEntityPaths.length; i += 1) {
      const basePath = restEntityPaths[i];

      const attempts = [
        basePath + "/id/" + encodeURIComponent(normalizedEmail),
        basePath + "/" + encodeURIComponent(normalizedEmail),
        buildFilterUrl(basePath, normalizedEmail)
      ];

      for (let j = 0; j < attempts.length; j += 1) {
        try {
          const payload = await fetchJson(attempts[j], { method: "GET" });
          const profile = parseProfileResponse(payload);
          if (profile) {
            return profile;
          }
        } catch (error) {
          if (error.status === 404) {
            continue;
          }
        }
      }
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

  async function createProfile(basePath, profile) {
    return fetchJson(basePath, {
      method: "POST",
      body: JSON.stringify(profile)
    });
  }

  async function requestProfileWrite(url, method, profile) {
    return fetchJson(url, {
      method,
      body: JSON.stringify(profile)
    });
  }

  async function writeProfile(basePath, id, profile, preferUpdate) {
    const encodedId = encodeURIComponent(id);
    const idPath = basePath + "/id/" + encodedId;
    const plainIdPath = basePath + "/" + encodedId;

    const plans = preferUpdate ? [
      { method: "PATCH", url: idPath },
      { method: "PUT", url: idPath },
      { method: "PUT", url: plainIdPath },
      { method: "PATCH", url: plainIdPath },
      { method: "POST", url: basePath }
    ] : [
      { method: "POST", url: basePath },
      { method: "PUT", url: idPath },
      { method: "PATCH", url: idPath },
      { method: "PUT", url: plainIdPath },
      { method: "PATCH", url: plainIdPath }
    ];

    let lastError = null;
    const failures = [];

    for (let i = 0; i < plans.length; i += 1) {
      const plan = plans[i];
      try {
        const payload = await requestProfileWrite(plan.url, plan.method, profile);
        return {
          ok: true,
          payload,
          failures
        };
      } catch (error) {
        lastError = error;
        failures.push({
          method: plan.method,
          url: plan.url,
          status: error && error.status ? error.status : null,
          body: error && error.body ? String(error.body).slice(0, 240) : ""
        });
      }
    }

    return {
      ok: false,
      error: lastError,
      failures
    };
  }

  async function saveQuizGradeForCurrentUser(grade) {
    const numericGrade = Math.max(1, Math.min(6, Math.round(Number(grade) || 1)));
    const user = await getCurrentUser();

    if (!user.authenticated) {
      return {
        saved: false,
        reason: "not-authenticated"
      };
    }

    const existing = await getUserProfile(user.email);
    const currentScores = normalizeScores(existing ? existing.quiz_scores : []);
    const nextScores = currentScores.concat(numericGrade).slice(-100);

    const record = {
      id: (existing && existing.id) || user.email,
      first_name: user.first_name || "Reader",
      email: user.email,
      quiz_scores: nextScores
    };

    let lastError = null;
    for (let i = 0; i < restEntityPaths.length; i += 1) {
      const basePath = restEntityPaths[i];
        try {
          const writeResult = await writeProfile(basePath, record.id, record, !!existing);
          if (!writeResult.ok) {
            lastError = writeResult.error || lastError;
            continue;
          }

        return {
          saved: true,
          user,
          profile: record
        };
      } catch (error) {
        lastError = error;
      }
    }

    console.error("Unable to save quiz grade", lastError);
    return {
      saved: false,
      reason: "save-failed",
      error: lastError,
      errorStatus: lastError && lastError.status ? lastError.status : null,
      errorBody: lastError && lastError.body ? String(lastError.body).slice(0, 300) : "",
      user
    };
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

    const profile = await getUserProfile(user.email);
    const scores = normalizeScores(profile ? profile.quiz_scores : []);

    return {
      authenticated: true,
      user,
      profile,
      scores
    };
  }

  window.readingAppUserData = {
    getCurrentUser,
    getCurrentUserProfileWithScores,
    saveQuizGradeForCurrentUser
  };
}());
