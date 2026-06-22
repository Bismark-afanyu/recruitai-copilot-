import { useState } from "react";
import { useTheme } from "../components/ThemeContext.jsx";
import { Input, TextArea, Toggle, Select } from "../components/ui/Form.jsx";
import Button from "../components/ui/Button.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Alert from "../components/ui/Alert.jsx";
import showToast from "../components/ui/Toast.jsx";
import {
  UserIcon,
  UserGroupIcon,
  BoltIcon,
  BellIcon,
  CreditCardIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

function ProfileSettings() {
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@recruitai.com");
  const [company, setCompany] = useState("RecruitAI Inc.");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    showToast.success("Profile updated successfully");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="mt-6">
          <Button onClick={save} loading={saving}>
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <Input label="Current Password" type="password" placeholder="Enter current password" />
          <div className="md:col-span-2" />
          <Input label="New Password" type="password" placeholder="Enter new password" />
          <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
        </div>
        <div className="mt-6">
          <Button variant="secondary">Update Password</Button>
        </div>
      </div>
    </div>
  );
}

function TeamSettings() {
  const members = [
    { name: "Admin User", email: "admin@recruitai.com", role: "Admin", status: "active" },
    { name: "Sarah Johnson", email: "sarah@recruitai.com", role: "Recruiter", status: "active" },
    { name: "Mike Chen", email: "mike@recruitai.com", role: "Interviewer", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
          <Button size="sm">
            <UserGroupIcon className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {members.map((member) => (
            <div key={member.email} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {member.role}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  {member.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IntegrationSettings() {
  const integrations = [
    { name: "Google Calendar", description: "Sync interviews with your calendar", connected: true },
    { name: "Slack", description: "Get notifications in your Slack channels", connected: false },
    { name: "LinkedIn", description: "Import candidates from LinkedIn", connected: true },
    { name: "Gmail", description: "Send emails directly from RecruitAI", connected: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{integration.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{integration.description}</p>
              </div>
              <Button
                size="sm"
                variant={integration.connected ? "secondary" : "primary"}
              >
                {integration.connected ? "Connected" : "Connect"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [candidateUpdates, setCandidateUpdates] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive email updates for important events</p>
            </div>
            <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get push notifications in your browser</p>
            </div>
            <Toggle checked={pushNotifs} onChange={setPushNotifs} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly Digest</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receive a weekly summary of hiring activity</p>
            </div>
            <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Candidate Updates</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when candidate status changes</p>
            </div>
            <Toggle checked={candidateUpdates} onChange={setCandidateUpdates} />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => showToast.success("Notification preferences saved")}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <MoonIcon className="w-5 h-5 text-indigo-500" />
              ) : (
                <SunIcon className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Currently using {theme} mode
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "team", label: "Team", icon: UserGroupIcon },
  { id: "integrations", label: "Integrations", icon: BoltIcon },
  { id: "notifications", label: "Notifications", icon: BellIcon },
  { id: "appearance", label: "Appearance", icon: SunIcon },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "appearance":
        return <AppearanceSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
