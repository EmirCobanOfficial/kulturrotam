import { redirect } from "next/navigation";

/** Akış, Mekanlar sayfasındaki sekmeye taşındı. Eski bağlantılar kırılmasın. */
export default function FeedRedirect() {
  redirect("/mekanlar?sekme=akis");
}
