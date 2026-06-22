import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const toastStyles = {
  success: {
    className: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
  },
  error: {
    className: "bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800",
    icon: <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />,
  },
  warning: {
    className: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
    icon: <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />,
  },
  info: {
    className: "bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800",
    icon: <InformationCircleIcon className="w-5 h-5 text-sky-500" />,
  },
};

const defaultOptions = {
  duration: 4000,
  position: "top-right",
  style: {
    borderRadius: "12px",
    padding: "12px 16px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
  },
};

export const toastPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || "Loading...",
    success: messages.success || "Success!",
    error: messages.error || "Something went wrong",
    ...defaultOptions,
  });
};

export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
    });
  },
  error: (message, options = {}) => {
    return toast.error(message, {
      ...defaultOptions,
      duration: 5000,
      ...options,
    });
  },
  warning: (message, options = {}) => {
    return toast(message, {
      icon: toastStyles.warning.icon,
      className: `border ${toastStyles.warning.className}`,
      ...defaultOptions,
      ...options,
    });
  },
  info: (message, options = {}) => {
    return toast(message, {
      icon: toastStyles.info.icon,
      className: `border ${toastStyles.info.className}`,
      ...defaultOptions,
      ...options,
    });
  },
  custom: (content, options = {}) => {
    return toast(content, {
      ...defaultOptions,
      ...options,
    });
  },
};

export default showToast;
