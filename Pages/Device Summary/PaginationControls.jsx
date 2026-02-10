import React from "react";
import PropTypes from "prop-types";
import { Pagination } from "antd";
import { ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";

const PaginationControls = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  // --- Multilingual text section ---
  const { t } = useTranslation();
  const __goTo = t("VehicleStatus.go_to", "Go to");
  const __page = t("VehicleStatus.page", "Page");
  const __showing = t("VehicleStatus.showing", "Showing");
  const __of = t("VehicleStatus.of", "of");
  const __items = t("VehicleStatus.items", "items");
  // ----------------------------------
  return (
    <div
      className="ds-controls-container"
      style={{
        justifyContent: "space-between",
        paddingTop: "1rem",
        // borderTop: "1px solid var(--border-color)",
      }}
    >
      <ConfigProvider
        locale={{
          Pagination: {
            jump_to: __goTo,
            page: __page,
          },
        }}
      >
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          showQuickJumper
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${__showing} ${range[0]}-${range[1]} ${__of} ${total} ${__items}`
          }
          onChange={onPageChange}
        />
      </ConfigProvider>
    </div>
  );
};

PaginationControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired, 
  pageSize: PropTypes.number, 
  onPageChange: PropTypes.func.isRequired,
};

PaginationControls.defaultProps = {
  pageSize: 10,
};

export default PaginationControls;
