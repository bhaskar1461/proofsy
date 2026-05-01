import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplateDefinition, TEMPLATE_DEFINITIONS } from "@/lib/templates";

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: templateId } = await params;

  if (!templateId || !TEMPLATE_DEFINITIONS.some((template) => template.id === templateId)) {
    notFound();
  }

  const template = getTemplateDefinition(templateId);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-white/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Template Preview</p>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] mt-1">{template.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/templates" className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface-alt)]">
              Back to templates
            </Link>
            <Link href={`/events/new?template=${encodeURIComponent(template.id)}`} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)]">
              Use this template
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-[320px_1fr] gap-8">
        <aside className="bg-white rounded-2xl border border-[var(--color-border)] p-6 h-fit">
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">{template.desc}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {template.tags.map((tag) => (
              <span key={tag} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-surface-alt)] text-[var(--color-muted)]">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm text-[var(--color-muted)]">
            <p>Recommended for formal training, workshops, and participant certificates.</p>
            <p>Use this preview to approve the visual style before issuing credentials.</p>
          </div>
        </aside>

        <section className="bg-white rounded-3xl border border-[var(--color-border)] p-6 md:p-10">
          <div className={`rounded-[28px] border ${template.border} bg-gradient-to-br ${template.color} p-4 md:p-8 shadow-inner`}>
            <div className={`relative aspect-[1.414] bg-white rounded-[24px] border-2 ${template.accent} overflow-hidden flex items-center justify-center px-8 md:px-16`}>
              <div className="absolute inset-5 border border-[var(--color-border)] rounded-[20px]" />
              <div className="absolute top-0 left-0 w-40 h-40 bg-[var(--color-primary)] opacity-[0.05] rounded-br-[72px]" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-[var(--color-primary)] opacity-[0.05] rounded-tl-[72px]" />

              <div className="relative z-10 text-center max-w-3xl">
                <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[var(--color-muted)]">Proofsy</p>
                <h2 className="mt-4 text-3xl md:text-5xl font-bold text-[var(--color-foreground)]">Certificate of Completion</h2>
                <p className="mt-8 text-sm md:text-base text-[var(--color-muted)]">This certifies that</p>
                <h3 className="mt-4 text-3xl md:text-6xl font-bold text-[var(--color-primary)] leading-tight">Alexandra Morgan Lee</h3>
                <p className="mt-8 text-sm md:text-base text-[var(--color-muted)]">has successfully completed</p>
                <p className="mt-3 text-xl md:text-3xl font-semibold text-[var(--color-foreground)]">Enterprise Security Workshop 2026</p>

                <div className="mt-12 grid grid-cols-3 gap-4 items-end text-center">
                  <div>
                    <div className="border-t border-[var(--color-border)] pt-2 text-sm font-medium text-[var(--color-foreground)]">April 29, 2026</div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] mt-1">Date</p>
                  </div>
                  <div>
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] flex items-center justify-center text-[10px] font-mono text-[var(--color-muted)]">
                      QR
                    </div>
                    <p className="text-[10px] md:text-xs font-mono text-[var(--color-primary)] mt-2">CERT-SAMPLE</p>
                  </div>
                  <div>
                    <div className="border-t border-[var(--color-border)] pt-2 text-sm font-medium text-[var(--color-foreground)]">Proofsy Academy</div>
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-[var(--color-muted)] mt-1">Organizer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
