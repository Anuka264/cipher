import React from 'react';

const SectionCard = ({ title, subtitle, actions, children }) => (
    <section className="section-card">
        {(title || subtitle || actions) && (
            <div className="split-row" style={{ marginBottom: '16px' }}>
                <div>
                    {title && <h2 className="section-title">{title}</h2>}
                    {subtitle && <p className="section-kicker">{subtitle}</p>}
                </div>
                {actions}
            </div>
        )}
        {children}
    </section>
);

export default SectionCard;
