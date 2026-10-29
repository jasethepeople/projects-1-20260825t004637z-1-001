import React from 'react';

const CRTEffect = React.memo(function CRTEffect() {
  return (
    <>
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
          zIndex: 1000,
        }}
        aria-hidden="true"
      />
      {/* Vignette overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.5) 100%)',
          zIndex: 999,
        }}
        aria-hidden="true"
      />
    </>
  );
});

export default CRTEffect;
