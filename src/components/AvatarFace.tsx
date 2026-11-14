import React, { useState } from 'react';
import { HistoricalAvatar } from '../data/avatars';

/** Portrait for an avatar, falling back to its emoji badge if the image is missing. */
export const AvatarFace: React.FC<{ avatar: HistoricalAvatar }> = ({ avatar }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{avatar.badge}</>;
  return (
    <img
      src={`${import.meta.env.BASE_URL}avatars/${avatar.id}.jpg`}
      alt={avatar.name}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );
};
