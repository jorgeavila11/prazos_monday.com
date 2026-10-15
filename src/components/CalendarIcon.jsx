import React from "react";

/** Ícone de calendário/cronograma ao lado do título (desenho próprio, sem dependência). */
const CalendarIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="prazo-icon">
    <rect x="3" y="4.5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="2.5" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="2.5" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="6" y="11.5" width="7" height="2" rx="1" fill="currentColor" />
    <rect x="9" y="15" width="8" height="2" rx="1" fill="currentColor" />
  </svg>
);

export default CalendarIcon;
