"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

/**
 * Bilet sayfalarında görünen katkı kutusu. Metin takımın yazdığı gibi.
 *
 * Tutar etkinliğin maliyet hesabından sonra belirlenecek; o güne kadar
 * yer tutucu görünür. `amount` verilirse rakam onun yerine geçer.
 */
export default function TicketContribution({ amount }: { amount?: number }) {
  const { t } = useLang();

  return (
    <aside className="rounded-xl border border-green-600/40 bg-green-50 p-4">
      <p className="font-semibold text-green-900">♥ {t("tc_title")}</p>
      <p className="mt-2 text-sm text-green-900/80">
        {t("tc_from_ticket")}{" "}
        <strong>{amount ?? `[${t("tc_amount_placeholder")}]`}</strong> {t("tc_body1")}
      </p>
      <p className="mt-2 text-sm text-green-900/80">{t("tc_body2")}</p>
      <Link
        href="/bursayla-ilk-bulusma"
        className="mt-3 inline-block text-sm font-semibold text-green-800 underline underline-offset-4"
      >
        {t("tc_link")} →
      </Link>
    </aside>
  );
}
