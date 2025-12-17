import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'fr';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    'nav.signIn': 'Sign In',
    'nav.signOut': 'Sign Out',
    'nav.getStarted': 'Get Started',
    'nav.home': 'Home',

    // Settings
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.system': 'System',

    // Sidebar (Student)
    'sidebar.dashboard': 'Dashboard',
    'sidebar.studentPortal': 'Student Portal',
    'sidebar.home': 'Home',
    'sidebar.today': 'Today',
    'sidebar.courses': 'Courses',
    'sidebar.clubs': 'Clubs & Organizations',
    'sidebar.calendar': 'Calendar',
    'sidebar.announcements': 'Announcements',
    'sidebar.studyGames': 'Study Games',
    'sidebar.auraReading': 'Aura Reading',
    'sidebar.gradebook': 'Gradebook',
    'sidebar.directory': 'Directory',
    'sidebar.safety': 'Safety',
    'sidebar.account': 'Account',
    'sidebar.keepLearning': 'Keep Learning!',
    'sidebar.newAdventure': 'Every day is a new adventure',

    // Greetings
    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',

    // Home Section (Student)
    'home.subtitle': "Here's what's happening with your learning today.",
    'home.assignments': 'Assignments',
    'home.completed': 'Completed',
    'home.gamesPlayed': 'Games Played',
    'home.gamesWon': 'Games Won',
    'home.urgentAssignment': 'Urgent: Assignment Due Soon',
    'home.dueIn': 'Due in',
    'home.yourPerformance': 'Your Performance',
    'home.achievements': 'Achievements',
    'home.activeMissions': 'Active Missions',
    'home.quickActions': 'Quick Actions',
    'home.readyToPlay': 'Ready to Play?',
    'home.readyToPlayDesc': 'Challenge yourself with educational games and compete with classmates!',
    'home.practiceWithAura': 'Practice with AURA',
    'home.practiceWithAuraDesc': 'Improve your reading skills with personalized practice sessions.',
    'home.playGames': 'Play Games',
    'home.startPractice': 'Start Practice',
    'home.recentActivity': 'Recent Activity',

    // Teacher Dashboard
    'teacherDashboard.loading': 'Loading your dashboard...',
    'teacherDashboard.welcome': 'Welcome, {name}!',
    'teacherDashboard.subtitle': 'Your AI-Powered Classroom Command Center',

    'teacherDashboard.aiInsights.title': 'AI Insights Dashboard',
    'teacherDashboard.aiInsights.badge': '4 Patents',
    'teacherDashboard.aiInsights.description':
      'Revolutionary machine learning models predict reading outcomes, identify at-risk students, and prescribe personalized interventions.',
    'teacherDashboard.aiInsights.viewAnalytics': 'View Analytics',
    'teacherDashboard.aiInsights.atRiskStudents': 'At-Risk Students',

    'teacherDashboard.stats.totalClassrooms': 'Total Classrooms',
    'teacherDashboard.stats.totalStudents': 'Total Students',
    'teacherDashboard.stats.activeAssignments': 'Active Assignments',
    'teacherDashboard.stats.activeLabel': 'Active',
    'teacherDashboard.stats.enrolledLabel': 'Enrolled',
    'teacherDashboard.stats.mlPowered': 'ML-Powered',

    'teacherDashboard.tabs.classrooms': 'Classrooms',
    'teacherDashboard.tabs.leaderboard': 'Leaderboard',
    'teacherDashboard.tabs.calendar': 'Calendar',
    'teacherDashboard.tabs.directory': 'Directory',
    'teacherDashboard.tabs.quickActions': 'Quick Actions',
    'teacherDashboard.tabs.mlTraining': 'ML Training',

    'teacherDashboard.classrooms.title': 'My Classrooms',
    'teacherDashboard.classrooms.create': 'Create Classroom',
    'teacherDashboard.classrooms.emptyTitle': 'No Classrooms Yet',
    'teacherDashboard.classrooms.emptyDescription':
      'Create your first classroom to start inviting students and playing games!',
    'teacherDashboard.classrooms.emptyCTA': 'Create Your First Classroom',

    'teacherDashboard.leaderboard.empty': 'Create a classroom to view leaderboards',
    'teacherDashboard.leaderboard.viewFull': 'View Full Leaderboard →',

    'teacherDashboard.quickActions.browseGames.title': 'Browse Games',
    'teacherDashboard.quickActions.browseGames.description':
      'Explore educational games for your classroom',
    'teacherDashboard.quickActions.browseGames.cta': 'View Games',

    'teacherDashboard.quickActions.auraAnalytics.title': 'AURA Analytics',
    'teacherDashboard.quickActions.auraAnalytics.description': 'Track student pronunciation with AI',
    'teacherDashboard.quickActions.auraAnalytics.cta': 'View Analytics',

    'teacherDashboard.quickActions.storyLibrary.title': 'Story Library',
    'teacherDashboard.quickActions.storyLibrary.description': 'Create & manage reading stories',
    'teacherDashboard.quickActions.storyLibrary.cta': 'Manage Stories',

    'teacherDashboard.quickActions.resources.title': 'Resources',
    'teacherDashboard.quickActions.resources.description': 'Teacher guides and best practices',
    'teacherDashboard.quickActions.resources.cta': 'View Resources',
    'teacherDashboard.quickActions.resources.soon': 'Soon',

    // Games
    'games.title': 'Educational Games Hub',
    'games.subtitle': 'Choose from our collection of educational games designed to make learning fun!',
    'games.comingSoon': 'Coming Soon',
    'games.playNow': 'Play Now',
    'games.numberMaker.title': 'Number Maker',
    'games.numberMaker.description': 'Combine given numbers using math operations to create the target number.',
    'games.triviatastic.title': 'TriviaTastic',
    'games.triviatastic.description': 'Test your knowledge with fun trivia questions across various subjects.',
    'games.wordWizard.title': 'Word Wizard',
    'games.wordWizard.description': 'Build vocabulary and spelling skills with word puzzles.',
    'games.mathQuest.title': 'Math Quest',
    'games.mathQuest.description': 'Embark on mathematical adventures solving problems.',

    // Common
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',

    // Footer
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.copyright': '© {year} ImpressMe Family App. All rights reserved.',
  },
  es: {
    // Navigation
    'nav.signIn': 'Iniciar Sesión',
    'nav.signOut': 'Cerrar Sesión',
    'nav.getStarted': 'Comenzar',
    'nav.home': 'Inicio',

    // Settings
    'settings.title': 'Configuración',
    'settings.theme': 'Tema',
    'settings.language': 'Idioma',
    'settings.light': 'Claro',
    'settings.dark': 'Oscuro',
    'settings.system': 'Sistema',

    // Sidebar (Student)
    'sidebar.dashboard': 'Panel',
    'sidebar.studentPortal': 'Portal del Estudiante',
    'sidebar.home': 'Inicio',
    'sidebar.today': 'Hoy',
    'sidebar.courses': 'Cursos',
    'sidebar.clubs': 'Clubes y Organizaciones',
    'sidebar.calendar': 'Calendario',
    'sidebar.announcements': 'Anuncios',
    'sidebar.studyGames': 'Juegos de Estudio',
    'sidebar.auraReading': 'Lectura Aura',
    'sidebar.gradebook': 'Libro de Calificaciones',
    'sidebar.directory': 'Directorio',
    'sidebar.safety': 'Seguridad',
    'sidebar.account': 'Cuenta',
    'sidebar.keepLearning': '¡Sigue Aprendiendo!',
    'sidebar.newAdventure': 'Cada día es una nueva aventura',

    // Greetings
    'greeting.morning': 'Buenos días',
    'greeting.afternoon': 'Buenas tardes',
    'greeting.evening': 'Buenas noches',

    // Home Section (Student)
    'home.subtitle': 'Esto es lo que está pasando con tu aprendizaje hoy.',
    'home.assignments': 'Tareas',
    'home.completed': 'Completadas',
    'home.gamesPlayed': 'Juegos Jugados',
    'home.gamesWon': 'Juegos Ganados',
    'home.urgentAssignment': 'Urgente: Tarea Por Entregar',
    'home.dueIn': 'Vence en',
    'home.yourPerformance': 'Tu Rendimiento',
    'home.achievements': 'Logros',
    'home.activeMissions': 'Misiones Activas',
    'home.quickActions': 'Acciones Rápidas',
    'home.readyToPlay': '¿Listo para Jugar?',
    'home.readyToPlayDesc': '¡Desafíate con juegos educativos y compite con tus compañeros!',
    'home.practiceWithAura': 'Practica con AURA',
    'home.practiceWithAuraDesc': 'Mejora tus habilidades de lectura con sesiones de práctica personalizadas.',
    'home.playGames': 'Jugar',
    'home.startPractice': 'Comenzar Práctica',
    'home.recentActivity': 'Actividad Reciente',

    // Teacher Dashboard
    'teacherDashboard.loading': 'Cargando tu panel...',
    'teacherDashboard.welcome': '¡Bienvenido/a, {name}!',
    'teacherDashboard.subtitle': 'Tu Centro de Control del Aula con IA',

    'teacherDashboard.aiInsights.title': 'Panel de Insights con IA',
    'teacherDashboard.aiInsights.badge': '4 Patentes',
    'teacherDashboard.aiInsights.description':
      'Modelos de aprendizaje automático predicen resultados de lectura, identifican estudiantes en riesgo y recomiendan intervenciones personalizadas.',
    'teacherDashboard.aiInsights.viewAnalytics': 'Ver Analítica',
    'teacherDashboard.aiInsights.atRiskStudents': 'Estudiantes en Riesgo',

    'teacherDashboard.stats.totalClassrooms': 'Total de Clases',
    'teacherDashboard.stats.totalStudents': 'Total de Estudiantes',
    'teacherDashboard.stats.activeAssignments': 'Tareas Activas',
    'teacherDashboard.stats.activeLabel': 'Activo',
    'teacherDashboard.stats.enrolledLabel': 'Inscritos',
    'teacherDashboard.stats.mlPowered': 'Impulsado por ML',

    'teacherDashboard.tabs.classrooms': 'Clases',
    'teacherDashboard.tabs.leaderboard': 'Clasificación',
    'teacherDashboard.tabs.calendar': 'Calendario',
    'teacherDashboard.tabs.directory': 'Directorio',
    'teacherDashboard.tabs.quickActions': 'Acciones Rápidas',
    'teacherDashboard.tabs.mlTraining': 'Entrenamiento ML',

    'teacherDashboard.classrooms.title': 'Mis Clases',
    'teacherDashboard.classrooms.create': 'Crear Clase',
    'teacherDashboard.classrooms.emptyTitle': 'Aún No Hay Clases',
    'teacherDashboard.classrooms.emptyDescription':
      'Crea tu primera clase para invitar estudiantes y jugar juegos.',
    'teacherDashboard.classrooms.emptyCTA': 'Crear Tu Primera Clase',

    'teacherDashboard.leaderboard.empty': 'Crea una clase para ver clasificaciones',
    'teacherDashboard.leaderboard.viewFull': 'Ver Clasificación Completa →',

    'teacherDashboard.quickActions.browseGames.title': 'Explorar Juegos',
    'teacherDashboard.quickActions.browseGames.description':
      'Explora juegos educativos para tu clase',
    'teacherDashboard.quickActions.browseGames.cta': 'Ver Juegos',

    'teacherDashboard.quickActions.auraAnalytics.title': 'Analítica AURA',
    'teacherDashboard.quickActions.auraAnalytics.description':
      'Sigue la pronunciación del estudiante con IA',
    'teacherDashboard.quickActions.auraAnalytics.cta': 'Ver Analítica',

    'teacherDashboard.quickActions.storyLibrary.title': 'Biblioteca de Historias',
    'teacherDashboard.quickActions.storyLibrary.description':
      'Crea y administra historias de lectura',
    'teacherDashboard.quickActions.storyLibrary.cta': 'Administrar Historias',

    'teacherDashboard.quickActions.resources.title': 'Recursos',
    'teacherDashboard.quickActions.resources.description': 'Guías para docentes y buenas prácticas',
    'teacherDashboard.quickActions.resources.cta': 'Ver Recursos',
    'teacherDashboard.quickActions.resources.soon': 'Pronto',

    // Games
    'games.title': 'Centro de Juegos Educativos',
    'games.subtitle': '¡Elige de nuestra colección de juegos educativos diseñados para hacer el aprendizaje divertido!',
    'games.comingSoon': 'Próximamente',
    'games.playNow': 'Jugar Ahora',
    'games.numberMaker.title': 'Creador de Números',
    'games.numberMaker.description': 'Combina números usando operaciones matemáticas para crear el número objetivo.',
    'games.triviatastic.title': 'TriviaTástico',
    'games.triviatastic.description': 'Pon a prueba tu conocimiento con preguntas de trivia divertidas.',
    'games.wordWizard.title': 'Mago de Palabras',
    'games.wordWizard.description': 'Desarrolla vocabulario y ortografía con puzzles de palabras.',
    'games.mathQuest.title': 'Aventura Matemática',
    'games.mathQuest.description': 'Embárcate en aventuras matemáticas resolviendo problemas.',

    // Common
    'common.back': 'Volver',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',

    // Footer
    'footer.privacyPolicy': 'Política de Privacidad',
    'footer.termsOfService': 'Términos de Servicio',
    'footer.copyright': '© {year} ImpressMe Family App. Todos los derechos reservados.',
  },
  fr: {
    // Navigation
    'nav.signIn': 'Se Connecter',
    'nav.signOut': 'Se Déconnecter',
    'nav.getStarted': 'Commencer',
    'nav.home': 'Accueil',

    // Settings
    'settings.title': 'Paramètres',
    'settings.theme': 'Thème',
    'settings.language': 'Langue',
    'settings.light': 'Clair',
    'settings.dark': 'Sombre',
    'settings.system': 'Système',

    // Sidebar (Student)
    'sidebar.dashboard': 'Tableau de bord',
    'sidebar.studentPortal': 'Portail Étudiant',
    'sidebar.home': 'Accueil',
    'sidebar.today': "Aujourd'hui",
    'sidebar.courses': 'Cours',
    'sidebar.clubs': 'Clubs et Organisations',
    'sidebar.calendar': 'Calendrier',
    'sidebar.announcements': 'Annonces',
    'sidebar.studyGames': "Jeux d'Étude",
    'sidebar.auraReading': 'Lecture Aura',
    'sidebar.gradebook': 'Carnet de Notes',
    'sidebar.directory': 'Répertoire',
    'sidebar.safety': 'Sécurité',
    'sidebar.account': 'Compte',
    'sidebar.keepLearning': "Continue d'Apprendre!",
    'sidebar.newAdventure': 'Chaque jour est une nouvelle aventure',

    // Greetings
    'greeting.morning': 'Bonjour',
    'greeting.afternoon': 'Bon après-midi',
    'greeting.evening': 'Bonsoir',

    // Home Section (Student)
    'home.subtitle': "Voici ce qui se passe avec ton apprentissage aujourd'hui.",
    'home.assignments': 'Devoirs',
    'home.completed': 'Terminés',
    'home.gamesPlayed': 'Jeux Joués',
    'home.gamesWon': 'Jeux Gagnés',
    'home.urgentAssignment': 'Urgent: Devoir Bientôt Dû',
    'home.dueIn': 'Dû dans',
    'home.yourPerformance': 'Tes Performances',
    'home.achievements': 'Réalisations',
    'home.activeMissions': 'Missions Actives',
    'home.quickActions': 'Actions Rapides',
    'home.readyToPlay': 'Prêt à Jouer?',
    'home.readyToPlayDesc': 'Défie-toi avec des jeux éducatifs et affronte tes camarades!',
    'home.practiceWithAura': 'Pratique avec AURA',
    'home.practiceWithAuraDesc': 'Améliore tes compétences en lecture avec des sessions personnalisées.',
    'home.playGames': 'Jouer',
    'home.startPractice': 'Commencer',
    'home.recentActivity': 'Activité Récente',

    // Teacher Dashboard
    'teacherDashboard.loading': 'Chargement de votre tableau de bord...',
    'teacherDashboard.welcome': 'Bienvenue, {name}!',
    'teacherDashboard.subtitle': 'Votre Centre de Commandement de Classe (IA)',

    'teacherDashboard.aiInsights.title': 'Tableau de Bord des Insights IA',
    'teacherDashboard.aiInsights.badge': '4 Brevets',
    'teacherDashboard.aiInsights.description':
      'Des modèles de machine learning prédisent les résultats de lecture, identifient les élèves à risque et recommandent des interventions personnalisées.',
    'teacherDashboard.aiInsights.viewAnalytics': 'Voir Analyses',
    'teacherDashboard.aiInsights.atRiskStudents': 'Élèves à Risque',

    'teacherDashboard.stats.totalClassrooms': 'Total des Classes',
    'teacherDashboard.stats.totalStudents': "Total des Élèves",
    'teacherDashboard.stats.activeAssignments': 'Devoirs Actifs',
    'teacherDashboard.stats.activeLabel': 'Actif',
    'teacherDashboard.stats.enrolledLabel': 'Inscrits',
    'teacherDashboard.stats.mlPowered': 'Propulsé par ML',

    'teacherDashboard.tabs.classrooms': 'Classes',
    'teacherDashboard.tabs.leaderboard': 'Classement',
    'teacherDashboard.tabs.calendar': 'Calendrier',
    'teacherDashboard.tabs.directory': 'Répertoire',
    'teacherDashboard.tabs.quickActions': 'Actions Rapides',
    'teacherDashboard.tabs.mlTraining': 'Entraînement ML',

    'teacherDashboard.classrooms.title': 'Mes Classes',
    'teacherDashboard.classrooms.create': 'Créer une Classe',
    'teacherDashboard.classrooms.emptyTitle': 'Aucune Classe Pour le Moment',
    'teacherDashboard.classrooms.emptyDescription':
      'Créez votre première classe pour inviter des élèves et lancer des jeux.',
    'teacherDashboard.classrooms.emptyCTA': 'Créer Votre Première Classe',

    'teacherDashboard.leaderboard.empty': 'Créez une classe pour voir les classements',
    'teacherDashboard.leaderboard.viewFull': 'Voir le Classement Complet →',

    'teacherDashboard.quickActions.browseGames.title': 'Parcourir les Jeux',
    'teacherDashboard.quickActions.browseGames.description':
      'Découvrez des jeux éducatifs pour votre classe',
    'teacherDashboard.quickActions.browseGames.cta': 'Voir les Jeux',

    'teacherDashboard.quickActions.auraAnalytics.title': 'Analyses AURA',
    'teacherDashboard.quickActions.auraAnalytics.description':
      'Suivez la prononciation des élèves avec l’IA',
    'teacherDashboard.quickActions.auraAnalytics.cta': 'Voir Analyses',

    'teacherDashboard.quickActions.storyLibrary.title': 'Bibliothèque d’Histoires',
    'teacherDashboard.quickActions.storyLibrary.description':
      'Créez et gérez des histoires de lecture',
    'teacherDashboard.quickActions.storyLibrary.cta': 'Gérer les Histoires',

    'teacherDashboard.quickActions.resources.title': 'Ressources',
    'teacherDashboard.quickActions.resources.description':
      'Guides enseignants et bonnes pratiques',
    'teacherDashboard.quickActions.resources.cta': 'Voir les Ressources',
    'teacherDashboard.quickActions.resources.soon': 'Bientôt',

    // Games
    'games.title': 'Centre de Jeux Éducatifs',
    'games.subtitle': "Choisissez parmi notre collection de jeux éducatifs conçus pour rendre l'apprentissage amusant!",
    'games.comingSoon': 'Bientôt Disponible',
    'games.playNow': 'Jouer Maintenant',
    'games.numberMaker.title': 'Créateur de Nombres',
    'games.numberMaker.description': 'Combinez des nombres en utilisant des opérations mathématiques pour créer le nombre cible.',
    'games.triviatastic.title': 'TriviaTastique',
    'games.triviatastic.description': 'Testez vos connaissances avec des questions de trivia amusantes.',
    'games.wordWizard.title': 'Magicien des Mots',
    'games.wordWizard.description': 'Développez votre vocabulaire et orthographe avec des puzzles de mots.',
    'games.mathQuest.title': 'Quête Mathématique',
    'games.mathQuest.description': "Partez à l'aventure mathématique en résolvant des problèmes.",

    // Common
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',

    // Footer
    'footer.privacyPolicy': 'Politique de Confidentialité',
    'footer.termsOfService': "Conditions d'Utilisation",
    'footer.copyright': '© {year} ImpressMe Family App. Tous droits réservés.',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    return (stored as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return translations.en[key] || key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
