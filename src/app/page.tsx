git add"use client";

import { motion } from "framer-motion";
import { Download, Mail, Github, Linkedin, ExternalLink } from "lucide-react";

export default function Home() {
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-dark text-white selection:bg-accentPurple selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold gradient-text"
          >
            Munsif.AI
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex gap-6 text-sm font-medium"
          >
            <a href="#about" className="hover:text-accentBlue transition-colors">About</a>
            <a href="#skills" className="hover:text-accentBlue transition-colors">Skills</a>
            <a href="#projects" className="hover:text-accentBlue transition-colors">Projects</a>
            <a href="#experience" className="hover:text-accentBlue transition-colors">Experience</a>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12">
        <motion.div
          className="flex-1 space-y-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.h2 variants={itemVariant} className="text-accentBlue font-medium tracking-wider uppercase text-sm">
            Hello, I am
          </motion.h2>
          <motion.h1 variants={itemVariant} className="text-5xl md:text-7xl font-bold">
            Munsif Khan
          </motion.h1>
          <motion.h3 variants={itemVariant} className="text-2xl md:text-3xl font-semibold text-gray-400">
            AI & Machine Learning Engineer
          </motion.h3>
          <motion.p variants={itemVariant} className="text-gray-400 leading-relaxed max-w-xl">
            Software Engineering graduate specializing in building and deploying end-to-end AI solutions including computer vision, NLP, recommendation systems, and AI-agent applications.
          </motion.p>
          <motion.div variants={itemVariant} className="flex gap-4 pt-4">
            <a href="/Munsif_Ai_Engr_CV.pdf" download className="bg-accentBlue hover:bg-accentPurple transition-all duration-300 text-dark px-6 py-3 rounded-full font-bold flex items-center gap-2">
              <Download size={20} /> Download CV
            </a>
            <a href="mailto:munsifkhankhaksar@gmail.com" className="border border-white/20 hover:border-accentBlue transition-colors px-6 py-3 rounded-full flex items-center gap-2">
              <Mail size={20} /> Contact Me
            </a>
          </motion.div>
          <motion.div variants={itemVariant} className="flex gap-4 pt-4">
            <a href="https://github.com/Munsif311" target="_blank" rel="noreferrer" className="p-2 hover:text-accentBlue transition-colors">
              <Github size={24} />
            </a>
            <a href="https://linkedin.com/in/munsif-khan" target="_blank" rel="noreferrer" className="p-2 hover:text-accentBlue transition-colors">
              <Linkedin size={24} />
            </a>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex justify-center"
        >
          {/* Avatar - Place user image here */}
          <div className="relative w-72 h-72 rounded-full p-2 bg-gradient-to-tr from-accentBlue to-accentPurple">
            <img src="/Munsif.png" alt="Munsif Khan" className="w-full h-full object-cover rounded-full border-4 border-dark" />
          </div>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-8"
        >
          About <span className="gradient-text">Me</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-gray-400 text-lg leading-relaxed"
        >
          Software Engineering graduate (University of Malakand, July 2026) specializing in Machine Learning and Deep Learning. Experienced in building and deploying end-to-end AI solutions including computer vision, NLP, recommendation systems, and AI-agent applications delivered as interactive web apps. Proficient in Python, data analysis, and full machine learning pipeline development. Certified by IBM, Cambridge International Qualifications (UK), and DigiSkills.pk, with a strong interest in applying AI and data-driven solutions to real-world problems.
        </motion.p>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-darker px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-12 text-center"
          >
            Technical <span className="gradient-text">Skills</span>
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Languages", skills: ["Python", "SQL", "C++"] },
              { title: "Machine Learning", skills: ["TensorFlow", "Keras", "Scikit-learn", "YOLOv8"] },
              { title: "AI / LLM", skills: ["LLMs", "RAG", "AI Agents", "Computer Vision"] },
              { title: "Web & Tools", skills: ["React/Next.js", "Flask", "Streamlit", "Git/GitHub"] },
            ].map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card hover:border-accentBlue/50 transition-colors duration-300"
              >
                <h3 className="text-xl font-bold mb-4 text-accentPurple">{category.title}</h3>
                <ul className="space-y-2 text-gray-300">
                  {category.skills.map(skill => (
                    <li key={skill} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accentBlue" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-12 text-center"
        >
          Featured <span className="gradient-text">Projects</span>
        </motion.h2>
        <div className="space-y-20">
          {/* Project 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row gap-10 items-center"
          >
            <div className="w-full lg:w-1/2 overflow-hidden rounded-2xl border border-white/10 group">
              <img src="/green_vision.png" alt="Green Vision" className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="w-full lg:w-1/2 space-y-6">
              <h3 className="text-3xl font-bold">Green Vision</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                AI-Driven Environmental & Security Monitoring for Smart Parks. Designed an AI system that monitors environmental conditions and security in real-time using Python, TensorFlow, OpenCV, and YOLO.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Python", "TensorFlow", "YOLO", "OpenCV"].map(tech => (
                  <span key={tech} className="px-3 py-1 bg-accentBlue/10 text-accentBlue rounded-full text-sm font-medium">{tech}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Project 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row-reverse gap-10 items-center"
          >
            <div className="w-full lg:w-1/2 overflow-hidden rounded-2xl border border-white/10 group">
              <img src="/sqlite_rag.png" alt="SQLite RAG" className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="w-full lg:w-1/2 space-y-6">
              <h3 className="text-3xl font-bold">SQLite RAG AI Agent</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                Built a Retrieval-Augmented Generation system enabling natural-language querying of a SQLite database using LLMs and AI Agents. Translates human questions directly into contextual answers.
              </p>
              <div className="flex flex-wrap gap-2">
                {["LLMs", "RAG", "React", "AI Agents"].map(tech => (
                  <span key={tech} className="px-3 py-1 bg-accentPurple/10 text-accentPurple rounded-full text-sm font-medium">{tech}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Project 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row gap-10 items-center"
          >
            <div className="w-full lg:w-1/2 overflow-hidden rounded-2xl border border-white/10 group">
              <img src="/pneumonia.png" alt="Pneumonia Detection" className="w-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="w-full lg:w-1/2 space-y-6">
              <h3 className="text-3xl font-bold">Pneumonia Detection</h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                A medical imaging model using YOLOv8 and OpenCV to detect signs of pneumonia from chest X-ray images, handling the full pipeline from dataset preparation to evaluation.
              </p>
              <div className="flex flex-wrap gap-2">
                {["YOLOv8", "Computer Vision", "Medical AI", "OpenCV"].map(tech => (
                  <span key={tech} className="px-3 py-1 bg-accentBlue/10 text-accentBlue rounded-full text-sm font-medium">{tech}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 bg-darker px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-12 text-center"
          >
            Professional <span className="gradient-text">Experience</span>
          </motion.h2>
          <div className="space-y-8">
            {[
              {
                role: "Data Mining Intern",
                company: "GAO Tek Inc.",
                duration: "Jun 2026 – Sep 2026",
                description: "Remote data mining internship contributing to data mining and analysis tasks. Applied data preprocessing and pattern-extraction techniques."
              },
              {
                role: "Data Analytics Intern",
                company: "Oasis Infobyte",
                duration: "Jun 2026",
                description: "Completed a fellowship internship focused on orientation and hands-on application of data analytics concepts through guided, project-based learning."
              },
              {
                role: "Machine Learning Intern",
                company: "Ezitech Institute",
                duration: "Jun 2025 – Sep 2025",
                description: "Delivered multiple end-to-end ML projects including breast cancer detection, car price prediction, and a movie recommendation system. Developed a SQL RAG system."
              },
              {
                role: "Machine Learning Intern",
                company: "Cognifyz Technologies",
                duration: "Jan 2025 – Feb 2025",
                description: "Worked on data-driven tasks, building and evaluating machine learning models. Strengthened skills in data preprocessing, model training, and result interpretation."
              }
            ].map((job, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card flex flex-col md:flex-row justify-between gap-4"
              >
                <div>
                  <h3 className="text-xl font-bold text-accentBlue">{job.role}</h3>
                  <p className="text-white font-medium">{job.company}</p>
                  <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">{job.description}</p>
                </div>
                <div className="text-accentPurple text-sm font-medium whitespace-nowrap">
                  {job.duration}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 border-t border-white/10 mt-12">
        <p>© 2026 Munsif Khan. Built with Next.js & Tailwind CSS.</p>
      </footer>
    </main>
  );
}
