import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, MessageSquare, LayoutDashboard, ArrowRight, Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const roles = [
  {
    title: "Student",
    description: "Explore assignments, educational games, reading practice, and track your progress — all from one dashboard.",
    icon: BookOpen,
    path: "/demos/student",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Teacher",
    description: "Create assignments, manage classrooms, grade submissions, and monitor student performance with powerful analytics.",
    icon: GraduationCap,
    path: "/demos/teacher",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Parent",
    description: "Monitor your child's progress, view assignments and grades, communicate with teachers, and stay informed.",
    icon: MessageSquare,
    path: "/demos/parent",
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Admin",
    description: "Manage users, oversee classrooms, configure school settings, view analytics, and handle district-wide operations.",
    icon: LayoutDashboard,
    path: "/demos/admin",
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "RPG Reading Game",
    description: "Experience the LexiQuest RPG — battle enemies by reading aloud in this interactive combat demo.",
    icon: Swords,
    path: "/game/demo",
    color: "from-red-500 to-rose-500",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const Demos = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Interactive Demos — NabuLearn</title>
        <meta name="description" content="Try NabuLearn from any role — student, teacher, parent, or admin. See AURA reading assessment, RPG adventure, and analytics in action." />
        <link rel="canonical" href="https://nabulearn.com/demos" />
        <meta property="og:title" content="Interactive Demos — NabuLearn" />
        <meta property="og:description" content="Walk through the platform as a student, teacher, parent, or admin." />
        <meta property="og:url" content="https://nabulearn.com/demos" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Header />

      <section className="bg-gradient-hero text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Interactive Demos
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Experience the platform from every perspective. Click a role below to launch an interactive walkthrough — no account required.
          </motion.p>
        </div>
      </section>

      <main className="flex-1 py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {roles.map((role, i) => (
              <motion.div
                key={role.title}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <Link
                  to={role.path}
                  className="group block rounded-2xl border-2 border-border bg-card p-8 hover:border-primary hover:shadow-card transition-all duration-300"
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${role.color} mb-5`}>
                    <role.icon className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{role.title}</h2>
                  <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{role.description}</p>
                  <Button variant="outline" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Play className="h-4 w-4" />
                    Launch Demo
                    <ArrowRight className="h-4 w-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Demos;
