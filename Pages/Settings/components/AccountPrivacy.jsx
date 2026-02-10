import React, { useState } from 'react';
import Card from '../ui/Card.jsx';
import Toggle from '../ui/Toggle.jsx';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

const AccountPrivacy = () => {
  const [isPublic, setIsPublic] = useState(false);

  return (
    <Card title="Privacy" icon={<ShieldOutlinedIcon />}>
      <div className="line">
        <div className="grow">
          <div className="line-title">Public contact info</div>
          <div className="line-desc">This info will be visible to everyone on the platform.</div>
        </div>
        <Toggle
          id="public-contact-toggle"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
      </div>
    </Card>
  );
};

export default AccountPrivacy;