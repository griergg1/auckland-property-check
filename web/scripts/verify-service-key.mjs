import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } },
);
const { data, error } = await sb.from("datasets").select("slug").limit(5);
if (error) {
  console.error("ERR", error.message);
  process.exit(1);
}
console.log("OK service role key works. datasets:", JSON.stringify(data.map((d) => d.slug)));
