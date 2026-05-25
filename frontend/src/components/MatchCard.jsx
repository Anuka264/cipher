import React from 'react';
import AvatarFrame from './AvatarFrame';
import {
    ACADEMIC_YEAR_OPTIONS,
    COURSE_OPTIONS,
    FACULTY_OPTIONS,
    getSignalLabelKey,
    getOptionLabelKey
} from '../constants/profileOptions';
import { useI18n } from '../context/I18nContext';

const MatchCard = ({ match, onConnect }) => {
    const { t } = useI18n();
    const compatibility = Number(
        match.match_percentage ?? ((1 - (match.distance || 0)) * 100)
    ).toFixed(1);

    let buttonLabel = t('match_connect');
    let disabled = false;

    if (match.connection_status === 'accepted') {
        buttonLabel = t('match_connected');
        disabled = true;
    } else if (match.connection_status === 'pending' && match.has_incoming_request) {
        buttonLabel = t('match_respond_requests');
        disabled = true;
    } else if (match.connection_status === 'pending') {
        buttonLabel = t('match_request_sent');
        disabled = true;
    }

    const localizeAcademic = (value, options) => {
        const labelKey = getOptionLabelKey(options, value);
        return labelKey ? t(labelKey) : value;
    };

    const localizeSignal = (value) => {
        const labelKey = getSignalLabelKey(value);
        return labelKey ? t(labelKey) : value;
    };

    const localizeIntensity = (value) => {
        const map = {
            Casual: 'common_casual',
            Dedicated: 'common_dedicated',
            Vanguard: 'common_vanguard'
        };

        return map[value] ? t(map[value]) : value;
    };

    return (
        <div className="match-card">
            <div className="match-header">
                <div className="profile-strip-main">
                    <AvatarFrame src={match.profile_photo_url} name={match.name} size="small" />
                    <h3 style={{ margin: 0 }}>{match.name}</h3>
                </div>
                <span className={`intensity-badge ${match.intensity_level.toLowerCase()}`}>
                    {localizeIntensity(match.intensity_level)}
                </span>
            </div>
            
            <div className="match-stats">
                <p>{t('match_score')}: <strong>{compatibility}%</strong></p>
            </div>

            <p className="match-bio">
                {match.profile_summary || match.bio || t('match_summary_fallback')}
            </p>

            {Boolean(match.faculty || match.course || match.academic_year) && (
                <div className="soft-copy">
                    {[
                        localizeAcademic(match.faculty, FACULTY_OPTIONS),
                        localizeAcademic(match.course, COURSE_OPTIONS),
                        localizeAcademic(match.academic_year, ACADEMIC_YEAR_OPTIONS)
                    ].filter(Boolean).join(' • ')}
                </div>
            )}

            {Array.isArray(match.shared_context) && match.shared_context.length > 0 && (
                <div className="tag-row">
                    {match.shared_context.map((item) => (
                        <span key={item} className="tag">{localizeSignal(item)}</span>
                    ))}
                </div>
            )}

            <div className="tag-row">
                {(match.goals || []).slice(0, 2).map((item) => (
                    <span key={`goal-${item}`} className="tag">{localizeSignal(item)}</span>
                ))}
                {(match.skills || []).slice(0, 2).map((item) => (
                    <span key={`skill-${item}`} className="tag">{localizeSignal(item)}</span>
                ))}
            </div>

            {match.score_breakdown && (
                <div className="score-breakdown">
                    <div className="score-item">
                        <strong>{t('match_semantic')}</strong>
                        <span>{match.score_breakdown.semantic}%</span>
                    </div>
                    <div className="score-item">
                        <strong>{t('match_goals')}</strong>
                        <span>{match.score_breakdown.goals}%</span>
                    </div>
                    <div className="score-item">
                        <strong>{t('match_skills')}</strong>
                        <span>{match.score_breakdown.skills}%</span>
                    </div>
                    <div className="score-item">
                        <strong>{t('match_intensity')}</strong>
                        <span>{match.score_breakdown.intensity}%</span>
                    </div>
                </div>
            )}

            <button 
                onClick={() => onConnect(match.id)}
                className="primary-button"
                disabled={disabled}
                style={{ marginTop: '16px' }}
            >
                {buttonLabel}
            </button>
        </div>
    );
};

export default MatchCard;
