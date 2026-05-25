import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import AvatarFrame from '../components/AvatarFrame';
import { useAuth } from '../context/AuthContext';
import { chatLanguageOptions, useI18n } from '../context/I18nContext';
import {
    getConversations,
    getConversationMessages,
    sendMessage as sendMessageRequest,
    translateMessage as translateMessageRequest
} from '../services/messageService';

const formatMessageTime = (value, locale) => {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleString(locale);
};

const MessagesPage = () => {
    const location = useLocation();
    const { t, locale } = useI18n();
    const { session } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(location.state?.selectedUserId || '');
    const [thread, setThread] = useState([]);
    const [threadMeta, setThreadMeta] = useState(null);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState('');
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [translations, setTranslations] = useState({});
    const [translatingId, setTranslatingId] = useState('');

    const loadConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
            if (!selectedUserId && data.length > 0) {
                setSelectedUserId(data[0].user_id);
            }
        } catch (loadError) {
            setError(t('messages_load_error'));
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (location.state?.selectedUserId) {
            setSelectedUserId(location.state.selectedUserId);
        }
    }, [location.state]);

    useEffect(() => {
        if (!selectedUserId) {
            setThread([]);
            setThreadMeta(null);
            return;
        }

        const loadThread = async () => {
            setLoadingThread(true);
            setError('');
            try {
                const data = await getConversationMessages(selectedUserId);
                setThread(data.messages);
                setThreadMeta(data.connection);
                await loadConversations();
            } catch (threadError) {
                setError(threadError?.response?.data?.error || t('messages_thread_error'));
            } finally {
                setLoadingThread(false);
            }
        };

        loadThread();
    }, [selectedUserId]);

    const selectedConversation = useMemo(
        () => conversations.find((conversation) => conversation.user_id === selectedUserId),
        [conversations, selectedUserId]
    );

    const localizeIntensity = (value) => {
        const map = {
            Casual: 'common_casual',
            Dedicated: 'common_dedicated',
            Vanguard: 'common_vanguard'
        };

        return map[value] ? t(map[value]) : value;
    };

    const handleSend = async (event) => {
        event.preventDefault();
        if (!draft.trim() || !selectedUserId) {
            return;
        }

        setSending(true);
        setError('');
        try {
            const response = await sendMessageRequest(selectedUserId, draft);
            setThread((current) => [...current, response.message]);
            setDraft('');
            await loadConversations();
        } catch (sendError) {
            setError(sendError?.response?.data?.error || t('messages_send_error'));
        } finally {
            setSending(false);
        }
    };

    const handleTranslate = async (message) => {
        const targetLanguageCode = session?.preferred_chat_language || locale;
        const targetLanguageLabel = chatLanguageOptions.find((item) => item.value === targetLanguageCode)?.label || 'English';

        setTranslatingId(message.id);
        setError('');
        try {
            const response = await translateMessageRequest(message.content, targetLanguageCode);
            setTranslations((current) => ({
                ...current,
                [message.id]: {
                    text: response.translation,
                    label: targetLanguageLabel
                }
            }));
        } catch (translateError) {
            setError(translateError?.response?.data?.error || t('messages_translate_unavailable'));
        } finally {
            setTranslatingId('');
        }
    };

    return (
        <div className="page">
            <header className="page-header">
                <div>
	                <div className="brand-mark">{t('nav_messages')}</div>
                    <h1>{t('messages_title')}</h1>
                    <p className="soft-copy">{t('messages_subtitle')}</p>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="page-grid">
	                <SectionCard title={t('messages_conversations')} subtitle={t('messages_conversations_subtitle')}>
                    {conversations.length > 0 ? (
                        <div className="request-list">
                            {conversations.map((conversation) => (
                                <button
                                    key={conversation.connection_id}
                                    type="button"
                                    className="connection-card"
                                    onClick={() => setSelectedUserId(conversation.user_id)}
                                    style={{
                                        textAlign: 'left',
                                        borderColor: selectedUserId === conversation.user_id
                                            ? 'rgba(143, 240, 210, 0.45)'
                                            : 'rgba(120, 204, 255, 0.18)'
                                    }}
                                >
                                    <div className="split-row">
                                        <div className="profile-strip-main">
                                            <AvatarFrame src={conversation.profile_photo_url} name={conversation.name || conversation.email} size="small" />
                                            <strong>{conversation.name || conversation.email}</strong>
                                        </div>
                                        <span className={`intensity-badge ${(conversation.intensity_level || 'dedicated').toLowerCase()}`}>
                                            {localizeIntensity(conversation.intensity_level)}
                                        </span>
                                    </div>
                                    <div className="soft-copy" style={{ marginTop: '8px' }}>
	                                        {conversation.last_message || t('messages_no_messages_yet')}
	                                    </div>
	                                    <div className="split-row" style={{ marginTop: '10px' }}>
	                                        <span className="soft-copy">{formatMessageTime(conversation.last_message_at, locale)}</span>
	                                        {conversation.unread_count > 0 && (
	                                            <span className="status-pill">{conversation.unread_count} {t('messages_unread')}</span>
	                                        )}
	                                    </div>
                                </button>
                            ))}
                        </div>
	                    ) : (
	                        <div className="empty-state">
	                            <p>{t('messages_empty_conversations')}</p>
	                        </div>
	                    )}
	                </SectionCard>

	                <SectionCard
	                    title={threadMeta ? `${t('messages_chat_with')} ${threadMeta.name || threadMeta.email}` : t('messages_conversation')}
	                    subtitle={t('messages_chat_subtitle')}
	                >
                    {selectedConversation && (
                        <div className="profile-strip-main" style={{ marginBottom: '12px' }}>
                            <AvatarFrame src={selectedConversation.profile_photo_url} name={selectedConversation.name || selectedConversation.email} size="small" />
                            <div className="soft-copy">{selectedConversation.email}</div>
                        </div>
                    )}

	                    <div className="request-list" style={{ marginBottom: '16px' }}>
	                        {loadingThread ? (
	                            <div className="info-banner">{t('messages_loading')}</div>
	                        ) : thread.length > 0 ? (
                            thread.map((message) => (
                                <div
                                    key={message.id}
                                    className="request-card"
                                    style={{
                                        marginLeft: message.from_self ? 'auto' : '0',
                                        maxWidth: '88%',
                                        background: message.from_self
                                            ? 'rgba(143, 240, 210, 0.12)'
                                            : 'rgba(255, 255, 255, 0.03)'
                                    }}
                                >
                                    <div>{message.content}</div>
                                    <div className="inline-actions" style={{ marginTop: '10px' }}>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            onClick={() => handleTranslate(message)}
                                            disabled={translatingId === message.id}
                                        >
                                            {translatingId === message.id ? '...' : t('messages_translate')}
                                        </button>
                                    </div>
                                    {translations[message.id] && (
                                        <div className="translation-panel">
                                            <strong>{t('messages_translated')} · {t('messages_translated_to')} {translations[message.id].label}</strong>
                                            <div>{translations[message.id].text}</div>
                                        </div>
                                    )}
                                    <div className="soft-copy" style={{ marginTop: '8px' }}>
                                        {formatMessageTime(message.created_at, locale)}
                                    </div>
                                </div>
                            ))
	                        ) : (
	                            <div className="empty-state">
	                                <p>{t('messages_empty_thread')}</p>
	                            </div>
	                        )}
	                    </div>

	                    <form className="form-grid" onSubmit={handleSend}>
	                        <div className="field">
	                            <label htmlFor="message-draft">{t('messages_message_label')}</label>
	                            <textarea
	                                id="message-draft"
	                                value={draft}
	                                onChange={(event) => setDraft(event.target.value)}
	                                placeholder={t('messages_message_placeholder')}
	                                disabled={!selectedUserId}
	                            />
	                        </div>
	                        <div className="inline-actions">
	                            <button className="primary-button" type="submit" disabled={!selectedUserId || sending}>
	                                {sending ? t('messages_sending') : t('messages_send')}
	                            </button>
	                        </div>
	                    </form>
                </SectionCard>
            </div>
        </div>
    );
};

export default MessagesPage;
