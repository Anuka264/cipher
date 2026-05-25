import React, { useState } from 'react';
import { consultOracle } from '../services/oracleService';
import SectionCard from './SectionCard';
import { useI18n } from '../context/I18nContext';

const OracleChat = ({ onResultsFound }) => {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleConsult = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        try {
            const data = await consultOracle(query);
            setResponse(data);
            if (onResultsFound) {
                onResultsFound(data.matches || []);
            }
        } catch (err) {
            setError(err?.response?.data?.error || t('oracle_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SectionCard
            title={t('oracle_title')}
            subtitle={t('oracle_subtitle')}
        >
            <div className="panel-grid">
                {response ? (
                    <div className="oracle-advice">
                        <p className="typewriter">{response.advice}</p>
                    </div>
                ) : (
                    <p>{t('oracle_waiting')}</p>
                )}

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleConsult} className="form-grid">
                    <div className="field">
                        <label htmlFor="oracle-query">{t('oracle_prompt')}</label>
                        <textarea
                            id="oracle-query"
                            placeholder={t('oracle_placeholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="inline-actions">
                        <button type="submit" className="primary-button" disabled={loading}>
                            {loading ? t('oracle_interpreting') : t('oracle_consult')}
                        </button>
                    </div>
                </form>
            </div>
        </SectionCard>
    );
};

export default OracleChat;
