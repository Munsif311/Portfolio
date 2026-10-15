"use client";

import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Image as ImageIcon,
  Linkedin,
  Mail,
} from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { PortfolioData } from "@/lib/portfolio";
import { getFileUrl } from "@/lib/media";

export function PortfolioClient({ portfolio }: { portfolio: PortfolioData }) {
  const mainRef = useRef<HTMLElement>(null);
  const featuredProjects = portfolio.projects.filter((project) => project.featured && project.published);
  const publicCertifications = portfolio.certifications.filter((cert) => cert.public !== false);
  const experience = portfolio.experience.filter((entry) => entry.published !== false);
  const publicDocuments = (portfolio.documents ?? []).filter(
    (document) => document.public || document.visibility === "public" || document.visibility === "download",
  );
  const publicAchievements = (portfolio.achievements ?? []).filter((achievement) => achievement.public !== false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      return;
    }

    const sections = mainRef.current?.querySelectorAll<HTMLElement>("section, footer");
    if (!sections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    sections.forEach((section) => {
      section.classList.add("motion-reveal");
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main ref={mainRef} className="portfolio-shell min-h-screen bg-dark text-white selection:bg-accentPurple selection:text-white">
      <div className="ambient-glow ambient-glow-one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-two" aria-hidden="true" />
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-dark/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold gradient-text">
            My Portfolio
          </Link>
          <div className="hidden gap-6 text-sm font-medium md:flex">
            <a href="#about" className="transition-colors hover:text-accentBlue">About</a>
            <a href="#skills" className="transition-colors hover:text-accentBlue">Skills</a>
            <a href="#projects" className="transition-colors hover:text-accentBlue">Projects</a>
            <a href="#experience" className="transition-colors hover:text-accentBlue">Experience</a>
            <a href="#certifications" className="transition-colors hover:text-accentBlue">Certifications</a>
            <a href="#education" className="transition-colors hover:text-accentBlue">Education</a>
            <a href="#documents" className="transition-colors hover:text-accentBlue">Documents</a>
            <a href="#contact" className="transition-colors hover:text-accentBlue">Contact</a>
          </div>
        </div>
      </nav>

      <section className="hero-section relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-12 overflow-hidden px-6 pb-24 pt-36 md:flex-row">
        <div className="hero-grid" aria-hidden="true" />
        <div className="relative z-10 flex-1 space-y-6">
          <h2 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-accentBlue">
            <span className="h-px w-8 bg-accentBlue" />
            Hello, I&apos;m
          </h2>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.04] tracking-[-0.055em] md:text-7xl">
            <span className="gradient-text">{portfolio.profile.name}</span>
          </h1>
          <h3 className="text-2xl font-medium leading-snug text-slate-200 md:text-3xl">
            {portfolio.profile.title}
          </h3>
          <p className="max-w-xl text-base leading-8 text-slate-400 md:text-lg">
            {portfolio.profile.tagline}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href={getFileUrl(portfolio.profile.resumeUrl)}
              download
              className="primary-button flex items-center gap-2 rounded-full bg-accentBlue px-6 py-3 font-bold text-dark transition-all duration-300 hover:bg-accentPurple"
            >
              <Download size={20} /> Download CV
            </a>
            <a
              href={`mailto:${portfolio.profile.email}`}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 transition-all duration-300 hover:border-accentBlue/70 hover:bg-white/[0.07]"
            >
              <Mail size={20} /> Contact Me
            </a>
          </div>
          <div className="flex gap-4 pt-4">
            <a href={portfolio.profile.github} target="_blank" rel="noreferrer" className="p-2 transition-colors hover:text-accentBlue">
              <Github size={24} />
            </a>
            <a href={portfolio.profile.linkedin} target="_blank" rel="noreferrer" className="p-2 transition-colors hover:text-accentBlue">
              <Linkedin size={24} />
            </a>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 justify-center">
          <div className="portrait-frame">
            <img src={getFileUrl(portfolio.profile.image)} alt={portfolio.profile.name} fetchPriority="high" decoding="async" className="portrait-image h-full w-full rounded-full border-4 border-dark object-cover" />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="mb-8 text-4xl font-bold">
          About <span className="gradient-text">Me</span>
        </h2>
        <p className="text-lg leading-relaxed text-gray-400">
          {portfolio.profile.summary}
        </p>
      </section>

      <section id="skills" className="bg-darker px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold">
            Technical <span className="gradient-text">Skills</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(
              portfolio.skills.reduce<Record<string, string[]>>((groups, skill) => {
                groups[skill.category] = groups[skill.category] ?? [];
                groups[skill.category].push(skill.name);
                return groups;
              }, {}),
            ).map(([category, skills], idx) => (
              <div
                key={category}
                className="glass-card transition-colors duration-300 hover:border-accentBlue/50"
              >
                <h3 className="mb-4 text-xl font-bold text-accentPurple">{category}</h3>
                <ul className="space-y-2 text-gray-300">
                  {skills.map((skill) => (
                    <li key={skill} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accentBlue" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Featured <span className="gradient-text">Projects</span>
        </h2>
        <div className="space-y-20">
          {featuredProjects.map((project, index) => (
            <div
              key={project.id}
              className={`flex flex-col items-center gap-10 lg:flex-row ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
            >
              <div className="group w-full overflow-hidden rounded-2xl border border-white/10 lg:w-1/2">
                <img src={getFileUrl(project.image)} alt={project.title} loading="lazy" decoding="async" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="w-full space-y-6 lg:w-1/2">
                <h3 className="text-3xl font-bold">{project.title}</h3>
                <p className="text-lg leading-relaxed text-gray-400">{project.shortDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech) => (
                    <span key={tech} className="rounded-full bg-accentBlue/10 px-3 py-1 text-sm font-medium text-accentBlue">
                      {tech}
                    </span>
                  ))}
                </div>
                <Link href={`/projects/${project.slug}`} className="inline-flex items-center gap-2 font-medium text-accentPurple transition-colors hover:text-accentBlue">
                  View project <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="experience" className="bg-darker px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-4xl font-bold">
            Professional <span className="gradient-text">Experience</span>
          </h2>
          <div className="space-y-8">
            {experience.map((job, idx) => (
              <div
                key={job.id}
                className="glass-card flex flex-col justify-between gap-4 md:flex-row"
              >
                <div>
                  <div className="mb-2 flex items-center gap-2 text-accentBlue">
                    <Briefcase size={16} />
                    <span className="text-sm uppercase tracking-[0.2em]">{job.employmentType ?? "Experience"}</span>
                  </div>
                  <h3 className="text-xl font-bold text-accentBlue">{job.role}</h3>
                  <p className="font-medium text-white">{job.company}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">{job.description}</p>
                  {job.highlights && job.highlights.length > 0 ? (
                    <ul className="mt-4 space-y-2 text-sm text-gray-300">
                      {job.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accentBlue" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {job.supportLetterUrl ? (
                    <a href={getFileUrl(job.supportLetterUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-accentBlue hover:text-accentPurple">
                      View experience letter <ExternalLink size={14} />
                    </a>
                  ) : null}
                </div>
                <div className="text-sm font-medium text-accentPurple md:whitespace-nowrap">{job.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="certifications" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Certifications <span className="gradient-text">& Learning</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {publicCertifications.map((cert) => (
            <div key={cert.id} className="glass-card border border-accentBlue/20">
              <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {cert.image ? (
                  <img src={getFileUrl(cert.image)} alt={cert.title} loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-white/5 text-accentBlue">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <p className="mb-3 text-sm uppercase tracking-wider text-accentBlue">{cert.issuer}</p>
              <h3 className="mb-2 text-xl font-bold">{cert.title}</h3>
              <p className="text-sm text-gray-400">{cert.issueDate}{cert.expirationDate ? ` – ${cert.expirationDate}` : ""}</p>
              {cert.description ? <p className="mt-4 text-gray-300">{cert.description}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                {cert.verificationUrl ? (
                  <a href={cert.verificationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-accentBlue hover:border-accentBlue">
                    Verify <ExternalLink size={12} />
                  </a>
                ) : null}
                {cert.pdfUrl ? (
                  <a href={getFileUrl(cert.pdfUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:border-accentPurple">
                    Download <Download size={12} />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="education" className="bg-darker px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold">
            Education <span className="gradient-text">& Credentials</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {portfolio.education.filter((item) => item.public !== false).map((item) => (
              <div key={item.id} className="glass-card">
                <div className="mb-3 flex items-center gap-2 text-accentBlue">
                  <GraduationCap size={18} />
                  <span className="text-xs uppercase tracking-[0.2em]">{item.category ?? "Academic"}</span>
                </div>
                <p className="text-sm font-semibold uppercase tracking-wider text-accentBlue">{item.period ?? `${item.startDate ?? ""} ${item.endDate ? `– ${item.endDate}` : ""}`}</p>
                <h3 className="mt-2 text-2xl font-bold">{item.degree || item.title || "Academic Qualification"}</h3>
                <p className="mt-2 text-gray-300">{item.school}</p>
                {item.grade ? <p className="mt-3 text-accentPurple">{item.grade}</p> : null}
                <p className="mt-4 text-gray-400">{item.description ?? item.details}</p>
                {item.verificationUrl ? (
                  <a href={item.verificationUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-accentBlue hover:text-accentPurple">
                    Verification link <ExternalLink size={14} />
                  </a>
                ) : null}
                {item.documentUrl ? (
                  <a href={getFileUrl(item.documentUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-accentBlue hover:text-accentPurple">
                    Academic certificate <Download size={14} />
                  </a>
                ) : null}
                {item.transcriptUrl ? (
                  <a href={getFileUrl(item.transcriptUrl)} target="_blank" rel="noreferrer" className="ml-4 mt-4 inline-flex items-center gap-2 text-accentBlue hover:text-accentPurple">
                    Transcript / marksheet <Download size={14} />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="achievements" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Achievements <span className="gradient-text">& Recognition</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {publicAchievements.map((achievement) => (
            <div key={achievement.id} className="glass-card">
              <div className="mb-3 flex items-center gap-2 text-accentBlue">
                <Award size={16} />
                <span className="text-xs uppercase tracking-[0.2em]">{achievement.category}</span>
              </div>
              <h3 className="text-xl font-bold">{achievement.title}</h3>
              <p className="mt-3 text-sm text-gray-400">{achievement.date}</p>
              <p className="mt-4 text-gray-300">{achievement.description}</p>
              {achievement.image ? <img src={getFileUrl(achievement.image)} alt={achievement.title} loading="lazy" decoding="async" className="mt-5 h-36 w-full rounded-xl object-cover" /> : null}
              {achievement.verificationUrl ? (
                <a href={achievement.verificationUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-accentBlue hover:text-accentPurple">
                  View verification <ExternalLink size={14} />
                </a>
              ) : null}
              {achievement.documentUrl ? (
                <a href={getFileUrl(achievement.documentUrl)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-accentBlue hover:text-accentPurple">
                  View award document <Download size={14} />
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section id="documents" className="bg-darker px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold">
            Professional <span className="gradient-text">Documents</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicDocuments.map((document) => (
              <div key={document.id} className="glass-card">
                <div className="mb-3 flex items-center gap-2 text-accentBlue">
                  <FileText size={16} />
                  <span className="text-xs uppercase tracking-[0.2em]">{document.category}</span>
                </div>
                <h3 className="text-xl font-bold">{document.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{document.date}</p>
                <p className="mt-4 text-gray-300">{document.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {document.url ? (
                    <a href={getFileUrl(document.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-accentBlue hover:border-accentBlue">
                      Open <ExternalLink size={12} />
                    </a>
                  ) : null}
                  {document.downloadUrl ? (
                    <a href={getFileUrl(document.downloadUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-200 hover:border-accentPurple">
                      Download <Download size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-4xl font-bold">
          Recent <span className="gradient-text">Insights</span>
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {(portfolio.blogPosts ?? []).filter((post) => post.published).slice(0, 2).map((post) => (
            <article key={post.id} className="glass-card">
              <div className="mb-3 flex items-center gap-2 text-accentBlue">
                <BookOpen size={16} />
                <span className="text-xs uppercase tracking-[0.2em]">Blog</span>
              </div>
              <h3 className="text-xl font-bold">{post.title}</h3>
              {post.coverImage ? <img src={getFileUrl(post.coverImage)} alt={post.title} loading="lazy" decoding="async" className="mt-4 h-40 w-full rounded-xl object-cover" /> : null}
              <p className="mt-2 text-sm text-gray-400">{post.date}</p>
              <p className="mt-4 text-gray-300">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-20">
        <div className="glass-card grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm uppercase tracking-wider text-accentBlue">Contact</p>
            <h2 className="mb-4 text-4xl font-bold">Let&apos;s build something meaningful.</h2>
            <p className="leading-relaxed text-gray-400">
              I&apos;m open to AI engineering, machine learning, and data-driven product opportunities.
            </p>
          </div>
          <div className="space-y-4 text-gray-300">
            <a href={`mailto:${portfolio.profile.email}`} className="flex items-center gap-3 transition-colors hover:text-accentBlue">
              <Mail size={18} /> {portfolio.profile.email}
            </a>
            <a href={portfolio.profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition-colors hover:text-accentBlue">
              <Github size={18} /> GitHub
            </a>
            <a href={portfolio.profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition-colors hover:text-accentBlue">
              <Linkedin size={18} /> LinkedIn
            </a>
            <a href={getFileUrl(portfolio.profile.resumeUrl)} className="flex items-center gap-3 transition-colors hover:text-accentBlue">
              <ExternalLink size={18} /> Resume
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-white/10 py-8 text-center text-gray-500">
        <p>© 2026 {portfolio.profile.name}. Built with Next.js & Tailwind CSS.</p>
      </footer>
    </main>
  );
}
