const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const defaultHeaders = {
  "Content-Type": "application/json"
};

async function request(path, options = {}) {
  const url = `${apiBaseUrl}${path}`;
  console.log("[api] request", {
    url,
    method: options.method || "GET"
  });

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    });
  } catch (error) {
    console.error("[api] network error", {
      url,
      method: options.method || "GET",
      message: error.message
    });

    const networkError = new Error(
      `Cannot reach the backend at ${apiBaseUrl}. Make sure the Express server is running on port 5000.`
    );
    networkError.status = 0;
    networkError.cause = error;
    throw networkError;
  }

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

  console.log("[api] response", {
    url,
    status: response.status,
    ok: response.ok
  });

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
  return request("/api/auth/register", {
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

export function getUserMatches(token) {
  return request("/api/users/match", {
    headers: authHeaders(token)
  });
}

export function getConversationMessages(token, userId) {
  return request(`/api/messages/${userId}`, {
    headers: authHeaders(token)
  });
}

export function getProjects(token) {
  return request("/api/projects", {
    headers: authHeaders(token)
  });
}

export function createProject(token, payload) {
  return request("/api/projects", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
}

export function joinProject(token, projectId) {
  return request(`/api/projects/join/${projectId}`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export function getConnections(token) {
  return request("/api/connections", {
    headers: authHeaders(token)
  });
}

export function getConnectionRequests(token) {
  return request("/api/connections/requests", {
    headers: authHeaders(token)
  });
}

export function sendConnectionRequest(token, userId) {
  return request(`/api/connections/request/${userId}`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export function acceptConnectionRequest(token, requestId) {
  return request(`/api/connections/${requestId}/accept`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function rejectConnectionRequest(token, requestId) {
  return request(`/api/connections/${requestId}/reject`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function cancelConnectionRequest(token, requestId) {
  return request(`/api/connections/${requestId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
}

export function sendProjectInvite(token, projectId, userId) {
  return request(`/api/projects/invites/invite/${projectId}/${userId}`, {
    method: "POST",
    headers: authHeaders(token)
  });
}

export function getProjectInvites(token) {
  return request("/api/projects/invites", {
    headers: authHeaders(token)
  });
}

export function acceptProjectInvite(token, inviteId) {
  return request(`/api/projects/invites/invite/${inviteId}/accept`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function rejectProjectInvite(token, inviteId) {
  return request(`/api/projects/invites/invite/${inviteId}/reject`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function getNotifications(token) {
  return request("/api/notifications", {
    headers: authHeaders(token)
  });
}

export function markNotificationRead(token, notificationId) {
  return request(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(token)
  });
}

export function searchUsers(token, query) {
  return request(`/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(token)
  });
}

export { apiBaseUrl };
