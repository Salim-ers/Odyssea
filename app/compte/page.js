import AccountForm from "../../components/AccountForm";
import { currentUser } from "../../lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Votre compte — Odyssea" };

export default async function ComptePage({ searchParams }) {
  const user = await currentUser();
  if (user) redirect("/mes-voyages");
  return <AccountForm claimTripId={searchParams?.claim || null} />;
}
