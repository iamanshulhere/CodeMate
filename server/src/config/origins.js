const defaultOrigins = ["http://127.0.0.1:5173", "http://localhost:5173"];

export const getAllowedOrigins = () => {
  const configuredOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

  return [...new Set([...defaultOrigins, ...configuredOrigins])];
};

export const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
};
