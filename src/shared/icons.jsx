const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  box: "m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v10",
  truck:
    "M3 5h11v12H3z M14 9h4l3 4v4h-7 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4 M17 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  file: "M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3",
  wallet: "M3 6h17v15H3z M3 6V3h14v3 M16 11h5v5h-5z",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-5",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
  bell: "M5 16h14l-2-3V8a5 5 0 0 0-10 0v5l-2 3 M10 20h4",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 1v3 M12 20v3 M1 12h3 M20 12h3 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2",
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10",
  logout: "M9 3H3v18h6 M9 12h12 M17 8l4 4-4 4",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14 M5 12h14",
  close: "m6 6 12 12 M18 6 6 18",
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-5 5-5 13 0 18 5-5 5-13 0-18",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 14-1l1 6 M19 17a8 8 0 0 1-14 1l-1-6",
  leaf: "M20 3C6 2 2 12 7 17s15 0 13-14ZM4 21 16 9",
};
export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}
