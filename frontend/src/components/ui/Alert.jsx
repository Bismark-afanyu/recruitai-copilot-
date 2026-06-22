import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const variants = {
  success: {
    container: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
    text: "text-emerald-700 dark:text-emerald-300",
  },
  error: {
    container: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800",
    icon: <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />,
    text: "text-rose-700 dark:text-rose-300",
  },
  warning: {
    container: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
    text: "text-amber-700 dark:text-amber-300",
  },
  info: {
    container: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
    icon: <InformationCircleIcon className="w-5 h-5 text-sky-500" />,
    text: "text-sky-700 dark:text-sky-300",
  },
};

export default function Alert({ variant = "info", title, children, onClose, dismissible = false, className = "" }) {
  const style = variants[variant];
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsAnimating(true));
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      isAnimating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
    } ${style.container} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          {title && <h4 className={`text-sm font-semibold ${style.text}`}>{title}</h4>}
          <div className={`text-sm ${style.text} ${title ? "mt-1" : ""}`}>{children}</div>
        </div>
        {(onClose || dismissible) && (
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors press-scale ${style.text}`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
