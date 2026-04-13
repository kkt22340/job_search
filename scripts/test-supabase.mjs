/**
 * Supabase 연결 테스트: .env.local 로드 후 REST로 categories 1건 조회
 * 실행: node scripts/test-supabase.mjs
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

/** @returns {Record<string, string>} */
function parseEnvFile(filePath) {
  const out = {};
  const raw = readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

if (!existsSync(envPath)) {
  console.error("❌ .env.local 파일이 없습니다:", envPath);
  process.exit(1);
}

// 시스템/터미널에 남은 NEXT_PUBLIC_* 가 .env.local 과 다를 수 있으므로 파일만 신뢰
const fileEnv = parseEnvFile(envPath);
const url = fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 비어 있습니다.");
  process.exit(1);
}

if (!url?.includes(".supabase.co") || url.includes("YOUR_PROJECT_REF") || anonKey === "your_anon_key") {
  console.error("❌ .env.local 이 디스크에 저장되지 않았거나, 아직 예시 URL/키입니다.");
  console.error("   Cursor에서 실제 URL·anon 키를 넣었다면 Ctrl+S 로 저장한 뒤 다시 실행하세요.");
  console.error("   (터미널과 Node는 저장된 파일만 읽습니다.)\n");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

let data;
let error;
try {
  const res = await supabase.from("categories").select("id, slug, name_ko").limit(3);
  data = res.data;
  error = res.error;
} catch (e) {
  console.error("❌ 요청 예외:", e?.message ?? e);
  if (e?.cause) console.error("   원인:", e.cause);
  process.exit(1);
}

if (error) {
  console.error("❌ Supabase 요청 실패:");
  console.error("   코드:", error.code ?? "(없음)");
  console.error("   상세:", error.details ?? "(없음)");
  console.error("   메시지:", error.message);
  if (error.message?.includes("Invalid API key") || error.message?.includes("JWT")) {
    console.error(
      "\n   → 대시보드 Project Settings → API 의 legacy **anon public** (JWT, eyJ로 시작) 키를 쓰는지 확인하세요.\n      `sb_publishable_` 키만 있으면 같은 화면의 anon 키를 함께 확인하세요."
    );
  }
  if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
    console.error("\n   → supabase/schema.sql 을 SQL Editor에서 실행했는지 확인하세요.");
  }
  process.exit(1);
}

console.log("✅ Supabase 연결 성공");
console.log("   URL:", url.replace(/^(https:\/\/[^.]+\.)([^.]+)(.+)$/, "$1***$3"));
console.log("   categories 샘플 (최대 3건):", JSON.stringify(data, null, 2));
process.exit(0);
