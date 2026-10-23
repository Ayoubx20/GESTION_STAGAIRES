import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PaperAirplaneIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const endOfMessagesRef = useRef(null);

  const selectedContact = useMemo(
    () => contacts.find((contact) => String(contact._id) === String(selectedUserId)) || null,
    [contacts, selectedUserId]
  );

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchConversation(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUserId]);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await api.get('/notifications/contacts');
      if (!response.success) {
        throw new Error(response.message || 'Impossible de charger les contacts');
      }

      const users = response.users || [];
      setContacts(users);
      if (users.length > 0 && !selectedUserId) {
        setSelectedUserId(users[0]._id);
      }
    } catch (error) {
      console.error('Erreur contacts:', error);
      toast.error(error.message || 'Erreur lors du chargement des contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchConversation = async (recipientId) => {
    if (!recipientId) return;
    try {
      setLoadingConversation(true);
      const response = await api.get(`/notifications/messages?with=${recipientId}`);
      if (!response.success) {
        throw new Error(response.message || 'Impossible de charger le message');
      }
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Erreur conversation:', error);
      toast.error(error.message || 'Erreur lors du chargement de la conversation');
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedUserId || !draft.trim()) return;

    try {
      setSending(true);
      const response = await api.post('/notifications/messages', {
        recipient: selectedUserId,
        content: draft.trim()
      });

      if (!response.success) {
        throw new Error(response.message || 'Message non envoyé');
      }

      setDraft('');
      await fetchConversation(selectedUserId);
      await fetchContacts();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l’envoi du message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
            Messagerie
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500" />
          {contacts.length} contacts
        </div>
      </div>

      <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/60 lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contacts</h2>
          </div>

          <div className="max-h-[calc(70vh-72px)] overflow-y-auto">
            {loadingContacts ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Chargement des contacts...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Aucun contact disponible.</div>
            ) : (
              contacts.map((contact) => {
                const isActive = String(contact._id) === String(selectedUserId);
                return (
                  <button
                    key={contact._id}
                    type="button"
                    onClick={() => setSelectedUserId(contact._id)}
                    className={`flex w-full items-center gap-3 border-b border-gray-200 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white dark:border-gray-700 dark:hover:bg-gray-800 ${
                      isActive ? 'bg-white dark:bg-gray-800' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      <UserCircleIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{contact.role}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {selectedContact ? (
            <>
              <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContact.role}</p>
                </div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-900/40">
                {loadingConversation ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Chargement de la conversation...</div>
                ) : messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Aucun message. Démarrez la conversation.
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = String(message.sender?._id || message.sender) === String(user?._id || user?.id);
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                            isOwnMessage
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                            {isOwnMessage ? 'Vous' : `${message.sender?.firstName || ''} ${message.sender?.lastName || ''}`.trim()}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                          <p className={`mt-2 text-[11px] ${isOwnMessage ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {format(new Date(message.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endOfMessagesRef} />
              </div>

              <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex gap-3">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Écrire à ${selectedContact.firstName}...`}
                    className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-primary-300"
                  >
                    {sending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Envoi...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <PaperAirplaneIcon className="h-4 w-4" />
                        Envoyer
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-center text-gray-500 dark:text-gray-400">
              Sélectionnez un contact pour démarrer une conversation.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MessagesPage;
