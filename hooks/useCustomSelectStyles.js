// src/hooks/useCustomSelectStyles.js
import { useMemo } from "react";

/**
 * Hook to generate dynamic styles for react-select based on theme.
 * @param {string} theme - The current theme ('dark' or 'light').
 * @returns {object} - The styles object for react-select.
 */
export function useCustomSelectStyles(theme) {
  const analysisSelectStyles = useMemo(() => {
    const isDark = theme === "dark";

    const darkColors = {
      bg: "#334155",
      border: "#475569",
      text: "#E2E8F0",
      placeholder: "#94A3B8",
      indicator: "#94A3B8",
      menuBg: "#1E293B",
      menuBorder: "#334155",
      optionSelectedBg: "#475569",
      optionFocusedBg: "#334155",
    };

    const lightColors = {
      bg: "#0b5297",
      border: "#ccc",
      text: "#fff",
      placeholder: "rgba(255, 255, 255, 0.8)",
      indicator: "#fff",
      menuBg: "#0b5297",
      menuBorder: "#08437a",
      optionSelectedBg: "#08437a",
      optionFocusedBg: "rgba(255, 255, 255, 0.1)",
    };

    const colors = isDark ? darkColors : lightColors;

    return {
      control: (base) => ({
        ...base,
        height: "40px",
        minHeight: "40px",
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderRadius: "5px",
        color: colors.text,
        boxShadow: "none",
      }),
      valueContainer: (base) => ({
        ...base,
        height: "40px",
        padding: "0 15px",
      }),
      singleValue: (base) => ({ ...base, color: colors.text }),
      placeholder: (base) => ({
        ...base,
        color: colors.placeholder,
      }),
      input: (base) => ({ ...base, color: colors.text }),
      indicatorsContainer: (p) => ({ ...p, height: "40px" }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({
        ...base,
        color: colors.indicator,
      }),
      menu: (p) => ({
        ...p,
        zIndex: 10,
        backgroundColor: colors.menuBg,
        border: `1px solid ${colors.menuBorder}`,
        borderRadius: "5px",
      }),
      option: (s, { isFocused, isSelected }) => {
        let backgroundColor = "transparent";
        if (isSelected) {
          backgroundColor = colors.optionSelectedBg;
        } else if (isFocused) {
          backgroundColor = colors.optionFocusedBg;
        }
        return {
          ...s,
          backgroundColor,
          color: colors.text,
          borderRadius: "4px",
          margin: "2px 4px",
          width: "calc(100% - 8px)",
        };
      },
      multiValue: (base) => ({
        ...base,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: "4px",
      }),
      multiValueLabel: (base) => ({
        ...base,
        color: colors.text,
        fontWeight: "500",
      }),
      multiValueRemove: (base) => ({
        ...base,
        color: colors.text,
        ":hover": {
          backgroundColor: "#EF4444",
          color: "white",
        },
      }),
    };
  }, [theme]);

  return analysisSelectStyles;
}