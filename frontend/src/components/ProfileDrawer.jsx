import React from "react";

function ProfileDrawer({ isOpen, onClose, user }) {
  if (!isOpen) return null;

  return (
    <div className="profile-drawer">
      <button onClick={onClose}>Close</button>
      <h2>Profile</h2>
      {user && <p>{user.name}</p>}
    </div>
  );
}

export default ProfileDrawer;