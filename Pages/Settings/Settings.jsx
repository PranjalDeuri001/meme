/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/store/authSlice.js";
import "./Settings.css";
import PropTypes from "prop-types";

// --- Icon Imports ---
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import SettingsEthernetOutlinedIcon from "@mui/icons-material/SettingsEthernetOutlined";

// --- Main Section Component Imports ---
import AccountBasics from "./components/AccountBasics.jsx";
import AccountPrivacy from "./components/AccountPrivacy.jsx";
import ChangePassword from "./components/ChangePassword.jsx";
import Card from "./ui/Card.jsx";

// --- Helper Components (defined in-file) ---
const PageHeader = ({ title }) => (
  <div className="page-h">
    <h1>{title}</h1>
  </div>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

const LeftNav = ({ activeSection, onSectionChange }) => {
  const currentUser = useSelector(selectCurrentUser);

  if (!currentUser) {
    return (
      <aside className="side">
        <div className="nav-group"></div>
        <div className="user-mini">
          <div className="mini-avatar"></div>
          <div className="mini-meta">
            <div className="mini-name">Loading...</div>
          </div>
        </div>
      </aside>
    );
  }

  const avatarColor = useMemo(() => {
    const colors = [
      "#60a5fa",
      "#f87171",
      "#4ade80",
      "#fbbf24",
      "#c084fc",
      "#34d399",
      "#f97316",
      "#06b6d4",
    ];
    let hash = 0;
    const name = currentUser.username || "";
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash % colors.length)];
  }, [currentUser.username]);

  const initials = useMemo(() => {
    const name = currentUser.name || currentUser.username || "";
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[1])
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [currentUser.name, currentUser.username]);

  const NavItem = ({ icon, id, label }) => (
    <button
      className={`nav-item ${activeSection === id ? "active" : ""}`}
      onClick={() => onSectionChange(id)}
    >
      <div className="nav-ic">{icon}</div>
      <span>{label}</span>
    </button>
  );

  // --- PropTypes for NavItem ---
  NavItem.propTypes = {
    icon: PropTypes.node.isRequired,
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  };

  return (
    <aside className="side">
      <div className="nav-group">
        <div className="nav-title">PERSONAL</div>
        <NavItem
          icon={<AccountCircleOutlinedIcon />}
          id="account"
          label="Account"
        />
        <NavItem
          icon={<NotificationsOutlinedIcon />}
          id="notifications"
          label="Notifications"
        />
        <NavItem icon={<LockOutlinedIcon />} id="security" label="Security" />
      </div>
      <div className="nav-group">
        <div className="nav-title">ORGANIZATION</div>
        <NavItem
          icon={<CreditCardOutlinedIcon />}
          id="billing"
          label="Billing & plans"
        />
        <NavItem icon={<GroupOutlinedIcon />} id="team" label="Team" />
        <NavItem
          icon={<SettingsEthernetOutlinedIcon />}
          id="integrations"
          label="Integrations"
        />
      </div>
      <div className="user-mini">
        <div
          className="mini-avatar"
          style={{
            backgroundImage: currentUser.avatar
              ? `url(${currentUser.avatar})`
              : "none",
            backgroundColor: currentUser.avatar ? "transparent" : avatarColor,
          }}
        >
          {!currentUser.avatar && initials}
        </div>
        <div className="mini-meta">
          <div className="mini-name">
            {currentUser.name || currentUser.username}
          </div>
          <div className="mini-email">{currentUser.email}</div>
        </div>
      </div>
    </aside>
  );
};

// --- PropTypes for LeftNav ---
LeftNav.propTypes = {
  activeSection: PropTypes.string.isRequired,
  onSectionChange: PropTypes.func.isRequired,
};

// --- Main Settings Page Component ---
export default function Settings() {
  const [section, setSection] = useState("account");

  const renderSection = () => {
    switch (section) {
      case "account":
        return (
          <>
            <PageHeader title="Account Settings" />
            <AccountBasics />
            <AccountPrivacy />
          </>
        );
      case "security":
        return (
          <>
            <PageHeader title="Security" />
            <ChangePassword />
          </>
        );
      case "notifications":
        return (
          <>
            <PageHeader title="Notifications" />
            <Card icon={<NotificationsOutlinedIcon />} title="Notifications">
              <p>Notification settings will be configured here.</p>
            </Card>
          </>
        );
      case "billing":
        return (
          <>
            <PageHeader title="Billing & Plans" />
            <Card icon={<CreditCardOutlinedIcon />} title="Billing & Plans">
              <p>Billing and plan management will be available here.</p>
            </Card>
          </>
        );
      case "team":
        return (
          <>
            <PageHeader title="Team" />
            <Card icon={<GroupOutlinedIcon />} title="Team">
              <p>Team member management will be available here.</p>
            </Card>
          </>
        );
      case "integrations":
        return (
          <>
            <PageHeader title="Integrations" />
            <Card icon={<SettingsEthernetOutlinedIcon />} title="Integrations">
              <p>API and third-party integrations will be managed here.</p>
            </Card>
          </>
        );
      default:
        return <PageHeader title="Account Settings" />;
    }
  };

  return (
    <div className="settings">
      <LeftNav activeSection={section} onSectionChange={setSection} />
      <main className="settings-content">{renderSection()}</main>
    </div>
  );
}
