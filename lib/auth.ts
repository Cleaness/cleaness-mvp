import { cookies } from "next/headers";

export async function isAuthed() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin-auth");
  return auth?.value === "true";
}
