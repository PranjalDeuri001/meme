import React from "react";
import { useTranslation } from "react-i18next";

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPrevious,
  onNext,
}) => {

  const { t } = useTranslation(); 
  const __page = t("AddVehicle.page", "Page");
  const __of = t("AddVehicle.of", "of");
  const __items = t("AddVehicle.items", "items");
  const __previous = t("AddVehicle.previous", "previous");
  const __next = t("AddVehicle.next", "next");

  return (
    <div className="vm-pagination-controls">
      <span className="vm-page-info">
        {__page} {currentPage} {__of} {totalPages} ({totalItems} {__items})
      </span>

      <div className="vm-page-nav">
        <button
          className="theme-btn theme-btn-outlined"
          onClick={onPrevious}
          disabled={currentPage === 1}
        >
          {__previous}
        </button>
        <button
          className="theme-btn theme-btn-outlined"
          onClick={onNext}
          disabled={currentPage === totalPages}
        >
          {__next}
        </button>
      </div>
    </div>
  );
};

export default Pagination;
