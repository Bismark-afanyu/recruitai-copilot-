export default function Card({ children, className = "", padding = true }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
