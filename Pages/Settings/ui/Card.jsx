import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ icon, title, children, actions }) => (
  <div className="card">
    <div className="card-h">
      {icon && <div className="chip">{icon}</div>}
      <h3>{title}</h3>
      <div className="grow" />
      {actions}
    </div>
    <div className="card-b">{children}</div>
  </div>
);
Card.propTypes = {
  icon: PropTypes.element,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
};

export default React.memo(Card);