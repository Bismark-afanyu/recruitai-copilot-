import { useState, useRef, useEffect } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";

export default function DropdownMenu({ items, trigger, align = "right" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const open = () => {
    setIsOpen(true);
    requestAnimationFrame(() => setIsAnimating(true));
  };

  const close = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 100);
  };

  const alignClasses = {
    left: "left-0",
    right: "right-0",
  };

  return (
    <div className="relative" ref={menuRef}>
      {trigger ? (
        <div onClick={() => isOpen ? close() : open()}>{trigger}</div>
      ) : (
        <button
          onClick={() => isOpen ? close() : open()}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors press-scale"
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      )}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 transition-all duration-100 origin-top-right ${
            alignClasses[align]
          } ${
            isAnimating
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="my-1 border-t border-gray-100 dark:border-gray-700" />;
            }
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  close();
                }}
                disabled={item.disabled}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                  item.danger
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
