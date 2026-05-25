import React from 'react';

const AvatarFrame = ({ src, name, size = 'medium', className = '' }) => {
    const fallback = String(name || '?').trim().charAt(0).toUpperCase() || '?';

    return (
        <div className={`avatar-frame avatar-${size} ${className}`.trim()}>
            {src ? (
                <img src={src} alt={name || 'Profile avatar'} />
            ) : (
                <span>{fallback}</span>
            )}
        </div>
    );
};

export default AvatarFrame;
