import { cookies } from "next/headers";

export function isAuthed() {
  const cookieStore = cookies();
  const auth = cookieStore.get("admin-auth");
  return auth?.value === "true";
}
