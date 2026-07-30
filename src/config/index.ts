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

  // The wall clock the platform runs on. A technician writing "09:00 - 17:00" on
  // their availability means nine in the morning where they are, not 09:00Z, so
  // every booking instant is read back in this zone before it is compared to a
  // slot. An IANA name rather than a fixed offset, so a future DST rule is the
  // runtime's problem and not ours.
  timezone: (env.APP_TIMEZONE as string) || "Asia/Dhaka",

  jwt: {
    access: {
      secret: env.JWT_ACCESS_TOKEN_SECRET as string,
      expires_in: (env.JWT_ACCESS_EXPIRY as string) ?? "15m",
    },
    refresh: {
      secret: env.JWT_REFRESH_TOKEN_SECRET as string,
      expires_in: (env.JWT_REFRESH_EXPIRY as string) ?? "30d",
    },
  },
  ssl: {
    store_id: env.SSL_STORE_ID as string,
    store_passwd: env.SSL_STORE_PASSWORD as string,
  },
  technician_share: 0.6,
};

export default config;
