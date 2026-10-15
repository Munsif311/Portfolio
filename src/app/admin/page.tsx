"use client";

import { useEffect, useState, type FormEvent } from "react";
import type {
  Achievement,
  BlogPost,
  Certification,
  DocumentItem,
  EducationItem,
  PortfolioData,
  Project,
  Skill,
} from "@/lib/portfolio";
import { AdminFileUpload } from "@/components/admin-file-upload";

const emptyPortfolio: PortfolioData = {
  profile: {
    name: "",
    title: "",
    tagline: "",
    summary: "",
    email: "",
    github: "",
    linkedin: "",
    location: "",
    resumeUrl: "",
    image: "",
  },
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
  education: [],
  achievements: [],
  documents: [],
  blogPosts: [],
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
};

function TextField({ label, value, onChange, multiline = false }: TextFieldProps) {
  const className =
    "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accentBlue";

  return (
    <label className="block text-sm text-gray-300">
      {label}
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={className} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const [portfolio, setPortfolio] = useState<PortfolioData>(emptyPortfolio);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  async function reloadPortfolio() {
    try {
      const response = await fetch("/api/admin/portfolio", { cache: "no-store" });
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error(`Unable to load portfolio (${response.status}).`);

      const data = (await response.json()) as PortfolioData;
      setPortfolio({
        ...data,
        achievements: data.achievements ?? [],
        documents: data.documents ?? [],
        blogPosts: data.blogPosts ?? [],
      });
      setDirty(false);
      setIsAuthenticated(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load portfolio.");
      setMessageIsError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadPortfolio();
  }, []);

  function updatePortfolio(next: PortfolioData) {
    setPortfolio(next);
    setDirty(true);
    setMessage("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? "Login failed.");
      }
      await reloadPortfolio();
      setMessage("Signed in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
      setMessageIsError(true);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setPortfolio(emptyPortfolio);
    setDirty(false);
  }

  async function savePortfolio() {
    setSaving(true);
    setMessage("");
    setMessageIsError(false);

    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolio),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? `Save failed (${response.status}).`);
      }

      setDirty(false);
      setMessage("Saved. Reload the portfolio homepage to see your published changes.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save changes.");
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  function updateProject(id: string, changes: Partial<Project>) {
    updatePortfolio({
      ...portfolio,
      projects: portfolio.projects.map((project) =>
        project.id === id ? { ...project, ...changes } : project,
      ),
    });
  }

  function updateSkill(id: string, changes: Partial<Skill>) {
    updatePortfolio({
      ...portfolio,
      skills: portfolio.skills.map((skill) => (skill.id === id ? { ...skill, ...changes } : skill)),
    });
  }

  function updateExperience(id: string, changes: Partial<(typeof portfolio.experience)[number]>) {
    updatePortfolio({
      ...portfolio,
      experience: portfolio.experience.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    });
  }

  function updateCertification(id: string, changes: Partial<Certification>) {
    updatePortfolio({
      ...portfolio,
      certifications: portfolio.certifications.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  }

  function updateEducation(id: string, changes: Partial<EducationItem>) {
    updatePortfolio({
      ...portfolio,
      education: portfolio.education.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  }

  function updateAchievement(id: string, changes: Partial<Achievement>) {
    updatePortfolio({
      ...portfolio,
      achievements: (portfolio.achievements ?? []).map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  }

  function updateDocument(id: string, changes: Partial<DocumentItem>) {
    updatePortfolio({
      ...portfolio,
      documents: portfolio.documents.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });
  }

  function addProject() {
    const id = `project-${Date.now()}`;
    const project: Project = {
      id,
      slug: id,
      title: "New project",
      shortDescription: "",
      description: "",
      problem: "",
      solution: "",
      category: "AI",
      tech: [],
      image: "/Munsif.png",
      gallery: [],
      featured: false,
      published: false,
    };
    updatePortfolio({ ...portfolio, projects: [project, ...portfolio.projects] });
  }

  function addSkill() {
    const skill: Skill = {
      id: `skill-${Date.now()}`,
      name: "New skill",
      category: "General",
      description: "",
      featured: false,
    };
    updatePortfolio({ ...portfolio, skills: [skill, ...portfolio.skills] });
  }

  function addExperience() {
    const id = `experience-${Date.now()}`;
    const experience = {
      id,
      role: "New role",
      company: "Organization",
      duration: "Present",
      description: "",
      published: true,
      location: "Remote",
      employmentType: "Full-time",
      technologies: [],
    };
    updatePortfolio({ ...portfolio, experience: [experience, ...portfolio.experience] });
  }

  function addCertification() {
    const id = `cert-${Date.now()}`;
    const certification: Certification = {
      id,
      title: "New certificate",
      issuer: "",
      issueDate: "2026",
      description: "",
      image: "/Munsif.png",
      public: true,
      featured: false,
      skills: [],
      category: "Professional",
    };
    updatePortfolio({ ...portfolio, certifications: [certification, ...portfolio.certifications] });
  }

  function addEducation() {
    const id = `education-${Date.now()}`;
    const education: EducationItem = {
      id,
      degree: "New qualification",
      school: "Institution",
      period: "2024 – 2028",
      description: "",
      public: true,
      category: "Degree",
    };
    updatePortfolio({ ...portfolio, education: [education, ...portfolio.education] });
  }

  function addAchievement() {
    const id = `achievement-${Date.now()}`;
    const achievement: Achievement = {
      id,
      title: "New achievement",
      description: "",
      date: "2026",
      issuer: "",
      category: "Recognition",
      public: true,
    };
    updatePortfolio({
      ...portfolio,
      achievements: [achievement, ...(portfolio.achievements ?? [])],
    });
  }

  function addDocument() {
    const id = `doc-${Date.now()}`;
    const document: DocumentItem = {
      id,
      title: "New document",
      issuer: "",
      category: "Resume",
      public: false,
      visibility: "private",
      url: "",
      date: "2026",
      description: "",
      fileType: "pdf",
    };
    updatePortfolio({ ...portfolio, documents: [document, ...portfolio.documents] });
  }

  function updateBlogPost(id: string, changes: Partial<BlogPost>) {
    updatePortfolio({
      ...portfolio,
      blogPosts: portfolio.blogPosts.map((post) => (post.id === id ? { ...post, ...changes } : post)),
    });
  }

  function addBlogPost() {
    const id = `post-${Date.now()}`;
    const post: BlogPost = {
      id,
      title: "New post",
      excerpt: "",
      slug: id,
      published: false,
      date: new Date().toISOString().slice(0, 10),
    };
    updatePortfolio({ ...portfolio, blogPosts: [post, ...portfolio.blogPosts] });
  }

  const sectionButtons = [
    { id: "profile", label: "Profile" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "certifications", label: "Certificates" },
    { id: "education", label: "Education" },
    { id: "achievements", label: "Achievements" },
    { id: "documents", label: "Documents" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-dark p-8 text-white" aria-live="polite">
        Loading admin dashboard...
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-dark px-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-accentBlue">Admin access</p>
          <h1 className="mt-3 text-3xl font-bold">Portfolio dashboard</h1>
          <div className="mt-6 space-y-4">
            <TextField
              label="Username"
              value={loginForm.username}
              onChange={(username) => setLoginForm({ ...loginForm, username })}
            />
            <label className="block text-sm text-gray-300">
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accentBlue"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-accentBlue px-4 py-3 font-bold text-dark hover:bg-accentPurple"
          >
            Sign in
          </button>
          {message ? (
            <p className={`mt-4 text-sm ${messageIsError ? "text-red-300" : "text-accentBlue"}`} role="status">
              {message}
            </p>
          ) : null}
        </form>
      </main>
    );
  }

  const publishedProjects = portfolio.projects.filter((project) => project.published).length;

  return (
    <main className="min-h-screen bg-dark px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-accentBlue">Dashboard</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Portfolio content</h1>
            <p className="mt-2 text-sm text-gray-400">
              Edit content, then save. Only published projects appear on the public portfolio.
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-accentBlue">
              View portfolio
            </a>
            <button onClick={handleLogout} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:border-accentBlue">
              Logout
            </button>
          </div>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="font-medium">{dirty ? "Unsaved changes" : "All changes saved"}</p>
            <p className="text-sm text-gray-400">
              {portfolio.projects.length} projects ({publishedProjects} published) · {portfolio.skills.length} skills
            </p>
          </div>
          <button
            onClick={() => void savePortfolio()}
            disabled={saving || !dirty}
            className="rounded-full bg-accentBlue px-6 py-2 font-bold text-dark transition-colors hover:bg-accentPurple disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {message ? (
          <p className={`mb-6 text-sm ${messageIsError ? "text-red-300" : "text-accentBlue"}`} role="status">
            {message}
          </p>
        ) : null}

        <section className="glass-card mb-8">
          <h2 className="mb-5 text-2xl font-bold">Profile</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Name" value={portfolio.profile.name} onChange={(name) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, name } })} />
            <TextField label="Title" value={portfolio.profile.title} onChange={(title) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, title } })} />
            <TextField label="Email" value={portfolio.profile.email} onChange={(email) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, email } })} />
            <TextField label="Location" value={portfolio.profile.location} onChange={(location) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, location } })} />
            <TextField label="GitHub URL" value={portfolio.profile.github} onChange={(github) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, github } })} />
            <TextField label="LinkedIn URL" value={portfolio.profile.linkedin} onChange={(linkedin) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, linkedin } })} />
            <AdminFileUpload label="Profile photograph" kind="image" value={portfolio.profile.image} onChange={(image) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, image: image ?? "" } })} />
            <AdminFileUpload label="Resume / CV" kind="pdf" value={portfolio.profile.resumeUrl} onChange={(resumeUrl) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, resumeUrl: resumeUrl ?? "" } })} />
            <div className="md:col-span-2">
              <TextField label="Tagline" value={portfolio.profile.tagline} onChange={(tagline) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, tagline } })} />
            </div>
            <div className="md:col-span-2">
              <TextField label="About / summary" value={portfolio.profile.summary} multiline onChange={(summary) => updatePortfolio({ ...portfolio, profile: { ...portfolio.profile, summary } })} />
            </div>
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Projects</h2>
            <button onClick={addProject} className="rounded-full bg-accentBlue px-4 py-2 text-sm font-bold text-dark">
              Add project
            </button>
          </div>
          <div className="space-y-6">
            {portfolio.projects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{project.title || "Untitled project"}</h3>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={project.published} onChange={(event) => updateProject(project.id, { published: event.target.checked })} />
                      Published
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={project.featured} onChange={(event) => updateProject(project.id, { featured: event.target.checked })} />
                      Featured
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                          updatePortfolio({ ...portfolio, projects: portfolio.projects.filter((item) => item.id !== project.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" value={project.title} onChange={(title) => updateProject(project.id, { title })} />
                  <TextField label="Slug (URL)" value={project.slug} onChange={(slug) => updateProject(project.id, { slug })} />
                  <TextField label="Category" value={project.category} onChange={(category) => updateProject(project.id, { category })} />
                  <AdminFileUpload label="Project cover image" kind="image" value={project.image} onChange={(image) => { if (image) updateProject(project.id, { image }); else updateProject(project.id, { image: "" }); }} />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-300">Project screenshots / gallery</p>
                    <AdminFileUpload label="Add gallery image" kind="image" onChange={(image) => { if (image) updateProject(project.id, { gallery: [...project.gallery, image] }); }} />
                    {project.gallery.map((image, index) => (
                      <div key={`${project.id}-gallery-${index}`} className="flex items-center gap-3">
                        <img src={typeof image === "string" ? image : image.url} alt={`Project gallery ${index + 1}`} className="h-12 w-16 rounded object-cover" />
                        <button type="button" onClick={() => updateProject(project.id, { gallery: project.gallery.filter((_, imageIndex) => imageIndex !== index) })} className="text-xs text-red-300">Remove screenshot</button>
                      </div>
                    ))}
                  </div>
                  <TextField label="Technology stack (comma-separated)" value={project.tech.join(", ")} onChange={(value) => updateProject(project.id, { tech: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
                  <TextField label="GitHub URL" value={project.github ?? ""} onChange={(github) => updateProject(project.id, { github })} />
                  <TextField label="Live demo URL" value={project.demo ?? ""} onChange={(demo) => updateProject(project.id, { demo })} />
                  <TextField label="Short description" value={project.shortDescription} onChange={(shortDescription) => updateProject(project.id, { shortDescription })} />
                  <div className="md:col-span-2">
                    <TextField label="Project overview" value={project.description} multiline onChange={(description) => updateProject(project.id, { description })} />
                  </div>
                  <TextField label="Problem" value={project.problem} multiline onChange={(problem) => updateProject(project.id, { problem })} />
                  <TextField label="Solution" value={project.solution} multiline onChange={(solution) => updateProject(project.id, { solution })} />
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-300">Project proposals, reports and archives</p>
                      <button type="button" onClick={() => updateProject(project.id, { documents: [...(project.documents ?? []), { id: `project-file-${Date.now()}`, title: "Supporting file", type: "document", url: "" }] })} className="text-sm text-accentBlue">Add file</button>
                    </div>
                    {(project.documents ?? []).map((document, index) => (
                      <div key={document.id} className="grid gap-3 rounded-xl border border-white/10 p-3 md:grid-cols-2">
                        <TextField label="File title" value={document.title} onChange={(title) => updateProject(project.id, { documents: project.documents?.map((item, itemIndex) => itemIndex === index ? { ...item, title } : item) })} />
                        <label className="block text-sm text-gray-300">
                          File type
                          <select value={document.type} onChange={(event) => updateProject(project.id, { documents: project.documents?.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item) })} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-accentBlue">
                            <option value="document">PDF / Word document</option>
                            <option value="archive">ZIP archive</option>
                          </select>
                        </label>
                        <AdminFileUpload label={document.type === "archive" ? "Project ZIP archive" : "Project PDF or document"} kind={document.type === "archive" ? "archive" : "document"} value={document.url} onChange={(url) => updateProject(project.id, { documents: project.documents?.map((item, itemIndex) => itemIndex === index ? { ...item, url: url ?? "" } : item) })} />
                        <button type="button" onClick={() => updateProject(project.id, { documents: project.documents?.filter((_, itemIndex) => itemIndex !== index) })} className="text-left text-xs text-red-300">Remove file</button>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Skills</h2>
            <button onClick={addSkill} className="rounded-full bg-accentPurple px-4 py-2 text-sm font-bold">
              Add skill
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {portfolio.skills.map((skill) => (
              <article key={skill.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete skill "${skill.name}"?`)) {
                        updatePortfolio({ ...portfolio, skills: portfolio.skills.filter((item) => item.id !== skill.id) });
                      }
                    }}
                    className="text-sm text-red-300 hover:text-red-200"
                  >
                    Delete
                  </button>
                </div>
                <div className="space-y-3">
                  <TextField label="Name" value={skill.name} onChange={(name) => updateSkill(skill.id, { name })} />
                  <TextField label="Category" value={skill.category} onChange={(category) => updateSkill(skill.id, { category })} />
                  <TextField label="Description" value={skill.description} onChange={(description) => updateSkill(skill.id, { description })} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Experience</h2>
            <button onClick={addExperience} className="rounded-full bg-accentBlue px-4 py-2 text-sm font-bold text-dark">
              Add entry
            </button>
          </div>
          <div className="space-y-6">
            {portfolio.experience.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{entry.role || "Untitled experience"}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={entry.published !== false} onChange={(event) => updateExperience(entry.id, { published: event.target.checked })} />
                      Published
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete experience entry "${entry.role}"?`)) {
                          updatePortfolio({ ...portfolio, experience: portfolio.experience.filter((item) => item.id !== entry.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Role" value={entry.role} onChange={(role) => updateExperience(entry.id, { role })} />
                  <TextField label="Company" value={entry.company} onChange={(company) => updateExperience(entry.id, { company })} />
                  <TextField label="Location" value={entry.location ?? ""} onChange={(location) => updateExperience(entry.id, { location })} />
                  <TextField label="Employment type" value={entry.employmentType ?? ""} onChange={(employmentType) => updateExperience(entry.id, { employmentType })} />
                  <TextField label="Duration" value={entry.duration} onChange={(duration) => updateExperience(entry.id, { duration })} />
                  <TextField label="Website" value={entry.website ?? ""} onChange={(website) => updateExperience(entry.id, { website })} />
                  <div className="md:col-span-2">
                    <TextField label="Description" value={entry.description} multiline onChange={(description) => updateExperience(entry.id, { description })} />
                    <AdminFileUpload label="Experience / internship letter" kind="pdf" value={entry.supportLetterUrl} onChange={(supportLetterUrl) => updateExperience(entry.id, { supportLetterUrl })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Certifications</h2>
            <button onClick={addCertification} className="rounded-full bg-accentBlue px-4 py-2 text-sm font-bold text-dark">
              Add certificate
            </button>
          </div>
          <div className="space-y-6">
            {portfolio.certifications.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title || "New certificate"}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={item.public !== false} onChange={(event) => updateCertification(item.id, { public: event.target.checked })} />
                      Public
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete certificate "${item.title}"?`)) {
                          updatePortfolio({ ...portfolio, certifications: portfolio.certifications.filter((cert) => cert.id !== item.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" value={item.title} onChange={(title) => updateCertification(item.id, { title })} />
                  <TextField label="Issuer" value={item.issuer} onChange={(issuer) => updateCertification(item.id, { issuer })} />
                  <TextField label="Issue date" value={item.issueDate} onChange={(issueDate) => updateCertification(item.id, { issueDate })} />
                  <TextField label="Expiration date" value={item.expirationDate ?? ""} onChange={(expirationDate) => updateCertification(item.id, { expirationDate })} />
                  <TextField label="Verification URL" value={item.verificationUrl ?? ""} onChange={(verificationUrl) => updateCertification(item.id, { verificationUrl })} />
                  <AdminFileUpload label="Certificate image" kind="image" value={item.image} onChange={(image) => updateCertification(item.id, { image })} />
                  <AdminFileUpload label="Certificate PDF" kind="pdf" value={item.pdfUrl} onChange={(pdfUrl) => updateCertification(item.id, { pdfUrl })} />
                  <TextField label="Category" value={item.category ?? ""} onChange={(category) => updateCertification(item.id, { category })} />
                  <div className="md:col-span-2">
                    <TextField label="Description" value={item.description ?? ""} multiline onChange={(description) => updateCertification(item.id, { description })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Education</h2>
            <button onClick={addEducation} className="rounded-full bg-accentPurple px-4 py-2 text-sm font-bold">
              Add education
            </button>
          </div>
          <div className="space-y-6">
            {portfolio.education.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.degree || "Education"}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={item.public !== false} onChange={(event) => updateEducation(item.id, { public: event.target.checked })} />
                      Public
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete education item "${item.degree}"?`)) {
                          updatePortfolio({ ...portfolio, education: portfolio.education.filter((entry) => entry.id !== item.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Degree / title" value={item.degree} onChange={(degree) => updateEducation(item.id, { degree })} />
                  <TextField label="School" value={item.school} onChange={(school) => updateEducation(item.id, { school })} />
                  <TextField label="Period" value={item.period ?? ""} onChange={(period) => updateEducation(item.id, { period })} />
                  <TextField label="Category" value={item.category ?? ""} onChange={(category) => updateEducation(item.id, { category })} />
                  <TextField label="Grade" value={item.grade ?? ""} onChange={(grade) => updateEducation(item.id, { grade })} />
                  <TextField label="Verification URL" value={item.verificationUrl ?? ""} onChange={(verificationUrl) => updateEducation(item.id, { verificationUrl })} />
                  <AdminFileUpload label="Degree / academic certificate" kind="pdf" value={item.documentUrl} onChange={(documentUrl) => updateEducation(item.id, { documentUrl })} />
                  <AdminFileUpload label="Transcript / marksheet" kind="pdf" value={item.transcriptUrl} onChange={(transcriptUrl) => updateEducation(item.id, { transcriptUrl })} />
                  <div className="md:col-span-2">
                    <TextField label="Description" value={item.description ?? item.details ?? ""} multiline onChange={(description) => updateEducation(item.id, { description, details: description })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mb-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Achievements</h2>
            <button onClick={addAchievement} className="rounded-full bg-accentBlue px-4 py-2 text-sm font-bold text-dark">
              Add achievement
            </button>
          </div>
          <div className="space-y-6">
            {(portfolio.achievements ?? []).map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title || "Achievement"}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={item.public !== false} onChange={(event) => updateAchievement(item.id, { public: event.target.checked })} />
                      Public
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete achievement "${item.title}"?`)) {
                          updatePortfolio({ ...portfolio, achievements: (portfolio.achievements ?? []).filter((entry) => entry.id !== item.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" value={item.title} onChange={(title) => updateAchievement(item.id, { title })} />
                  <TextField label="Issuer" value={item.issuer} onChange={(issuer) => updateAchievement(item.id, { issuer })} />
                  <TextField label="Date" value={item.date} onChange={(date) => updateAchievement(item.id, { date })} />
                  <TextField label="Category" value={item.category} onChange={(category) => updateAchievement(item.id, { category })} />
                  <AdminFileUpload label="Achievement image" kind="image" value={item.image} onChange={(image) => updateAchievement(item.id, { image })} />
                  <AdminFileUpload label="Award / achievement document" kind="pdf" value={item.documentUrl} onChange={(documentUrl) => updateAchievement(item.id, { documentUrl })} />
                  <div className="md:col-span-2">
                    <TextField label="Description" value={item.description} multiline onChange={(description) => updateAchievement(item.id, { description })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Documents</h2>
            <button onClick={addDocument} className="rounded-full bg-accentPurple px-4 py-2 text-sm font-bold">
              Add document
            </button>
          </div>
          <div className="space-y-6">
            {portfolio.documents.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title || "Document"}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={item.public || item.visibility === "public" || item.visibility === "download"} onChange={(event) => updateDocument(item.id, { public: event.target.checked, visibility: event.target.checked ? "public" : "private" })} />
                      Public
                    </label>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete document "${item.title}"?`)) {
                          updatePortfolio({ ...portfolio, documents: portfolio.documents.filter((entry) => entry.id !== item.id) });
                        }
                      }}
                      className="text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" value={item.title} onChange={(title) => updateDocument(item.id, { title })} />
                  <TextField label="Issuer" value={item.issuer} onChange={(issuer) => updateDocument(item.id, { issuer })} />
                  <TextField label="Category" value={item.category} onChange={(category) => updateDocument(item.id, { category })} />
                  <TextField label="Date" value={item.date} onChange={(date) => updateDocument(item.id, { date })} />
                  <AdminFileUpload label="Upload document" kind={item.fileType === "zip" ? "archive" : "document"} value={item.url} onChange={(url) => updateDocument(item.id, { url: url ?? "" })} />
                  <TextField label="File type / note" value={item.fileType ?? ""} onChange={(fileType) => updateDocument(item.id, { fileType })} />
                  <AdminFileUpload label="Additional download file" kind="document" value={item.downloadUrl} onChange={(downloadUrl) => updateDocument(item.id, { downloadUrl })} />
                  <div className="md:col-span-2">
                    <TextField label="Description" value={item.description} multiline onChange={(description) => updateDocument(item.id, { description })} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card mt-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Blog posts</h2>
            <button onClick={addBlogPost} className="rounded-full bg-accentBlue px-4 py-2 text-sm font-bold text-dark">Add post</button>
          </div>
          <div className="space-y-6">
            {portfolio.blogPosts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{post.title || "Untitled post"}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={post.published} onChange={(event) => updateBlogPost(post.id, { published: event.target.checked })} /> Published</label>
                    <button type="button" onClick={() => { if (window.confirm(`Delete post "${post.title}"?`)) updatePortfolio({ ...portfolio, blogPosts: portfolio.blogPosts.filter((item) => item.id !== post.id) }); }} className="text-red-300">Delete</button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Title" value={post.title} onChange={(title) => updateBlogPost(post.id, { title })} />
                  <TextField label="Slug" value={post.slug} onChange={(slug) => updateBlogPost(post.id, { slug })} />
                  <TextField label="Date" value={post.date} onChange={(date) => updateBlogPost(post.id, { date })} />
                  <AdminFileUpload label="Cover image" kind="image" value={post.coverImage} onChange={(coverImage) => updateBlogPost(post.id, { coverImage })} />
                  <div className="md:col-span-2"><TextField label="Excerpt" value={post.excerpt} multiline onChange={(excerpt) => updateBlogPost(post.id, { excerpt })} /></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
