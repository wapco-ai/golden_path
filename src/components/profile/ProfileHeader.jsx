import React from 'react';

function ProfileHeader({ name = "کاربر مسیربایی", 
                      location = "استان قدس", 
                      phone = "+98-9123456789" }) {
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
      <h3 className="profile-name">{name}</h3>
      <p className="profile-location">{location}</p>
      <p className="profile-phone">{phone}</p>
      
      {/* Complete Profile Button */}
      <button className="profile-complete-btn">
        تکمیل پروفایل
      </button>
    </div>
  );
}

export default ProfileHeader;