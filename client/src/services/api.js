const apiBaseUrl = "http://127.0.0.1:5000";

const defaultHeaders = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const url = `${apiBaseUrl}${path}`;
  console.log("[api] request", url, options.method || "GET");

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  });

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.warn("[api] non-json response", error);
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || "API request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function signupUser(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCurrentUser(token) {
  return request("/api/auth/me", {
    headers: authHeaders(token)
  });
}

export function getMyProfile(token) {
  return request("/api/profiles/me", {
    headers: authHeaders(token)
  });
}

export function getProfileById(profileId) {
  return request(`/api/profiles/${profileId}`);
}

export function createProfile(token, payload) {
  return request("/api/profiles", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function getProfileMatches(token) {
  return request("/api/matches", {
    headers: authHeaders(token)
  });
}

export function getConversationMessages(token, userId) {
  return request(`/api/messages/${userId}`, {
    headers: authHeaders(token)
  });
}

export function searchUsers(token, query) {
  return request(`/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(token)
  });
}

export { apiBaseUrl };
