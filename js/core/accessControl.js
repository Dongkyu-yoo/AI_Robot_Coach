export const ADMIN_EMAILS = Object.freeze(["ghost8965@gmail.com"]);

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

export function isAdmin(user = {}) {
  return user.role === "admin" || ADMIN_EMAILS.includes(normalizeEmail(user.email));
}

export function isTeacherOrAdmin(user = {}) {
  return ["teacher", "admin"].includes(user.role) || isAdmin(user);
}

export function getDisplayRole(user = {}) {
  if (isAdmin(user)) return "관리자";
  return user.role === "teacher" ? "교사" : "학생";
}
