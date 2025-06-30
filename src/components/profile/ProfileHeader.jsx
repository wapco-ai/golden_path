import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

function ProfileHeader({ name, location, phone = "+98-9123456789" }) {
  const intl = useIntl();
  const displayName = name || intl.formatMessage({ id: 'defaultUserName' });
  const displayLocation = location || intl.formatMessage({ id: 'defaultLocation' });
  return (
    <div className="profile-header">
      {/* Profile Picture with Add Button */}
      <div className="profile-avatar-container">
        <div className="profile-avatar">
          {/* Profile image placeholder */}
        </div>
        <div className="avatar-add-button">+</div>
      </div>

      {/* User Information */}
      <h3 className="profile-name">{displayName}</h3>
      <p className="profile-location">{displayLocation}</p>
      <p className="profile-phone">{phone}</p>
      
      {/* Complete Profile Button */}
      <button className="profile-complete-btn">
        <FormattedMessage id="completeProfile" />
      </button>
    </div>
  );
}

export default ProfileHeader;