import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { pool } from "./connection-pool";

export { pool };
export const db = drizzle({ client: pool, schema });