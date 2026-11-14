import React, { useState } from 'react';

/** Picture backing for a pack cover. Renders nothing if the image isn't there. */
export const PackCoverImage: React.FC<{ packId: string }> = ({ packId }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <>
      <img
        src={`${import.meta.env.BASE_URL}packs/${packId}.jpg`}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setFailed(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/55" />
    </>
  );
};
