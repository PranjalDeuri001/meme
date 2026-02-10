 import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUser } from "@/store/authSlice.js";

import Card from "../ui/Card.jsx";
import FeedbackNotice from "../ui/FeedbackNotice.jsx";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";

import avatar1 from "@/Assets/Eka_Avatars/AV1.png";
import avatar2 from "@/Assets/Eka_Avatars/AV2.png";
import avatar3 from "@/Assets/Eka_Avatars/AV3.png";
import avatar4 from "@/Assets/Eka_Avatars/AV4.png";
import avatar5 from "@/Assets/Eka_Avatars/AV5.png";
import avatar6 from "@/Assets/Eka_Avatars/AV6.png";
import avatar7 from "@/Assets/Eka_Avatars/AV7.png";
import avatar8 from "@/Assets/Eka_Avatars/AV8.png";

const countries = [{ code: "IN", name: "India", dial: "+91", flag: "🇮🇳" }];

const predefinedAvatars = [
  { id: "av1", url: avatar1 },
  { id: "av8", url: avatar8 },
  { id: "av2", url: avatar2 },
  { id: "av3", url: avatar3 },
  { id: "av4", url: avatar4 },
  { id: "av5", url: avatar5 },
  { id: "av6", url: avatar6 },
  { id: "av7", url: avatar7 },
];

const AccountBasics = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  const [user, setUser] = useState({
    name: "",
    username: "",
    title: "",
    // bio: "",
    country: "IN",
    phone: "",
    avatar: null,
    avatarId: null,
  });
  const [initialState, setInitialState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [isAvatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentUser) {
      const userData = {
        name: currentUser.name || currentUser.username || "",
        username: currentUser.username || "",
        title: currentUser.title || "",
        bio: currentUser.bio || "",
        country: currentUser.country || "IN",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || null,
        avatarId: currentUser.avatarId || null,
      };
      setUser(userData);
      setInitialState(JSON.stringify(userData));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    if (errors[e.target.id]) {
      setErrors((prev) => ({ ...prev, [e.target.id]: null }));
    }
  };

  const handleAvatarSelect = (avatar) => {
    setUser((prev) => ({ ...prev, avatar: avatar.url, avatarId: avatar.id }));
    dispatch(updateUser({ avatar: avatar.url, avatarId: avatar.id }));
    setAvatarPickerOpen(false);
  };

  const handleAvatarKeyDown = (e, avatar) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAvatarSelect(avatar);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!user.name || user.name.trim() === "") {
      newErrors.name = "Full name is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveBasics = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFeedback({ message: "", type: "" });
    try {
      await new Promise((res) => setTimeout(res, 1500));
      dispatch(updateUser({ ...user }));
      setInitialState(JSON.stringify(user));
      setFeedback({ message: "Profile saved successfully!", type: "success" });
    } catch (error) {
      console.error("Failed to save profile:", error);
      setFeedback({
        message: "Failed to save profile. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Card title="Profile">
        <div>Loading profile...</div>
      </Card>
    );
  }

  const isDirty = JSON.stringify(user) !== initialState;

  return (
    <Card
      title="Profile"
      icon={<AccountCircleOutlinedIcon />}
      actions={
        <button
          className="btn primary"
          onClick={saveBasics}
          disabled={!isDirty || isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      }
    >
      <div className="avatar-row">
        <div className="avatar-wrap">
          <div
            className="avatar"
            style={{
              backgroundImage: user.avatar ? `url(${user.avatar})` : undefined,
            }}
          >
            {!user.avatar && (
              <CameraAltOutlinedIcon
                style={{ fontSize: 28, color: "#6b7280" }}
              />
            )}
          </div>
          <div className="avatar-actions">
            <button
              className="btn small"
              onClick={() => setAvatarPickerOpen(!isAvatarPickerOpen)}
            >
              {isAvatarPickerOpen ? "Close" : "Choose"}
            </button>
          </div>
        </div>
        <div className="grow">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              className={`input ${errors.name ? "input-error" : ""}`}
              value={user.name}
              onChange={handleInputChange}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={user.username}
              readOnly
            />
          </div>
        </div>
      </div>

      <div className={`avatar-picker ${isAvatarPickerOpen ? "open" : ""}`}>
        <div className="avatar-picker-grid">
          {predefinedAvatars.map((avatar) => (
            <div
              key={avatar.id}
              role="button"
              tabIndex={0}
              className="avatar-picker-item"
              onClick={() => handleAvatarSelect(avatar)}
              onKeyDown={(e) => handleAvatarKeyDown(e, avatar)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={avatar.url}
                alt={`Avatar ${avatar.id}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">Fleet</label>
        <input
          id="title"
          className="input"
          placeholder="e.g. EKA"
          value={user.title}
          onChange={handleInputChange}
        />
      </div>
      {/* <div className="field">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          className="input"
          rows="4"
          value={user.bio}
          maxLength={100}
          onChange={handleInputChange}
        />
        <div className="help">
          <div className="grow">A short biography (max 100 characters)</div>
          <div>{user.bio.length}/100</div>
        </div>
      </div> */}
      <div className="field grid2">
        <div>
          <label htmlFor="country">Country</label>
          <div className="select">
            <select
              id="country"
              className="input"
              value={user.country}
              onChange={handleInputChange}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="phone">Phone number</label>
          <div className="field-row">
            <div className="select" style={{ width: 80, flexShrink: 0 }}>
              <select className="input" value="+91" readOnly>
                <option>+91</option>
              </select>
            </div>
            <input
              id="phone"
              className="input"
              type="tel"
              value={user.phone}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>
      <FeedbackNotice
        message={feedback.message}
        type={feedback.type}
        onClear={() => setFeedback({ message: "", type: "" })}
      />
    </Card>
  );
};

export default AccountBasics;
