import { createClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/data";
import { ExpenseForm } from "@/components/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: { group?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ws = await loadWorkspace(supabase, user.id);

  const groups = ws.groups.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    memberIds: ws.memberIdsByGroup[g.id] ?? [],
  }));

  return (
    <ExpenseForm
      meId={user.id}
      groups={groups}
      profiles={ws.profiles}
      initialGroupId={searchParams.group}
    />
  );
}
