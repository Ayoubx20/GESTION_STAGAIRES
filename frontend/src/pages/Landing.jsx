import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAntigravity } from '../contexts/AntigravityContext';
import { 
  Orbit, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  GraduationCap, 
  BuildingOffice, 
  ArrowRight, 
  Lock,
  Layers,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isAntigravityActive, toggleAntigravity } = useAntigravity();

  const handlePortalAccess = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 flex flex-col relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-[40%] right-[10%] w-[35%] h-[35%] bg-pink-500/5 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transform hover:rotate-12 transition-transform duration-300">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
              GESTION <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">STAGIAIRE</span>
            </h1>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Fonctionnalités</a>
            <a href="#benefits" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Avantages</a>
            <a href="#antigravity-demo" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center space-x-1 text-purple-600 dark:text-purple-400">
              <Orbit className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Démo Physique</span>
            </a>
          </nav>

          {/* CTA Right Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePortalAccess}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform active:scale-95 group"
            >
              <span>Accéder au Portail</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center flex-1 flex flex-col items-center justify-center">
        {/* Floating Tag */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/30 text-purple-600 dark:text-purple-400 text-xs font-bold mb-6 tracking-wide uppercase animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plateforme Professionnelle Web Pro</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-4xl leading-tight">
          Gérez vos{' '}
          <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Stages
          </span>{' '}
          et vos{' '}
          <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Équipes
          </span>{' '}
          en toute Fluidité
        </h2>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
          La plateforme moderne, collaborative et intelligente pour piloter le cycle de vie des stages en entreprise : pointage autonome, quiz d'évaluation, et rapports sécurisés.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            onClick={handlePortalAccess}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
          >
            <span>Commencer</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>

          {/* Interactive Physics Sandbox CTA */}
          <button
            onClick={toggleAntigravity}
            className={`w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-bold transition-all duration-300 border shadow-md transform hover:-translate-y-0.5 active:scale-95 ${
              isAntigravityActive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-transparent text-white animate-pulse'
                : 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Orbit className={`w-5 h-5 mr-2 ${isAntigravityActive ? 'animate-spin' : ''}`} />
            <span>{isAntigravityActive ? 'Rétablir la Gravité' : 'Activer l\'Antigravité 🪐'}</span>
          </button>
        </div>

        {/* Visual Showcase Card Container */}
        <div className="mt-20 w-full max-w-5xl rounded-3xl bg-white/50 dark:bg-gray-800/40 border border-white dark:border-white/10 p-4 shadow-2xl backdrop-blur-md transform hover:scale-[1.01] transition-transform duration-500">
          <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 aspect-[16/9] shadow-inner flex flex-col justify-between p-6 text-left relative group">
            {/* Mock Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="px-4 py-1 rounded bg-gray-800 text-xs text-gray-400 font-mono">
                portail.gestion-stagiaire.io/dashboard
              </div>
              <div className="w-6"></div>
            </div>
            
            {/* Mock Body */}
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
              <Orbit className="w-16 h-16 text-purple-500 animate-orbit-slow mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Simulateur Physique Intégré</h3>
              <p className="text-gray-400 max-w-md text-sm">
                Activez l'Antigravité et utilisez votre curseur pour agripper et propulser les éléments de l'interface !
              </p>
            </div>

            {/* Mock Bottom */}
            <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-xs text-gray-500 font-mono">
              <span>Status: Online</span>
              <span>v1.4.2 (Anti-Gravity Ready)</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="relative z-10 py-24 bg-white dark:bg-gray-900/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Une Suite Complète de Gestion Professionnelle
            </h3>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Chaque outil est soigneusement conçu pour offrir un suivi clair, robuste et fluide aux tuteurs de stage et aux stagiaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="card group">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Analyses & Statistiques</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualisez la progression générale, le taux d'avancement des tâches et l'assiduité grâce à des graphiques dynamiques.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pointage Autonome</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fiches d'émargement quotidiennes décentralisées pour les stagiaires, avec système d'approbation superviseur en un clic.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group">
              <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Quiz d'Évaluation</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Évaluez le socle technique des stagiaires via des QCM intégrés et générez des rapports de compétences automatiques.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <BuildingOffice className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Équipes & Groupes</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organisez les stagiaires par groupes de projets, assignez des encadrants et suivez le rendement collectif en équipe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BENEFITS */}
      <section id="benefits" className="relative z-10 py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Pensé pour l'Efficacité des Entreprises et Écoles
              </h3>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Dites adieu aux tableaux Excel complexes et aux fiches papier perdues. Notre portail regroupe toutes les obligations réglementaires du stage.
              </p>
              
              <ul className="mt-8 space-y-4">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">Sécurité de Bout en Bout</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vos données administratives sont entièrement sécurisées, cryptées et accessibles uniquement aux profils autorisés.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">Génération de PDF instantanée</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Téléchargez les relevés de pointage et certificats d'assiduité signés d'un seul clic.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-gray-900 dark:text-white">Rôle Superviseur Dédié</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Attribuez des tuteurs pour guider et valider l'assiduité quotidienne des stagiaires attitrés.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Premium Stat Card Visual */}
            <div className="lg:w-1/2 w-full grid grid-cols-2 gap-6">
              <div className="card text-center flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-purple-50/20 dark:from-gray-800 dark:to-purple-950/10">
                <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400">100%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-semibold">Numérique & Écoresponsable</span>
              </div>
              <div className="card text-center flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-indigo-50/20 dark:from-gray-800 dark:to-indigo-950/10">
                <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">60fps</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-semibold">Animations Anti-gravité</span>
              </div>
              <div className="card text-center flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-pink-50/20 dark:from-gray-800 dark:to-pink-950/10">
                <span className="text-4xl font-extrabold text-pink-600 dark:text-pink-400">-90%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-semibold">Temps Administratif</span>
              </div>
              <div className="card text-center flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white to-emerald-50/20 dark:from-gray-800 dark:to-emerald-950/10">
                <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">Secure</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-semibold">Stockage Cloud Crypté</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PHYSICS DEMO SANDBOX CTA BANNER */}
      <section id="antigravity-demo" className="relative z-10 py-24 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white overflow-hidden">
        {/* Decorative Grid overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Orbit className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" style={{ animationDuration: '8s' }} />
          <h3 className="text-3xl font-extrabold sm:text-4xl">Prêt à Briser la Physique du Site ?</h3>
          <p className="mt-4 text-lg text-purple-200 max-w-2xl mx-auto">
            Testez l'incomparable animation **Google Antigravity** ! Cliquez sur le bouton ci-dessous, attrapez les cartes, jetez-les et regardez-les rebondir aux quatre coins de l'écran.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={toggleAntigravity}
              className={`inline-flex items-center justify-center rounded-2xl px-10 py-5 text-lg font-black transition-all duration-300 shadow-2xl transform hover:-translate-y-1 active:scale-95 ${
                isAntigravityActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/20'
                  : 'bg-white text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Orbit className={`w-6 h-6 mr-3 ${isAntigravityActive ? 'animate-spin' : ''}`} />
              <span>{isAntigravityActive ? 'Rétablir l\'interface' : 'Activer l\'Antigravité 🪐'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-gray-900 text-gray-400 py-12 border-t border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">GS</span>
            </div>
            <span className="text-white font-black tracking-tight">GESTION STAGIAIRE</span>
          </div>

          <p className="text-sm font-medium">
            &copy; {new Date().getFullYear()} Gestion Stagiaire Web Pro. Tous droits réservés.
          </p>

          <div className="flex items-center space-x-4">
            <button
              onClick={handlePortalAccess}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg border border-gray-700 transition-colors"
            >
              Portail Administratif
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
