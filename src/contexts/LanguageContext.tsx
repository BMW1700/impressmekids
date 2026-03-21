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

    // Student Dashboard Sections
    'student.today.title': "Today's Tasks",
    'student.today.dueToday': 'Due Today',
    'student.today.pastDue': 'Past Due',
    'student.today.start': 'Start',
    'student.today.completeNow': 'Complete Now',
    'student.today.noDueToday': 'No assignments due today. Great job staying on top of your work!',
    'student.today.dueAt': 'Due {time}',
    'student.today.wasDue': 'Was due {date}',

    'student.courses.title': 'My Courses',
    'student.courses.joinCourse': 'Join Course',
    'student.courses.noCourses': "You haven't joined any courses yet.",
    'student.courses.joinFirst': 'Join Your First Course',

    'student.calendar.title': 'Calendar',

    'student.announcements.title': 'Announcements',
    'student.announcements.today': 'Today',
    'student.announcements.last14Days': 'Last 14 Days',
    'student.announcements.none': 'No announcements yet.',

    'student.directory.title': 'Directory',

    'student.clubs.title': 'Clubs & Organizations',
    'student.clubs.createClub': 'Create Club',
    'student.clubs.viewPosts': 'View Posts',
    'student.clubs.newPost': 'New Post',
    'student.clubs.owner': 'Owner',
    'student.clubs.moderator': 'Moderator',
    'student.clubs.none': "You're not a member of any clubs yet.",
    'student.clubs.browseClubs': 'Browse Clubs',

    'student.gradebook.title': 'Gradebook',
    'student.gradebook.finalGradeWeighted': 'Final Grade (Weighted)',
    'student.gradebook.noGradesYet': 'No grades yet',
    'student.gradebook.viewTrend': 'View Trend',
    'student.gradebook.viewAllGrades': 'View All Grades',
    'student.gradebook.tests': 'Tests',
    'student.gradebook.quizzes': 'Quizzes',
    'student.gradebook.homework': 'Homework',
    'student.gradebook.attendance': 'Attendance',
    'student.gradebook.upcomingAssignments': 'Upcoming Assignments',
    'student.gradebook.due': 'Due',
    'student.gradebook.status.graded': 'Graded',
    'student.gradebook.status.submitted': 'Submitted',
    'student.gradebook.status.incomplete': 'Incomplete',
    'student.gradebook.status.pastDue': 'Past Due',
    'student.gradebook.status.submittedLate': 'Submitted Late',
    'student.gradebook.empty': 'No gradebook data available yet.',
    'student.gradebook.performanceTrends': 'Performance Trends',
    'student.gradebook.allGrades': 'All Grades',
    'student.gradebook.viewDetails': 'View Details',
    'student.gradebook.assignmentDetails': 'Assignment Details',
    'student.gradebook.yourGrade': 'Your Grade',
    'student.gradebook.pointsShort': '{earned}/{total} pts',
    'student.gradebook.pointsLong': '{earned}/{total} points',
    'student.gradebook.teacherFeedback': 'Teacher Feedback',
    'student.gradebook.noTeacherFeedback': 'No teacher feedback provided yet.',
    'student.gradebook.viewSubmission': 'View Submission',
    'student.gradebook.present': 'Present',
    'student.gradebook.tardy': 'Tardy',
    'student.gradebook.absent': 'Absent',
    'student.gradebook.days': 'days',

    'student.safety.title': 'Safety Center',
    'student.safety.subtitle': 'Stay informed about school safety drills and procedures',
    'student.safety.upcomingDrills': 'Upcoming Drills',
    'student.safety.scheduledFor': 'Scheduled for {datetime}',
    'student.safety.noDrills': 'No drills scheduled at this time',
    'student.safety.whenActive': "When a drill is active, you'll be able to check in here",
    'student.safety.tips.title': 'Safety Tips',
    'student.safety.tips.1': "Always follow your teacher's instructions during drills",
    'student.safety.tips.2': 'Stay calm and help others stay calm',
    'student.safety.tips.3': "Know your classroom's evacuation routes",
    'student.safety.tips.4': "Check in here once you're safely back in class",
    'student.safety.checkInFailed': 'Check-in Failed',
    'student.safety.checkInFailedDesc': 'Could not mark you as safe. Please try again.',
    'student.safety.checkedInTitle': 'Successfully Checked In!',
    'student.safety.checkedInDesc': 'Your parents have been notified that you are safe.',
    'student.safety.markedSafe': "You're marked safe!",
    'student.safety.parentsNotifiedAt': 'Your parents have been notified at {time}',
    'student.safety.checkingIn': 'Checking In...',
    'student.safety.imBackInClass': "✅ I'm Back in Class",
    'student.safety.inProgress': '{type} IN PROGRESS',
    'student.safety.drillSuffix': ' (DRILL)',
    'student.safety.emergencyPrefix': '🚨 EMERGENCY - ',
    'student.safety.followTeacher': "Follow your teacher's instructions carefully.",

    'student.account.title': 'Account Settings',
    'student.account.profileInfo': 'Profile Information',
    'student.account.changePhoto': 'Change Photo',
    'student.account.uploading': 'Uploading...',
    'student.account.maxPhotoNote': 'Max 5MB, JPG or PNG',
    'student.account.fullName': 'Full Name',
    'student.account.contactAdminName': 'Contact your school administrator to change your legal name',
    'student.account.preferredName': 'Preferred Name',
    'student.account.preferredNamePlaceholder': 'Enter preferred name',
    'student.account.email': 'Email Address',
    'student.account.studentId': 'Student ID',
    'student.account.grade': 'Grade',
    'student.account.kindergarten': 'Kindergarten',
    'student.account.gradeNumber': 'Grade {n}',
    'student.account.notSet': 'Not Set',
    'student.account.contactTeacherGrade': 'Contact your teacher to update your grade level',
    'student.account.emergencyContacts': 'Emergency Contacts',
    'student.account.addContact': 'Add Contact',
    'student.account.noneContacts': 'No emergency contacts added yet',
    'student.account.edit': 'Edit',
    'student.account.delete': 'Delete',
    'student.account.security': 'Security',
    'student.account.changePassword': 'Change Password',
    'student.account.changePasswordTitle': 'Change Password',
    'student.account.changePasswordDesc': "Enter your new password below. Make sure it's at least 6 characters long.",
    'student.account.newPassword': 'New Password',
    'student.account.newPasswordPlaceholder': 'Enter new password',
    'student.account.confirmNewPassword': 'Confirm New Password',
    'student.account.confirmNewPasswordPlaceholder': 'Confirm new password',
    'student.account.cancel': 'Cancel',
    'student.account.changing': 'Changing...',
    'student.account.deleteEmergencyContactTitle': 'Delete Emergency Contact',
    'student.account.deleteEmergencyContactDesc': 'Are you sure you want to delete this emergency contact? This action cannot be undone.',

    'student.errors.failedLoadProfile': 'Failed to load profile',
    'student.common.na': 'N/A',

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

    'teacherDashboard.tabs.classrooms': 'Courses & Clubs',
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

    'teacherDashboard.clubs.title': 'My Clubs',
    'teacherDashboard.clubs.create': 'Create Club',
    'teacherDashboard.clubs.emptyTitle': 'No Clubs Yet',
    'teacherDashboard.clubs.emptyDescription': 'Create your first club to organize student activities and events!',
    'teacherDashboard.clubs.emptyCTA': 'Create Your First Club',

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

    // Parent Dashboard
    'parentDashboard.loading': 'Loading your dashboard...',
    'parentDashboard.title': 'Parent Dashboard',
    'parentDashboard.subtitle': "Stay connected with your child's education journey",
    'parentDashboard.studentFallback': 'Student',

    'parentDashboard.actions.calendar': 'Calendar',
    'parentDashboard.actions.safety': 'Safety',
    'parentDashboard.actions.notifications': 'Notifications',
    'parentDashboard.actions.linkStudent': 'Link Student',
    'parentDashboard.actions.viewFullProfile': 'View Full Student Profile',

    'parentDashboard.empty.title': 'Get Started',
    'parentDashboard.empty.description':
      'Link your first student to start monitoring their progress, viewing assignments, and staying connected with their education.',
    'parentDashboard.empty.cta': 'Link Your First Student',

    'parentDashboard.tabs.overview': 'Overview',
    'parentDashboard.tabs.gradebook': 'Gradebook',

    'parentDashboard.accessRequests.title': 'My Student Access Requests',

    // Parent: Request Access
    'parentRequestAccess.backToDashboard': 'Back to Dashboard',
    'parentRequestAccess.title': 'Link Child Account',
    'parentRequestAccess.description':
      "Enter your child's email to request access to their progress. Their teacher will need to approve the request.",
    'parentRequestAccess.childEmailLabel': "Child's Email",
    'parentRequestAccess.childEmailPlaceholder': 'student@school.edu',
    'parentRequestAccess.messageLabel': 'Message to Teacher (Optional)',
    'parentRequestAccess.messagePlaceholder':
      "Hello, I am [Child's Name]'s parent. I would like access to view their progress on NabuLearn.",
    'parentRequestAccess.sending': 'Sending Request...',
    'parentRequestAccess.send': 'Send Access Request',

    // Parent: Notifications Settings
    'parentNotificationSettings.back': 'Back',
    'parentNotificationSettings.title': 'Notification Preferences',
    'parentNotificationSettings.description':
      "Configure how and when you receive notifications about your child's activities",
    'parentNotificationSettings.section.what': 'What to Notify About',
    'parentNotificationSettings.assignments': 'Assignments',
    'parentNotificationSettings.assignmentsDesc': 'Get notified about upcoming assignments and homework',
    'parentNotificationSettings.tests': 'Tests & Quizzes',
    'parentNotificationSettings.testsDesc': 'Get notified about upcoming tests and quizzes',
    'parentNotificationSettings.events': 'Events & Field Trips',
    'parentNotificationSettings.eventsDesc':
      'Get notified about field trips, guest speakers, and special events',
    'parentNotificationSettings.section.when': 'When to Notify',
    'parentNotificationSettings.daysBeforeLabel': 'Notify me this many days before:',
    'parentNotificationSettings.dayOf': 'On the day',
    'parentNotificationSettings.oneDay': '1 day before',
    'parentNotificationSettings.twoDays': '2 days before',
    'parentNotificationSettings.threeDays': '3 days before',
    'parentNotificationSettings.fiveDays': '5 days before',
    'parentNotificationSettings.oneWeek': '1 week before',
    'parentNotificationSettings.section.how': 'How to Notify',
    'parentNotificationSettings.email': 'Email Notifications',
    'parentNotificationSettings.emailDesc': 'Receive notifications via email',
    'parentNotificationSettings.inApp': 'In-App Notifications',
    'parentNotificationSettings.inAppDesc': 'See notifications when you log in to the platform',
    'parentNotificationSettings.save': 'Save Preferences',

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
    'footer.copyright': '© {year} NabuLearn. All rights reserved.',
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

    // Student Dashboard Sections
    'student.today.title': 'Tareas de Hoy',
    'student.today.dueToday': 'Vence Hoy',
    'student.today.pastDue': 'Atrasado',
    'student.today.start': 'Comenzar',
    'student.today.completeNow': 'Completar Ahora',
    'student.today.noDueToday': 'No hay tareas para hoy. ¡Buen trabajo manteniéndote al día!',
    'student.today.dueAt': 'Vence a las {time}',
    'student.today.wasDue': 'Venció el {date}',

    'student.courses.title': 'Mis Cursos',
    'student.courses.joinCourse': 'Unirse al Curso',
    'student.courses.noCourses': 'Aún no te has unido a ningún curso.',
    'student.courses.joinFirst': 'Únete a Tu Primer Curso',

    'student.calendar.title': 'Calendario',

    'student.announcements.title': 'Anuncios',
    'student.announcements.today': 'Hoy',
    'student.announcements.last14Days': 'Últimos 14 Días',
    'student.announcements.none': 'Aún no hay anuncios.',

    'student.directory.title': 'Directorio',

    'student.clubs.title': 'Clubes y Organizaciones',
    'student.clubs.createClub': 'Crear Club',
    'student.clubs.viewPosts': 'Ver Publicaciones',
    'student.clubs.newPost': 'Nueva Publicación',
    'student.clubs.owner': 'Propietario',
    'student.clubs.moderator': 'Moderador',
    'student.clubs.none': 'Aún no eres miembro de ningún club.',
    'student.clubs.browseClubs': 'Explorar Clubes',

    'student.gradebook.title': 'Libro de Calificaciones',
    'student.gradebook.finalGradeWeighted': 'Calificación Final (Ponderada)',
    'student.gradebook.noGradesYet': 'Aún no hay calificaciones',
    'student.gradebook.viewTrend': 'Ver Tendencia',
    'student.gradebook.viewAllGrades': 'Ver Todas las Calificaciones',
    'student.gradebook.tests': 'Exámenes',
    'student.gradebook.quizzes': 'Quizzes',
    'student.gradebook.homework': 'Tareas',
    'student.gradebook.attendance': 'Asistencia',
    'student.gradebook.upcomingAssignments': 'Próximas Tareas',
    'student.gradebook.due': 'Vence',
    'student.gradebook.status.graded': 'Calificado',
    'student.gradebook.status.submitted': 'Entregado',
    'student.gradebook.status.incomplete': 'Incompleto',
    'student.gradebook.status.pastDue': 'Atrasado',
    'student.gradebook.status.submittedLate': 'Entregado Tarde',
    'student.gradebook.empty': 'Aún no hay datos de calificaciones disponibles.',
    'student.gradebook.performanceTrends': 'Tendencias de Rendimiento',
    'student.gradebook.allGrades': 'Todas las Calificaciones',
    'student.gradebook.viewDetails': 'Ver Detalles',
    'student.gradebook.assignmentDetails': 'Detalles de la Tarea',
    'student.gradebook.yourGrade': 'Tu Calificación',
    'student.gradebook.pointsShort': '{earned}/{total} pts',
    'student.gradebook.pointsLong': '{earned}/{total} puntos',
    'student.gradebook.teacherFeedback': 'Comentarios del Docente',
    'student.gradebook.noTeacherFeedback': 'Aún no hay comentarios del docente.',
    'student.gradebook.viewSubmission': 'Ver Entrega',
    'student.gradebook.present': 'Presente',
    'student.gradebook.tardy': 'Tarde',
    'student.gradebook.absent': 'Ausente',
    'student.gradebook.days': 'días',

    'student.safety.title': 'Centro de Seguridad',
    'student.safety.subtitle': 'Mantente informado sobre simulacros y procedimientos de seguridad escolar',
    'student.safety.upcomingDrills': 'Próximos Simulacros',
    'student.safety.scheduledFor': 'Programado para {datetime}',
    'student.safety.noDrills': 'No hay simulacros programados por ahora',
    'student.safety.whenActive': 'Cuando haya un simulacro activo, podrás registrarte aquí',
    'student.safety.tips.title': 'Consejos de Seguridad',
    'student.safety.tips.1': 'Sigue siempre las instrucciones de tu docente durante los simulacros',
    'student.safety.tips.2': 'Mantén la calma y ayuda a otros a mantenerse tranquilos',
    'student.safety.tips.3': 'Conoce las rutas de evacuación de tu salón',
    'student.safety.tips.4': 'Regístrate aquí cuando estés de vuelta en clase de forma segura',
    'student.safety.checkInFailed': 'Error al Registrarse',
    'student.safety.checkInFailedDesc': 'No pudimos marcarte como seguro/a. Inténtalo de nuevo.',
    'student.safety.checkedInTitle': '¡Registro Exitoso!',
    'student.safety.checkedInDesc': 'Tus padres han sido notificados de que estás seguro/a.',
    'student.safety.markedSafe': '¡Estás marcado/a como seguro/a!',
    'student.safety.parentsNotifiedAt': 'Tus padres fueron notificados a las {time}',
    'student.safety.checkingIn': 'Registrando...',
    'student.safety.imBackInClass': '✅ Ya estoy en clase',
    'student.safety.inProgress': '{type} EN PROGRESO',
    'student.safety.drillSuffix': ' (SIMULACRO)',
    'student.safety.emergencyPrefix': '🚨 EMERGENCIA - ',
    'student.safety.followTeacher': 'Sigue cuidadosamente las instrucciones de tu docente.',

    'student.account.title': 'Configuración de Cuenta',
    'student.account.profileInfo': 'Información del Perfil',
    'student.account.changePhoto': 'Cambiar Foto',
    'student.account.uploading': 'Subiendo...',
    'student.account.maxPhotoNote': 'Máx 5MB, JPG o PNG',
    'student.account.fullName': 'Nombre Completo',
    'student.account.contactAdminName': 'Contacta a tu administrador escolar para cambiar tu nombre legal',
    'student.account.preferredName': 'Nombre Preferido',
    'student.account.preferredNamePlaceholder': 'Ingresa tu nombre preferido',
    'student.account.email': 'Correo Electrónico',
    'student.account.studentId': 'ID de Estudiante',
    'student.account.grade': 'Grado',
    'student.account.kindergarten': 'Kinder',
    'student.account.gradeNumber': 'Grado {n}',
    'student.account.notSet': 'No configurado',
    'student.account.contactTeacherGrade': 'Contacta a tu docente para actualizar tu nivel de grado',
    'student.account.emergencyContacts': 'Contactos de Emergencia',
    'student.account.addContact': 'Agregar Contacto',
    'student.account.noneContacts': 'Aún no se han agregado contactos de emergencia',
    'student.account.edit': 'Editar',
    'student.account.delete': 'Eliminar',
    'student.account.security': 'Seguridad',
    'student.account.changePassword': 'Cambiar Contraseña',
    'student.account.changePasswordTitle': 'Cambiar Contraseña',
    'student.account.changePasswordDesc': 'Ingresa tu nueva contraseña abajo. Asegúrate de que tenga al menos 6 caracteres.',
    'student.account.newPassword': 'Nueva Contraseña',
    'student.account.newPasswordPlaceholder': 'Ingresa nueva contraseña',
    'student.account.confirmNewPassword': 'Confirmar Nueva Contraseña',
    'student.account.confirmNewPasswordPlaceholder': 'Confirma nueva contraseña',
    'student.account.cancel': 'Cancelar',
    'student.account.changing': 'Cambiando...',
    'student.account.deleteEmergencyContactTitle': 'Eliminar Contacto de Emergencia',
    'student.account.deleteEmergencyContactDesc': '¿Seguro que quieres eliminar este contacto de emergencia? Esta acción no se puede deshacer.',

    'student.errors.failedLoadProfile': 'No se pudo cargar el perfil',
    'student.common.na': 'N/D',

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

    'teacherDashboard.tabs.classrooms': 'Clases y Clubes',
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

    // Parent Dashboard
    'parentDashboard.loading': 'Cargando tu panel...',
    'parentDashboard.title': 'Panel para Padres',
    'parentDashboard.subtitle': 'Mantente conectado con el progreso educativo de tu hijo/a',
    'parentDashboard.studentFallback': 'Estudiante',

    'parentDashboard.actions.calendar': 'Calendario',
    'parentDashboard.actions.safety': 'Seguridad',
    'parentDashboard.actions.notifications': 'Notificaciones',
    'parentDashboard.actions.linkStudent': 'Vincular Estudiante',
    'parentDashboard.actions.viewFullProfile': 'Ver Perfil Completo del Estudiante',

    'parentDashboard.empty.title': 'Comenzar',
    'parentDashboard.empty.description':
      'Vincula a tu primer estudiante para monitorear su progreso, ver tareas y mantenerte conectado con su educación.',
    'parentDashboard.empty.cta': 'Vincular Tu Primer Estudiante',

    'parentDashboard.tabs.overview': 'Resumen',
    'parentDashboard.tabs.gradebook': 'Calificaciones',

    'parentDashboard.accessRequests.title': 'Mis Solicitudes de Acceso',

    // Parent: Request Access
    'parentRequestAccess.backToDashboard': 'Volver al Panel',
    'parentRequestAccess.title': 'Vincular Cuenta del Niño/a',
    'parentRequestAccess.description':
      'Ingresa el correo de tu hijo/a para solicitar acceso a su progreso. El docente deberá aprobar la solicitud.',
    'parentRequestAccess.childEmailLabel': 'Correo del Niño/a',
    'parentRequestAccess.childEmailPlaceholder': 'estudiante@escuela.edu',
    'parentRequestAccess.messageLabel': 'Mensaje al Docente (Opcional)',
    'parentRequestAccess.messagePlaceholder':
      'Hola, soy el/la padre/madre de [Nombre del Niño/a]. Me gustaría acceder para ver su progreso en NabuLearn.',
    'parentRequestAccess.sending': 'Enviando solicitud...',
    'parentRequestAccess.send': 'Enviar Solicitud de Acceso',

    // Parent: Notifications Settings
    'parentNotificationSettings.back': 'Volver',
    'parentNotificationSettings.title': 'Preferencias de Notificación',
    'parentNotificationSettings.description':
      'Configura cómo y cuándo recibes notificaciones sobre las actividades de tu hijo/a',
    'parentNotificationSettings.section.what': 'Qué Notificar',
    'parentNotificationSettings.assignments': 'Tareas',
    'parentNotificationSettings.assignmentsDesc': 'Recibe avisos sobre tareas y trabajos próximos',
    'parentNotificationSettings.tests': 'Exámenes y Quizzes',
    'parentNotificationSettings.testsDesc': 'Recibe avisos sobre exámenes y quizzes próximos',
    'parentNotificationSettings.events': 'Eventos y Excursiones',
    'parentNotificationSettings.eventsDesc':
      'Recibe avisos sobre excursiones, invitados y eventos especiales',
    'parentNotificationSettings.section.when': 'Cuándo Notificar',
    'parentNotificationSettings.daysBeforeLabel': 'Notifícame con estos días de anticipación:',
    'parentNotificationSettings.dayOf': 'El mismo día',
    'parentNotificationSettings.oneDay': '1 día antes',
    'parentNotificationSettings.twoDays': '2 días antes',
    'parentNotificationSettings.threeDays': '3 días antes',
    'parentNotificationSettings.fiveDays': '5 días antes',
    'parentNotificationSettings.oneWeek': '1 semana antes',
    'parentNotificationSettings.section.how': 'Cómo Notificar',
    'parentNotificationSettings.email': 'Notificaciones por Email',
    'parentNotificationSettings.emailDesc': 'Recibe notificaciones por correo',
    'parentNotificationSettings.inApp': 'Notificaciones en la App',
    'parentNotificationSettings.inAppDesc': 'Ver notificaciones cuando ingresas a la plataforma',
    'parentNotificationSettings.save': 'Guardar Preferencias',

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
    'footer.copyright': '© {year} NabuLearn. Todos los derechos reservados.',
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

    // Student Dashboard Sections
    'student.today.title': "Tâches d'Aujourd'hui",
    'student.today.dueToday': "Dû Aujourd'hui",
    'student.today.pastDue': 'En Retard',
    'student.today.start': 'Commencer',
    'student.today.completeNow': 'Terminer Maintenant',
    'student.today.noDueToday': "Aucun devoir à rendre aujourd'hui. Bravo!",
    'student.today.dueAt': 'Dû à {time}',
    'student.today.wasDue': 'Était dû le {date}',

    'student.courses.title': 'Mes Cours',
    'student.courses.joinCourse': 'Rejoindre le Cours',
    'student.courses.noCourses': "Tu n'as rejoint aucun cours pour le moment.",
    'student.courses.joinFirst': 'Rejoindre Ton Premier Cours',

    'student.calendar.title': 'Calendrier',

    'student.announcements.title': 'Annonces',
    'student.announcements.today': "Aujourd'hui",
    'student.announcements.last14Days': '14 Derniers Jours',
    'student.announcements.none': "Aucune annonce pour le moment.",

    'student.directory.title': 'Répertoire',

    'student.clubs.title': 'Clubs et Organisations',
    'student.clubs.createClub': 'Créer un Club',
    'student.clubs.viewPosts': 'Voir les Publications',
    'student.clubs.newPost': 'Nouvelle Publication',
    'student.clubs.owner': 'Propriétaire',
    'student.clubs.moderator': 'Modérateur',
    'student.clubs.none': "Tu n'es membre d'aucun club pour le moment.",
    'student.clubs.browseClubs': 'Parcourir les Clubs',

    'student.gradebook.title': 'Carnet de Notes',
    'student.gradebook.finalGradeWeighted': 'Note Finale (Pondérée)',
    'student.gradebook.noGradesYet': "Pas encore de notes",
    'student.gradebook.viewTrend': 'Voir la Tendance',
    'student.gradebook.viewAllGrades': 'Voir Toutes les Notes',
    'student.gradebook.tests': 'Tests',
    'student.gradebook.quizzes': 'Quiz',
    'student.gradebook.homework': 'Devoirs',
    'student.gradebook.attendance': 'Présence',
    'student.gradebook.upcomingAssignments': 'Devoirs à Venir',
    'student.gradebook.due': 'Dû',
    'student.gradebook.status.graded': 'Noté',
    'student.gradebook.status.submitted': 'Soumis',
    'student.gradebook.status.incomplete': 'Incomplet',
    'student.gradebook.status.pastDue': 'En Retard',
    'student.gradebook.status.submittedLate': 'Soumis en Retard',
    'student.gradebook.empty': "Aucune donnée de notes disponible pour le moment.",
    'student.gradebook.performanceTrends': 'Tendances de Performance',
    'student.gradebook.allGrades': 'Toutes les Notes',
    'student.gradebook.viewDetails': 'Voir les Détails',
    'student.gradebook.assignmentDetails': 'Détails du Devoir',
    'student.gradebook.yourGrade': 'Ta Note',
    'student.gradebook.pointsShort': '{earned}/{total} pts',
    'student.gradebook.pointsLong': '{earned}/{total} points',
    'student.gradebook.teacherFeedback': "Commentaire de l'Enseignant",
    'student.gradebook.noTeacherFeedback': "Aucun commentaire pour le moment.",
    'student.gradebook.viewSubmission': 'Voir la Soumission',
    'student.gradebook.present': 'Présent',
    'student.gradebook.tardy': 'En Retard',
    'student.gradebook.absent': 'Absent',
    'student.gradebook.days': 'jours',

    'student.safety.title': 'Centre de Sécurité',
    'student.safety.subtitle': 'Reste informé des exercices et procédures de sécurité',
    'student.safety.upcomingDrills': 'Exercices à Venir',
    'student.safety.scheduledFor': 'Prévu pour {datetime}',
    'student.safety.noDrills': "Aucun exercice prévu pour le moment",
    'student.safety.whenActive': "Quand un exercice est actif, tu pourras te signaler ici",
    'student.safety.tips.title': 'Conseils de Sécurité',
    'student.safety.tips.1': "Suis toujours les instructions de ton enseignant",
    'student.safety.tips.2': 'Reste calme et aide les autres à rester calmes',
    'student.safety.tips.3': "Connais les itinéraires d'évacuation de ta classe",
    'student.safety.tips.4': "Signale-toi ici une fois de retour en classe",
    'student.safety.checkInFailed': 'Échec du Signalement',
    'student.safety.checkInFailedDesc': "Impossible de te marquer en sécurité. Réessaie.",
    'student.safety.checkedInTitle': 'Signalement Réussi!',
    'student.safety.checkedInDesc': 'Tes parents ont été informés que tu es en sécurité.',
    'student.safety.markedSafe': 'Tu es marqué en sécurité!',
    'student.safety.parentsNotifiedAt': 'Tes parents ont été informés à {time}',
    'student.safety.checkingIn': 'Signalement...',
    'student.safety.imBackInClass': "✅ Je suis de retour en classe",
    'student.safety.inProgress': '{type} EN COURS',
    'student.safety.drillSuffix': ' (EXERCICE)',
    'student.safety.emergencyPrefix': '🚨 URGENCE - ',
    'student.safety.followTeacher': "Suis attentivement les instructions de ton enseignant.",

    'student.account.title': 'Paramètres du Compte',
    'student.account.profileInfo': 'Informations du Profil',
    'student.account.changePhoto': 'Changer la Photo',
    'student.account.uploading': 'Téléversement...',
    'student.account.maxPhotoNote': 'Max 5 Mo, JPG ou PNG',
    'student.account.fullName': 'Nom Complet',
    'student.account.contactAdminName': 'Contacte ton administrateur scolaire pour changer ton nom légal',
    'student.account.preferredName': 'Prénom Préféré',
    'student.account.preferredNamePlaceholder': 'Saisis ton prénom préféré',
    'student.account.email': 'Adresse Email',
    'student.account.studentId': "ID Étudiant",
    'student.account.grade': 'Niveau',
    'student.account.kindergarten': 'Maternelle',
    'student.account.gradeNumber': 'Niveau {n}',
    'student.account.notSet': 'Non défini',
    'student.account.contactTeacherGrade': 'Contacte ton enseignant pour mettre à jour ton niveau',
    'student.account.emergencyContacts': "Contacts d'Urgence",
    'student.account.addContact': 'Ajouter un Contact',
    'student.account.noneContacts': "Aucun contact d'urgence ajouté",
    'student.account.edit': 'Modifier',
    'student.account.delete': 'Supprimer',
    'student.account.security': 'Sécurité',
    'student.account.changePassword': 'Changer le Mot de Passe',
    'student.account.changePasswordTitle': 'Changer le Mot de Passe',
    'student.account.changePasswordDesc': 'Saisis ton nouveau mot de passe. Il doit contenir au moins 6 caractères.',
    'student.account.newPassword': 'Nouveau Mot de Passe',
    'student.account.newPasswordPlaceholder': 'Saisis un nouveau mot de passe',
    'student.account.confirmNewPassword': 'Confirmer le Mot de Passe',
    'student.account.confirmNewPasswordPlaceholder': 'Confirme le mot de passe',
    'student.account.cancel': 'Annuler',
    'student.account.changing': 'Changement...',
    'student.account.deleteEmergencyContactTitle': "Supprimer le Contact d'Urgence",
    'student.account.deleteEmergencyContactDesc': "Es-tu sûr de vouloir supprimer ce contact d'urgence ? Cette action est irréversible.",

    'student.errors.failedLoadProfile': 'Impossible de charger le profil',
    'student.common.na': 'N/A',

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

    'teacherDashboard.tabs.classrooms': 'Classes et Clubs',
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

    // Parent Dashboard
    'parentDashboard.loading': 'Chargement de votre tableau de bord...',
    'parentDashboard.title': 'Tableau de Bord Parent',
    'parentDashboard.subtitle': "Restez connecté au parcours scolaire de votre enfant",
    'parentDashboard.studentFallback': 'Élève',

    'parentDashboard.actions.calendar': 'Calendrier',
    'parentDashboard.actions.safety': 'Sécurité',
    'parentDashboard.actions.notifications': 'Notifications',
    'parentDashboard.actions.linkStudent': 'Lier un Élève',
    'parentDashboard.actions.viewFullProfile': 'Voir le Profil Complet',

    'parentDashboard.empty.title': 'Commencer',
    'parentDashboard.empty.description':
      'Liez votre premier élève pour suivre ses progrès, consulter les devoirs et rester connecté à sa scolarité.',
    'parentDashboard.empty.cta': 'Lier Votre Premier Élève',

    'parentDashboard.tabs.overview': 'Aperçu',
    'parentDashboard.tabs.gradebook': 'Notes',

    'parentDashboard.accessRequests.title': 'Mes Demandes d’Accès',

    // Parent: Request Access
    'parentRequestAccess.backToDashboard': 'Retour au Tableau de Bord',
    'parentRequestAccess.title': 'Lier le Compte de l’Enfant',
    'parentRequestAccess.description':
      "Saisissez l’email de votre enfant pour demander l’accès à ses progrès. Son enseignant devra approuver la demande.",
    'parentRequestAccess.childEmailLabel': "Email de l’Enfant",
    'parentRequestAccess.childEmailPlaceholder': 'eleve@ecole.fr',
    'parentRequestAccess.messageLabel': "Message à l’Enseignant (Optionnel)",
    'parentRequestAccess.messagePlaceholder':
      "Bonjour, je suis le parent de [Nom de l’Enfant]. Je souhaite accéder à ses progrès sur NabuLearn.",
    'parentRequestAccess.sending': 'Envoi de la demande...',
    'parentRequestAccess.send': 'Envoyer la Demande d’Accès',

    // Parent: Notifications Settings
    'parentNotificationSettings.back': 'Retour',
    'parentNotificationSettings.title': 'Préférences de Notification',
    'parentNotificationSettings.description':
      "Configurez comment et quand vous recevez des notifications sur les activités de votre enfant",
    'parentNotificationSettings.section.what': 'Quoi Notifier',
    'parentNotificationSettings.assignments': 'Devoirs',
    'parentNotificationSettings.assignmentsDesc': 'Recevez des alertes sur les devoirs à venir',
    'parentNotificationSettings.tests': 'Tests & Quiz',
    'parentNotificationSettings.testsDesc': 'Recevez des alertes sur les tests et quiz à venir',
    'parentNotificationSettings.events': 'Événements & Sorties',
    'parentNotificationSettings.eventsDesc':
      'Recevez des alertes sur les sorties, intervenants et événements spéciaux',
    'parentNotificationSettings.section.when': 'Quand Notifier',
    'parentNotificationSettings.daysBeforeLabel': 'Me prévenir ce nombre de jours avant :',
    'parentNotificationSettings.dayOf': 'Le jour même',
    'parentNotificationSettings.oneDay': '1 jour avant',
    'parentNotificationSettings.twoDays': '2 jours avant',
    'parentNotificationSettings.threeDays': '3 jours avant',
    'parentNotificationSettings.fiveDays': '5 jours avant',
    'parentNotificationSettings.oneWeek': '1 semaine avant',
    'parentNotificationSettings.section.how': 'Comment Notifier',
    'parentNotificationSettings.email': 'Notifications Email',
    'parentNotificationSettings.emailDesc': 'Recevez des notifications par email',
    'parentNotificationSettings.inApp': 'Notifications dans l’App',
    'parentNotificationSettings.inAppDesc': 'Voir les notifications lorsque vous vous connectez',
    'parentNotificationSettings.save': 'Enregistrer',

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
    'footer.copyright': '© {year} NabuLearn. Tous droits réservés.',
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
