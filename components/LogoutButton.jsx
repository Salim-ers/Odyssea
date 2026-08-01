"use client";
import { useRouter } from "next/navigation";
import { useOdyssea } from "../lib/store";

export default function LogoutButton() {
  const { logout } = useOdyssea();
  const router = useRouter();
  return (
    <button
      className="btn btn-quiet small"
      onClick={async () => {
        await logout();
        router.push("/");
        router.refresh();
      }}
    >
      Se déconnecter
    </button>
  );
}
