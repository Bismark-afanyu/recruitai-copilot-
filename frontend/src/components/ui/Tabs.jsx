import { useState, useEffect } from "react";

export default function Tabs({ tabs, defaultTab, onChange, className = "" }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedTab, setDisplayedTab] = useState(defaultTab || tabs[0]?.id);

  useEffect(() => {
    if (activeTab !== displayedTab) {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setDisplayedTab(activeTab);
        requestAnimationFrame(() => setIsAnimating(true));
      }, 100);
      return () => clearTimeout(timer);
    } else {
      requestAnimationFrame(() => setIsAnimating(true));
    }
  }, [activeTab]);

  const handleChange = (tabId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      onChange?.(tabId);
    }
  };

  const activeTabData = tabs.find((t) => t.id === displayedTab);

  return (
    <div className={className}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 press-scale ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      {activeTabData?.content && (
        <div className={`py-4 transition-all duration-200 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}>
          {activeTabData.content}
        </div>
      )}
    </div>
  );
}

export function TabPanel({ children, active, id }) {
  if (active !== id) return null;
  return (
    <div className="fade-in">
      {children}
    </div>
  );
}
