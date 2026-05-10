// lib/kv.js – thin wrapper around Vercel KV with in-memory fallback (dev/no-KV)
import { SEED } from "./seed.js";

let memStore = null; // in-memory fallback when KV is not configured

function getStore() {
  if (!memStore) {
    memStore = {
      users: JSON.parse(JSON.stringify(SEED.users)),
      courses: JSON.parse(JSON.stringify(SEED.courses)),
    };
  }
  return memStore;
}

async function tryKV(fn) {
  try {
    const { kv } = await import("@vercel/kv");
    return await fn(kv);
  } catch {
    return null;
  }
}

// ── USERS ────────────────────────────────────────────────────────────────────
export async function getUsers() {
  const data = await tryKV(kv => kv.get("db:users"));
  if (data) return data;
  return getStore().users;
}

export async function setUsers(users) {
  const ok = await tryKV(kv => kv.set("db:users", users));
  if (!ok) getStore().users = users;
}

// ── COURSES ──────────────────────────────────────────────────────────────────
export async function getCourses() {
  const data = await tryKV(kv => kv.get("db:courses"));
  if (data) return data;
  return getStore().courses;
}

export async function setCourses(courses) {
  const ok = await tryKV(kv => kv.set("db:courses", courses));
  if (!ok) getStore().courses = courses;
}

// ── INIT (seed on first run) ─────────────────────────────────────────────────
export async function ensureInit() {
  const existing = await tryKV(kv => kv.get("db:users"));
  if (!existing) {
    await tryKV(kv => kv.set("db:users", SEED.users));
    await tryKV(kv => kv.set("db:courses", SEED.courses));
  }
}
