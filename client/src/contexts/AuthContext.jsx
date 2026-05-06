import { createContext, useState, useEffect } from "react";

const tokenStorageKey = "codemate_token";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(tokenStorageKey) || ""
  );
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      localStorage.removeItem(tokenStorageKey);
      return;
    }

    localStorage.setItem(tokenStorageKey, token);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem(tokenStorageKey);
    setToken("");
    setCurrentUser(null);
  };

  const handleLoginSuccess = (authResponse) => {
    setToken(authResponse.token);
    setCurrentUser({
      _id: authResponse._id,
      name: authResponse.name,
      email: authResponse.email,
      role: authResponse.role
    });
  };

  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        setToken,
        setCurrentUser: handleSetCurrentUser,
        login: handleLoginSuccess,
        logout: handleLogout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
