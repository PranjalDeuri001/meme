 import React, { useState, useMemo } from 'react';
import Card from '../ui/Card.jsx';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

const pwdStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[a-z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const labels = ["Very weak", "Weak", "Okay", "Good", "Strong", "Excellent"];
  return { score: s, label: labels[Math.min(s, 5)] };
};

const ChangePassword = () => {
  const [pwd, setPwd] = useState({ old: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const passwordStrength = useMemo(() => pwdStrength(pwd.next), [pwd.next]);

  const handleInputChange = (field, value) => {
    setPwd(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const strength = pwdStrength(pwd.next);

    if (!pwd.old) newErrors.old = "Old password is required.";
    if (!pwd.next) newErrors.next = "New password is required.";
    else if (strength.score < 3) newErrors.next = "Password is too weak. Please choose a stronger one.";
    if (!pwd.confirm) newErrors.confirm = "Please confirm your new password.";
    else if (pwd.next && pwd.next !== pwd.confirm) newErrors.confirm = "The new passwords do not match.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updatePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    await new Promise(res => setTimeout(res, 1500));
    console.log("Updating password...");
    setPwd({ old: "", next: "", confirm: "" });
    setErrors({});
    setIsLoading(false);
  };

  return (
    <Card
      title="Change password"
      icon={<VpnKeyOutlinedIcon />}
      actions={
        <button className="btn primary" onClick={updatePassword} disabled={isLoading}>
          {isLoading ? "Updating..." : "Update password"}
        </button>
      }
    >
      <div className="field">
        <label htmlFor="oldPwd">Old password</label>
        <input 
          id="oldPwd"
          className={`input ${errors.old ? 'input-error' : ''}`} 
          type={showPwd ? "text" : "password"} 
          value={pwd.old} 
          onChange={(e) => handleInputChange('old', e.target.value)} 
        />
        {errors.old && <div className="error-message">{errors.old}</div>}
      </div>

      <div className="field">
        <label htmlFor="newPwd">New password</label>
        <input 
          id="newPwd"
          className={`input ${errors.next ? 'input-error' : ''}`} 
          type={showPwd ? "text" : "password"} 
          value={pwd.next} 
          onChange={(e) => handleInputChange('next', e.target.value)} 
        />
        {errors.next && <div className="error-message">{errors.next}</div>}
        {pwd.next && !errors.next && (
          <div className="strength">
            <div className="bar">
              <span style={{ width: `${(passwordStrength.score / 5) * 100}%`, background: `var(--primary-color)` }} />
            </div>
            <div className="s-label">{passwordStrength.label}</div>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="confirmPwd">Confirm new password</label>
        <input 
          id="confirmPwd"
          className={`input ${errors.confirm ? 'input-error' : ''}`} 
          type={showPwd ? "text" : "password"} 
          value={pwd.confirm} 
          onChange={(e) => handleInputChange('confirm', e.target.value)} 
        />
        {errors.confirm && <div className="error-message">{errors.confirm}</div>}
      </div>

      <label className="line">
        <input type="checkbox" checked={showPwd} onChange={() => setShowPwd(!showPwd)} /> Show passwords
      </label>
    </Card>
  );
};

export default ChangePassword;
