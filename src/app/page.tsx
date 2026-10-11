import Link from "next/link";

const problems = [
  {
    title: "Nereden başlayacağını bilmiyorsun",
    body: "Şehre ilk kez gelen turist ve öğrenciler, hangi mekanın hangi saatte gezilmesi gerektiğini bilmediği için zamanını kaybediyor.",
  },
  {
    title: "Rotalar herkese aynı",
    body: "Mevcut haritalar tek tip liste veriyor; ilgi alanı, bütçe ve elindeki süre hesaba katılmıyor.",
  },
  {
    title: "Turist ile esnaf kopuk",
    body: "Ziyaretçiyi yerel esnafa ve belediye tesislerine yönlendiren bir teşvik yok.",
  },
];

const solutions = [
  {
    tag: "01",
    title: "Kişiselleştirilmiş rota sihirbazı",
    body: "Süre, başlangıç saati, ilgi alanı ve bütçeyi sor; açık olan mekanlardan yürüme mesafesine göre sıralı bir gün planı çıkar. Öğle veya akşam saatine denk gelirse rotaya en yakın yemek molasını kendisi ekler.",
  },
  {
    tag: "02",
    title: "Gez-kazan: QR ile puan ve rozet",
    body: "Mekandaki QR okutulunca puan ve dijital rozet düşer. Aynı mekandan ikinci kez puan alınamaz; puan sunucuda hesaplanır.",
  },
  {
    tag: "03",
    title: "Gerçek indirim cüzdanı",
    body: "Puan, belediye sosyal tesislerinde ve anlaşmalı yerel esnafta geçerli kupona dönüşür. Ödüllerden biri geri dönüşümlü sürpriz hediye kutusu.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-14 sm:py-20">
        <p className="mb-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
          Bursa · Osmangazi
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Şehri yabancılık çekmeden gez, gezdikçe kazan.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          KültürRotam, elindeki süreye ve ilgi alanına göre Osmangazi rotanı çizer; her
          durakta QR okutarak puan toplar, puanı yerel esnafta indirime çevirirsin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sihirbaz"
            className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:opacity-90"
          >
            Rotamı oluştur
          </Link>
          <Link
            href="/oduller"
            className="rounded-full border border-line bg-surface px-6 py-3 font-semibold hover:bg-brand-soft"
          >
            Ödülleri gör
          </Link>
        </div>
      </section>

      <section className="border-t border-line py-12">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Problem</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {problems.map((p) => (
            <div key={p.title} className="rounded-xl border border-line bg-surface p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-12">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Çözüm</h2>
        <div className="mt-6 space-y-4">
          {solutions.map((s) => (
            <div
              key={s.tag}
              className="flex gap-4 rounded-xl border border-line bg-surface p-5"
            >
              <span className="text-2xl font-bold text-brand">{s.tag}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-12">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
          Sosyal etki
        </h2>
        <p className="mt-4 max-w-3xl text-muted">
          Turist akışı doğrudan yerel esnafa yönlenir. Uygulamadan gelen sponsorluk ve
          reklam gelirinin bir kısmı dezavantajlı gençlerin kültürel gezileri için
          ayrılır; ödül kutuları geri dönüştürülmüş malzemeden üretilir.
        </p>
      </section>
    </div>
  );
}
