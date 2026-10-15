import Link from "next/link";
import { notFound } from "next/navigation";
import { getFileUrl } from "@/lib/media";
import { getPortfolioData } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const portfolio = await getPortfolioData();
  const project = portfolio.projects.find((item) => item.slug === params.slug);

  if (!project || !project.published) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-dark text-white">
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        <Link href="/" className="text-accentBlue hover:text-accentPurple transition-colors">
          ← Back to portfolio
        </Link>
      </header>

      <article className="mx-auto max-w-5xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <img src={getFileUrl(project.image)} alt={project.title} className="w-full object-cover aspect-[16/9]" />
        </div>
        {project.gallery.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {project.gallery.map((image, index) => (
              <img key={`${project.id}-gallery-${index}`} src={getFileUrl(image)} alt={`${project.title} screenshot ${index + 1}`} className="aspect-video w-full rounded-2xl object-cover" />
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accentBlue">{project.category}</p>
            <h1 className="mt-3 text-4xl font-bold">{project.title}</h1>
            <p className="mt-5 text-lg text-gray-300">{project.shortDescription}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tech.map((item) => (
                <span key={item} className="rounded-full bg-accentBlue/10 px-3 py-1 text-sm text-accentBlue">
                  {item}
                </span>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="text-2xl font-bold">Overview</h2>
              <p className="mt-3 text-gray-300 leading-relaxed">{project.description}</p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-bold">Problem</h2>
              <p className="mt-3 text-gray-300 leading-relaxed">{project.problem}</p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-bold">Solution</h2>
              <p className="mt-3 text-gray-300 leading-relaxed">{project.solution}</p>
            </section>

            {project.documents?.length ? (
              <section className="mt-10">
                <h2 className="text-2xl font-bold">Project files</h2>
                <ul className="mt-3 space-y-2">
                  {project.documents.filter((document) => document.public !== false).map((document) => (
                    <li key={document.id}>
                      <a href={getFileUrl(document.url)} target="_blank" rel="noreferrer" className="text-accentBlue hover:text-accentPurple">
                        {document.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-bold">Project Links</h3>
            <div className="mt-5 space-y-3 text-sm">
              {project.github ? (
                <a href={project.github} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 px-3 py-2 hover:border-accentBlue">
                  GitHub
                </a>
              ) : null}
              {project.demo ? (
                <a href={project.demo} target="_blank" rel="noreferrer" className="block rounded-xl border border-white/10 px-3 py-2 hover:border-accentBlue">
                  Live Demo
                </a>
              ) : null}
              {project.url ? (
                <Link href="/" className="block rounded-xl border border-white/10 px-3 py-2 hover:border-accentPurple">
                  Portfolio Home
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
