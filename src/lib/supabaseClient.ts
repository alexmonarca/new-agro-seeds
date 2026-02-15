import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qqzvmwbweuaybkymkldi.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxenZtd2J3ZXVheWJreW1rbGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTAyMDQsImV4cCI6MjA4MzgyNjIwNH0.i9JNHdmJkB-APm8UtgXzCwGLPyyZv4RbRbAICDVR3_A";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase URL ou anon key não configurados. Verifique as variáveis de ambiente.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
