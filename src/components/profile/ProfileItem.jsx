import React from 'react';

function ProfileItem({ text, isLast = false }) {
  return (
    <div className={`profile-item ${isLast ? 'last-item' : ''}`}>
      <div className="profile-item-icon"></div>
      <span className="profile-item-text">{text}</span>
      <div className="profile-item-arrow">›</div>
    </div>
  );
}

export default ProfileItem;