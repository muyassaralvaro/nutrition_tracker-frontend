"use client";

import Link from "next/link";
import { Brand } from "@/shared/components/brand/Brand";
import { LanguageToggle } from "@/shared/components/language-toggle/LanguageToggle";
import { ThemeToggle } from "@/shared/components/theme-toggle/ThemeToggle";
import { useLanguage } from "@/shared/language";

const contactEmail = "support@nourish.my.id";

const copy = {
  en: {
    updated: "Updated October 9, 2026",
    back: "Back to sign in",
    home: "Home",
    help: "Questions about these documents or your data?",
    contact: "Email Nourish support",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
    terms: {
      eyebrow: "USE NOURISH WITH CONFIDENCE",
      title: "Terms of Service",
      intro: "These terms explain how you can use Nourish to track meals, weight, and nutrition goals. Please read them before creating an account or continuing with Google.",
      sections: [
        { title: "Who can use Nourish", body: "Nourish's profile and nutrition target features are intended for adults aged 18 or older. You sign in with Google. Keep your Google account secure and provide accurate information when you use the service." },
        { title: "Nutrition information", body: "Targets, calorie totals, and AI meal analyses are estimates. Photos cannot reveal exact ingredients or portions, and results may be wrong. Review and edit each estimate before saving. Nourish does not provide medical advice, diagnosis, or treatment; seek qualified medical advice for health decisions." },
        { title: "Your content", body: "You retain ownership of meal photos, descriptions, and other information you add. You allow Nourish to store and process that content to provide the service, including sending optional meal analyses to an AI provider. Confirmed dish descriptions and nutrition may become references for later analyses requested by other users; account identifiers are not included in those references." },
        { title: "Using the service", body: "Only upload content you have the right to use. Do not misuse Nourish, attempt to access another account, or interfere with the service. AI analysis can be unavailable or delayed; manual meal entry remains an option." },
        { title: "Your account and records", body: "You can edit or delete meals and weight entries, change your profile photo, and delete your account in Settings. Account deletion removes live account records and stored images. Temporary backups or provider records may remain for a limited period under their own retention rules." },
        { title: "Updates to these terms", body: "We may update Nourish and these terms. The date above shows the current version. If you do not agree with updated terms, stop using the service and delete your account." },
      ],
    },
    privacy: {
      eyebrow: "YOUR DATA, CLEARLY EXPLAINED",
      title: "Privacy Policy",
      intro: "Nourish uses your information to sign you in, calculate nutrition targets, and help you review your meals. This policy explains what is handled and how to remove it.",
      sections: [
        { title: "Information we collect", body: "Google sign-in provides your Google account ID, name, email address, and profile photo. You may add birth date, sex used for calculations, height, weight, body build, activity estimate, goals, meal details, photos, and nutrition values. Hosting and API systems may also record technical request data such as IP address and error logs. Older phone account data stays stored until that account is deleted." },
        { title: "How we use it", body: "We use account data for sign-in and support, profile data to estimate editable daily targets, and meal and weight records to show your history and progress. We use technical data to operate and protect the service. Your Google password is never sent to Nourish." },
        { title: "Google profile photo", body: "On your first Google sign-in, Nourish may import a copy of your Google profile photo to private storage. Your photo is served from Nourish after that and can be changed in your profile. We do not request access to your Google Drive, contacts, or other Google account content." },
        { title: "Optional AI meal analysis", body: "Standard accounts can start up to 7 new meal analyses per day, resetting at midnight WIB (Jakarta time), and regenerate each meal up to 2 times. Nourish keeps request counts until account deletion, even if a draft is removed. When you request analysis, Nourish sends your food photo or description to 9router and its underlying AI provider. Confirmed dish details from other users may be sent as references without account identifiers. We do not send your birth date or profile to the model. Provider processing and retention follow its policies. You can enter meals manually instead." },
        { title: "Storage and retention", body: "Uploaded meal photos are converted to JPEG, removing embedded metadata before analysis, and kept in private storage while a draft is available. Draft photos and results expire after about 24 hours or are removed sooner when you retake or confirm a meal. A small thumbnail remains with a saved photo meal until that meal is deleted. Your profile photo and confirmed records remain until you change or delete them; backups and operational logs may persist longer for service recovery and security." },
        { title: "Cookies, sharing, and security", body: "Nourish uses session and CSRF cookies for sign-in, a cookie to remember that you completed the introduction, and browser storage for language and theme. Hosting providers process data needed to run the app. Account records and photos are accessed through authenticated API routes. Nourish does not sell your personal information." },
        { title: "Your choices", body: "You can correct your profile and saved meals, delete entries, or delete your account in Settings. Account deletion removes live records and stored images. For access, correction, deletion, or privacy questions, contact Nourish at the address below." },
        { title: "Policy changes", body: "We may revise this policy when the service or data practices change. The date above identifies the current version." },
      ],
    },
  },
  id: {
    updated: "Diperbarui 9 Oktober 2026",
    back: "Kembali ke halaman login",
    home: "Beranda",
    help: "Ada pertanyaan tentang dokumen ini atau datamu?",
    contact: "Kirim email ke tim Nourish",
    termsLink: "Syarat Layanan",
    privacyLink: "Kebijakan Privasi",
    terms: {
      eyebrow: "GUNAKAN NOURISH DENGAN YAKIN",
      title: "Syarat Layanan",
      intro: "Syarat ini menjelaskan penggunaan Nourish untuk mencatat makanan, berat badan, dan target gizi. Bacalah sebelum membuat akun atau melanjutkan dengan Google.",
      sections: [
        { title: "Siapa yang dapat menggunakan Nourish", body: "Fitur profil dan target gizi Nourish ditujukan bagi orang berusia minimal 18 tahun. Kamu masuk dengan Google. Jaga keamanan akun Google dan isi data dengan benar saat menggunakan layanan." },
        { title: "Informasi gizi", body: "Target, jumlah kalori, dan hasil analisis makanan oleh AI adalah perkiraan. Foto tidak selalu menunjukkan bahan atau porsi secara tepat, sehingga hasilnya bisa keliru. Periksa dan ubah perkiraan sebelum menyimpan. Nourish bukan layanan nasihat, diagnosis, atau perawatan medis; konsultasikan keputusan kesehatan dengan tenaga kesehatan yang kompeten." },
        { title: "Kontenmu", body: "Foto makanan, deskripsi, dan informasi lain yang kamu masukkan tetap milikmu. Kamu mengizinkan Nourish menyimpan dan memprosesnya untuk menjalankan layanan, termasuk mengirim analisis makanan opsional ke penyedia AI. Deskripsi dan nilai gizi hidangan yang sudah kamu konfirmasi dapat menjadi referensi bagi analisis pengguna lain; identitas akun tidak disertakan dalam referensi tersebut." },
        { title: "Penggunaan layanan", body: "Unggah hanya konten yang boleh kamu gunakan. Jangan menyalahgunakan Nourish, mencoba mengakses akun orang lain, atau mengganggu layanan. Analisis AI dapat terlambat atau tidak tersedia; kamu tetap bisa mencatat makanan secara manual." },
        { title: "Akun dan catatanmu", body: "Kamu dapat mengubah atau menghapus catatan makanan dan berat badan, mengganti foto profil, serta menghapus akun melalui Pengaturan. Penghapusan akun menghapus data aktif dan gambar yang tersimpan. Cadangan sementara atau data pada penyedia layanan mungkin bertahan lebih lama sesuai aturan penyimpanannya." },
        { title: "Perubahan syarat", body: "Kami dapat memperbarui Nourish dan syarat ini. Tanggal di atas menunjukkan versi yang berlaku. Jika kamu tidak setuju dengan syarat terbaru, hentikan penggunaan layanan dan hapus akunmu." },
      ],
    },
    privacy: {
      eyebrow: "PENJELASAN JELAS TENTANG DATAMU",
      title: "Kebijakan Privasi",
      intro: "Nourish menggunakan datamu untuk masuk ke akun, menghitung target gizi, dan membantu meninjau makanan. Kebijakan ini menjelaskan data yang diproses dan cara menghapusnya.",
      sections: [
        { title: "Data yang kami kumpulkan", body: "Saat masuk dengan Google, kami menerima ID akun Google, nama, alamat email, dan foto profilmu. Kamu dapat menambahkan tanggal lahir, jenis kelamin untuk perhitungan, tinggi, berat, bentuk tubuh, perkiraan aktivitas, tujuan, detail makanan, foto, dan nilai gizi. Sistem hosting dan API juga dapat mencatat data teknis seperti alamat IP dan log kesalahan. Data akun telepon lama tetap tersimpan sampai akun itu dihapus." },
        { title: "Cara data digunakan", body: "Data akun dipakai untuk login dan bantuan, data profil untuk memperkirakan target harian yang dapat diubah, serta catatan makanan dan berat untuk menampilkan riwayat dan progres. Data teknis membantu menjalankan dan melindungi layanan. Kata sandi Google tidak pernah dikirim ke Nourish." },
        { title: "Foto profil Google", body: "Saat pertama masuk dengan Google, Nourish dapat menyimpan salinan foto profil Google di penyimpanan privat. Setelah itu foto disajikan dari Nourish dan dapat kamu ganti di profil. Kami tidak meminta akses ke Google Drive, kontak, atau konten akun Google lainnya." },
        { title: "Analisis makanan AI yang opsional", body: "Akun biasa dapat memulai hingga 7 analisis makanan baru per hari, dengan jatah diperbarui pukul 00.00 WIB, dan mengulang analisis tiap makanan hingga 2 kali. Jumlah permintaan disimpan sampai akun dihapus, meski draf dibuang. Saat meminta analisis, Nourish mengirim foto atau deskripsi makananmu ke 9router dan penyedia AI di baliknya. Detail hidangan yang sudah dikonfirmasi pengguna lain dapat dikirim sebagai referensi tanpa identitas akun. Tanggal lahir dan profilmu tidak dikirim ke model. Pemrosesan dan penyimpanan oleh penyedia mengikuti kebijakan mereka. Kamu tetap bisa mencatat makanan secara manual." },
        { title: "Penyimpanan dan lama penyimpanan", body: "Foto makanan diubah menjadi JPEG sehingga metadata bawaan dihapus sebelum analisis, lalu disimpan secara privat selama draf tersedia. Foto dan hasil draf kedaluwarsa setelah sekitar 24 jam atau lebih cepat saat kamu mengambil ulang foto atau mengonfirmasi makanan. Thumbnail kecil disimpan bersama makanan berfoto sampai catatan itu dihapus. Foto profil dan catatan yang disimpan bertahan sampai kamu mengubah atau menghapusnya; cadangan dan log operasional dapat bertahan lebih lama untuk pemulihan dan keamanan." },
        { title: "Cookie, pembagian data, dan keamanan", body: "Nourish memakai cookie sesi dan CSRF untuk login, cookie untuk mengingat bahwa pengenalan aplikasi telah selesai, serta penyimpanan browser untuk bahasa dan tema. Penyedia hosting memproses data yang diperlukan untuk menjalankan aplikasi. Catatan akun dan foto diakses melalui API yang memerlukan login. Nourish tidak menjual data pribadimu." },
        { title: "Pilihanmu", body: "Kamu dapat memperbaiki profil dan makanan tersimpan, menghapus catatan, atau menghapus akun melalui Pengaturan. Penghapusan akun menghapus data aktif dan gambar yang tersimpan. Untuk permintaan akses, perbaikan, penghapusan, atau pertanyaan privasi, hubungi Nourish melalui alamat di bawah." },
        { title: "Perubahan kebijakan", body: "Kami dapat memperbarui kebijakan ini saat layanan atau cara pengolahan data berubah. Tanggal di atas menunjukkan versi yang berlaku." },
      ],
    },
  },
} as const;

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const language = useLanguage();
  const text = copy[language];
  const document = text[kind];
  const other = kind === "terms" ? "privacy" : "terms";

  return (
    <div className="min-h-svh bg-canvas text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <Brand ariaLabel={text.home} />
        <div className="flex items-center gap-2"><LanguageToggle /><ThemeToggle /></div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <div className="rounded-[2rem] bg-[linear-gradient(145deg,#006199,#004773)] px-6 py-9 text-white sm:px-10 sm:py-12">
          <p className="text-[.7rem] font-extrabold tracking-[.17em] text-brand-lemon">{document.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.5rem,7vw,4.5rem)] leading-tight font-extrabold tracking-[-.07em]">{document.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#dbf3ff] sm:text-base">{document.intro}</p>
          <p className="mt-5 text-xs font-bold text-brand-lemon">{text.updated}</p>
        </div>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="divide-y divide-line rounded-[1.5rem] border border-line bg-surface px-6 shadow-[0_10px_28px_rgba(20,51,69,.08)] sm:px-9">
            {document.sections.map((section) => <section className="py-7" key={section.title}>
              <h2 className="text-lg font-extrabold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted sm:text-[.95rem]">{section.body}</p>
            </section>)}
          </article>
          <aside className="rounded-[1.5rem] border border-line bg-surface p-6 text-sm shadow-[0_10px_28px_rgba(20,51,69,.08)] lg:sticky lg:top-6">
            <Link className="font-extrabold text-primary underline underline-offset-4" href={other === "terms" ? "/terms" : "/privacy"}>{other === "terms" ? text.termsLink : text.privacyLink}</Link>
            <p className="mt-6 leading-6 text-muted">{text.help}</p>
            <a className="mt-2 inline-block break-all font-bold text-primary underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <Link className="mt-8 block font-bold text-primary underline underline-offset-4" href="/login">← {text.back}</Link>
          </aside>
        </div>
      </main>
      <footer className="mx-auto flex max-w-5xl flex-wrap gap-x-5 gap-y-2 border-t border-line px-5 py-6 text-xs font-bold text-muted sm:px-8">
        <Link href="/">{text.home}</Link><Link href="/terms">{text.termsLink}</Link><Link href="/privacy">{text.privacyLink}</Link><a href={`mailto:${contactEmail}`}>{text.contact}</a>
      </footer>
    </div>
  );
}
