interface TursoConfig {
  readonly authToken: string;
  readonly databaseUrl: string;
}

export const getTursoConfig = (): TursoConfig => {
  const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }

  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN is not set");
  }

  return { databaseUrl, authToken };
};
