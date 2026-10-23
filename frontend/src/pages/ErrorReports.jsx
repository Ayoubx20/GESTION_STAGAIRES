import React, { useCallback, useEffect, useState } from 'react';
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const categories = [
  { value: 'timesheet', label: 'Pointage' },
  { value: 'tasks', label: 'Tâches' },
  { value: 'documents', label: 'Documents' },
  { value: 'account', label: 'Compte et connexion' },
  { value: 'other', label: 'Autre' }
];

const severityLabels = { low: 'Faible', medium: 'Normale', high: 'Élevée', critical: 'Bloquante' };
const statusLabels = { open: 'Nouveau', in_progress: 'En cours', resolved: 'Résolu' };
const statusStyles = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
};

const formatDate = (value) => new Date(value).toLocaleString('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const ErrorReports = () => {
  const { user, isAdmin, isSupervisor } = useAuth();
  const canManage = isAdmin || isSupervisor;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [sendingMessageId, setSendingMessageId] = useState(null);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [updates, setUpdates] = useState({});
  const [form, setForm] = useState({
    title: '',
    category: 'other',
    severity: 'medium',
    description: '',
    pageUrl: ''
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(canManage ? '/error-reports' : '/error-reports/mine');
      setReports(response.data || []);
    } catch (error) {
      console.error('Unable to load error reports:', error);
      toast.error(error.response?.data?.message || 'Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const submitReport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post('/error-reports', {
        ...form,
        browser: navigator.userAgent.slice(0, 300)
      });
      if (response.notificationSent) {
        toast.success('Votre signalement a été transmis et l’équipe administrative a été alertée.');
      } else {
        toast.error('Signalement enregistré, mais l’alerte à l’administration n’a pas pu être envoyée.');
      }
      setForm({ title: '', category: 'other', severity: 'medium', description: '', pageUrl: '' });
      await loadReports();
    } catch (error) {
      console.error('Unable to submit error report:', error);
      toast.error(error.response?.data?.message || 'Impossible d’envoyer le signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveUpdate = async (report) => {
    const update = updates[report._id] || {};
    setSavingId(report._id);
    try {
      await api.patch(`/error-reports/${report._id}/status`, {
        status: update.status || report.status,
        resolutionNote: update.resolutionNote ?? report.resolutionNote ?? ''
      });
      toast.success('Le suivi du signalement a été mis à jour.');
      await loadReports();
    } catch (error) {
      console.error('Unable to update error report:', error);
      toast.error(error.response?.data?.message || 'Impossible de mettre à jour le signalement.');
    } finally {
      setSavingId(null);
    }
  };

  const sendMessage = async (report) => {
    const content = (messageDrafts[report._id] || '').trim();
    if (!content) return;
    setSendingMessageId(report._id);
    try {
      const response = await api.post(`/error-reports/${report._id}/messages`, { content });
      setReports((current) => current.map((item) => item._id === report._id ? response.data : item));
      setMessageDrafts((current) => ({ ...current, [report._id]: '' }));
      if (!response.notificationSent) {
        toast.error('Message envoyé, mais la notification n’a pas pu être transmise.');
      } else {
        toast.success('Message envoyé.');
      }
    } catch (error) {
      console.error('Unable to send error report message:', error);
      toast.error(error.response?.data?.message || 'Impossible d’envoyer le message.');
    } finally {
      setSendingMessageId(null);
    }
  };

  const setUpdate = (report, field, value) => {
    setUpdates((current) => ({
      ...current,
      [report._id]: {
        status: current[report._id]?.status || report.status,
        resolutionNote: current[report._id]?.resolutionNote ?? report.resolutionNote ?? '',
        [field]: value
      }
    }));
  };

  const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white/15 p-3">
            <ExclamationTriangleIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-100">Assistance</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Signaler une erreur</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
              Décrivez le problème rencontré. L’équipe pourra le suivre et vous communiquer sa résolution.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nouveau signalement</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connecté en tant que {user?.firstName} {user?.lastName}. Les informations du navigateur sont jointes pour faciliter le diagnostic.
          </p>
        </div>

        <form onSubmit={submitReport} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Sujet
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                minLength={5}
                maxLength={120}
                placeholder="Ex. Le pointage ne s’enregistre pas"
                required
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rubrique concernée
              <select
                className={inputClass}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
              Priorité
              <select
                className={inputClass}
                value={form.severity}
                onChange={(event) => setForm({ ...form, severity: event.target.value })}
              >
                <option value="low">Faible — gêne mineure</option>
                <option value="medium">Normale — fonctionnalité dégradée</option>
                <option value="high">Élevée — fonctionnalité importante indisponible</option>
                <option value="critical">Bloquante — impossible de poursuivre mon travail</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
              Page concernée (facultatif)
              <input
                className={inputClass}
                value={form.pageUrl}
                onChange={(event) => setForm({ ...form, pageUrl: event.target.value })}
                maxLength={500}
                placeholder="Ex. /timesheet"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:col-span-2">
              Description détaillée
              <textarea
                className={`${inputClass} min-h-36 resize-y`}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                minLength={20}
                maxLength={3000}
                placeholder="Indiquez ce que vous faisiez, ce qui s’est passé et les étapes pour reproduire le problème."
                required
              />
              <span className="block text-right text-xs font-normal text-gray-400">{form.description.length}/3000 (20 caractères minimum)</span>
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PaperAirplaneIcon className="h-5 w-5" />}
              {submitting ? 'Envoi en cours…' : 'Transmettre le signalement'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {canManage ? 'Centre de suivi' : 'Mes signalements'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {canManage ? 'Consultez les demandes et mettez leur statut à jour.' : 'Suivez ici l’avancement de vos demandes.'}
            </p>
          </div>
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            aria-label="Actualiser les signalements"
            className="rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Chargement des signalements…
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
            <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-3 font-semibold text-gray-800 dark:text-gray-200">Aucun signalement pour le moment</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Les nouveaux signalements apparaîtront ici.</p>
          </div>
        ) : (
          reports.map((report) => {
            const update = updates[report._id] || {};
            const reporterName = report.reporter
              ? `${report.reporter.firstName || ''} ${report.reporter.lastName || ''}`.trim()
              : `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
            return (
              <article key={report._id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white">{report.title}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[report.status] || statusStyles.open}`}>
                        {statusLabels[report.status] || 'Nouveau'}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {severityLabels[report.severity] || severityLabels.medium}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">{report.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                    {formatDate(report.createdAt)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {canManage && <span>Déclaré par : <strong className="text-gray-700 dark:text-gray-200">{reporterName || 'Utilisateur'}</strong>{report.reporter?.email ? ` · ${report.reporter.email}` : ''}</span>}
                  <span>Rubrique : <strong className="text-gray-700 dark:text-gray-200">{categories.find((item) => item.value === report.category)?.label || 'Autre'}</strong></span>
                  {report.pageUrl && <span className="max-w-full truncate">Page : {report.pageUrl}</span>}
                  {canManage && report.browser && <span className="max-w-full truncate" title={report.browser}>Navigateur : {report.browser}</span>}
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-500" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">Conversation</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {report.messages?.length || 0} message{report.messages?.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="max-h-72 space-y-3 overflow-y-auto p-4">
                    {!report.messages?.length ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucun message. Utilisez cet espace pour échanger avec l’équipe.</p>
                    ) : report.messages.map((message) => {
                      const ownMessage = String(message.sender?._id || message.sender) === String(user?._id || user?.id);
                      const senderName = ownMessage
                        ? 'Vous'
                        : message.sender?.role === 'admin' || message.sender?.role === 'supervisor'
                          ? `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || 'Équipe'
                          : `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim() || 'Déclarant';
                      return (
                        <div key={message._id} className={`max-w-[90%] rounded-xl px-3.5 py-3 ${ownMessage ? 'ml-auto bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50 dark:bg-gray-700/60'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{senderName}</span>
                            <time className="text-[11px] text-gray-500 dark:text-gray-400">{formatDate(message.createdAt)}</time>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-gray-700 dark:text-gray-200">{message.content}</p>
                        </div>
                      );
                    })}
                  </div>
                  <form
                    className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sendMessage(report);
                    }}
                  >
                    <input
                      className={inputClass}
                      value={messageDrafts[report._id] || ''}
                      onChange={(event) => setMessageDrafts((current) => ({ ...current, [report._id]: event.target.value }))}
                      maxLength={2000}
                      placeholder="Écrire un message…"
                      aria-label={`Message pour ${report.title}`}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessageId === report._id || !(messageDrafts[report._id] || '').trim()}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingMessageId === report._id ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </form>
                </div>

                {canManage ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                    <label className="space-y-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Statut
                      <select
                        className={inputClass}
                        value={update.status || report.status}
                        onChange={(event) => setUpdate(report, 'status', event.target.value)}
                      >
                        <option value="open">Nouveau</option>
                        <option value="in_progress">En cours</option>
                        <option value="resolved">Résolu</option>
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Note de suivi / réponse
                      <input
                        className={inputClass}
                        maxLength={1500}
                        value={update.resolutionNote ?? report.resolutionNote ?? ''}
                        onChange={(event) => setUpdate(report, 'resolutionNote', event.target.value)}
                        placeholder="Réponse visible par le déclarant"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveUpdate(report)}
                      disabled={savingId === report._id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                    >
                      {savingId === report._id && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                      Enregistrer
                    </button>
                  </div>
                ) : report.resolutionNote ? (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                    <strong>Réponse de l’équipe :</strong> {report.resolutionNote}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default ErrorReports;
