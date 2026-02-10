import React from 'react';
import propTypes from 'prop-types';

const Toggle = ({ checked, onChange, id }) => (
    <label className="toggle" htmlFor={id}>
        <input type="checkbox" checked={checked} onChange={onChange} id={id} />
        <span className="track"><span className="thumb" /></span>
    </label>
);
Toggle.propTypes = {
    checked: propTypes.bool.isRequired,
    onChange: propTypes.func.isRequired,
    id: propTypes.string.isRequired,
};  


export default React.memo(Toggle);