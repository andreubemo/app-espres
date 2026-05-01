import { requireInternalUser } from "@/lib/access-control"

export async function getServerSession() {
  const user = await requireInternalUser()

  return { user }
}
