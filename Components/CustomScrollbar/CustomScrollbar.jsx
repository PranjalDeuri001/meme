
import React from 'react';
import SimpleBar from 'simplebar-react';
import PropTypes from 'prop-types';

// You only need to import the CSS for the library once, right here.
import 'simplebar/dist/simplebar.min.css';

const CustomScrollbar = ({ children, ...rest }) => {
  // The style prop is important to make it flexible, especially in flexbox layouts.
  return (
    <SimpleBar style={{ height: '100%', width: '100%' }} {...rest}>
      {children}
    </SimpleBar>
  );
};
CustomScrollbar.propTypes = {
  children: PropTypes.node.isRequired,
};
export default CustomScrollbar;