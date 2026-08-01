/* Icônes : un seul jeu de tracés, un composant unique. */
const ICONS = {
compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 5-4.8 2 2.2-5z"/>',
list:'<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
plane:'<path d="M2 19l20-7L2 5l3.5 7z"/>',
bed:'<path d="M3 18V8m0 6h18v4M3 14h18v-3a2 2 0 00-2-2H9v5"/><circle cx="6" cy="10.5" r="1.4"/>',
wallet:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h2M3 9.5h18"/>',
shield:'<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
car:'<path d="M4 15l1.6-5A2 2 0 017.5 8.5h9a2 2 0 011.9 1.5L20 15v4h-2.4v-1.6H6.4V19H4z"/><circle cx="7.6" cy="15" r="1.1"/><circle cx="16.4" cy="15" r="1.1"/>',
food:'<path d="M5 3v8m3-8v8M6.5 11V21M5 3c0 3 3 3 3 0"/><path d="M15 3c-1.8 1.5-2.5 4-2 7h4.5V21"/>',
cloud:'<path d="M7 18a4.5 4.5 0 01-.4-9A5.5 5.5 0 0117.3 9.7 3.8 3.8 0 0117 18z"/>',
bag:'<rect x="5" y="8" width="14" height="12" rx="2.5"/><path d="M9 8V6.5A3 3 0 0115 6.5V8"/>',
check:'<path d="M4.5 12.5l5 5L19.5 7"/>',
alert:'<path d="M12 3l10 17H2z"/><path d="M12 10v4.5m0 3v.1"/>',
info:'<circle cx="12" cy="12" r="9"/><path d="M12 10.5V17m0-9.5v-.1"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
users:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0111 0"/><path d="M16 5.8a3 3 0 010 5.6M20.5 19a5.4 5.4 0 00-4-5"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
moon:'<path d="M20 13.5A8 8 0 0110.5 4 8 8 0 1020 13.5z"/>',
heart:'<path d="M12 20s-7.5-4.6-9.3-9.3C1.4 7.2 3.7 4.5 6.6 4.5c2 0 3.7 1.1 4.4 2.7h2c.7-1.6 2.4-2.7 4.4-2.7 2.9 0 5.2 2.7 3.9 6.2C19.5 15.4 12 20 12 20z"/>',
spark:'<path d="M12 3l1.7 5.8L19.5 10.5l-5.8 1.7L12 18l-1.7-5.8L4.5 10.5l5.8-1.7z"/>',
cam:'<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="4"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/>',
rain:'<path d="M7 15a4.5 4.5 0 01-.4-9A5.5 5.5 0 0117.3 6.7 3.8 3.8 0 0117 15z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/>',
walk:'<circle cx="13" cy="4.5" r="1.6"/><path d="M10 21l2.2-5.5L10.5 12l1-4.5 3 1.5 2 3M10.5 12l-2.5 2 .5 3.5M14.5 21l-1.3-4.2"/>',
train:'<rect x="5.5" y="3.5" width="13" height="13.5" rx="3"/><path d="M5.5 11h13M9 21l1.5-3h3L15 21m-6.5-6h.1m6.4 0h.1"/>',
scoot:'<circle cx="6" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M6 17.5h8l2-7h3M13 6.5h2.6l.9 4"/>',
landmark:'<path d="M3.5 20h17M5 20V10m4 10V10m6 10V10m4 10V10"/><path d="M12 3.5L21 9H3z"/>',
map:'<path d="M9 4.5L3.5 6.8V20l5.5-2.3 6 2.3 5.5-2.3V4.5L15 6.8z"/><path d="M9 4.5v13M15 6.8v13"/>',
leaf:'<path d="M5 19C5 9 12 4 20 4c0 9-5 15-13 15"/><path d="M5 19c3-5 7-8 11-10"/>',
send:'<path d="M3 20l18-8L3 4l4 8-4 8z"/>'
};

export function Icon({ name, className, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={className} style={style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.info }} />
  );
}

export function Chip({ children, tone = "", icon, dot }) {
  return (
    <span className={"chip " + tone}>
      {dot && <span className="dot" />}
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

export const PLANE = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M1 21 L23 12 L1 3 L5.5 12 Z" />
  </svg>
);
