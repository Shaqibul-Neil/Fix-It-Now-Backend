import dotenv from "dotenv";
import path from "path";
import { env } from "process";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  url: env.BASE_URL as string,
  local_url: env.LOCAL_URL as string,
  app_url: env.APP_URL as string,
  port: env.PORT as string,
  database_url: env.DATABASE_URL as string,
  node_env: env.NODE_ENV as string,
  bcrypt_salt_rounds: Number(env.BCRYPT_SALT_ROUNDS ?? 10),

  jwt: {
    access: {
      secret: env.JWT_ACCESS_TOKEN_SECRET as string,
      expires_in: (env.JWT_ACCESS_EXPIRY as string) ?? "15m",
    },
    refresh: {
      secret: env.JWT_REFRESH_TOKEN_SECRET as string,
      expires_in: (env.JWT_REFRESH_EXPIRY as string) ?? "7d",
    },
  },
};

export default config;
