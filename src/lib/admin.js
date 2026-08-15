export const EMAILS_ADMIN = ["info@estalviar.com"];

export function estAdmin(email) {
  return EMAILS_ADMIN.includes(email);
}