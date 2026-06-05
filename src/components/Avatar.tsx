import { Profile } from "@/lib/types";
import { initials, colorFromId } from "@/lib/utils";

export function Avatar({
  profile,
  size = 40,
  ring = false,
}: {
  profile?: Profile | null;
  size?: number;
  ring?: boolean;
}) {
  const bg = colorFromId(profile?.id ?? "x");
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
        ring ? "ring-2 ring-white" : ""
      }`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.4,
      }}
      title={profile?.full_name ?? profile?.email ?? ""}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials(profile)
      )}
    </div>
  );
}
