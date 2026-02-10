// DateTimeRangePicker.jsx
import React, { useState } from "react";
import propTypes from "prop-types";
import {
  Box,
  Button,
  IconButton,
  Popover,
  Typography,
  Divider,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  LocalizationProvider,
  DateCalendar,
  TimePicker,
} from "@mui/x-date-pickers";
import {
  ChevronLeft,
  ChevronRight,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import dayjs from "dayjs";

const quickRanges = [
  { label: "Today", range: [dayjs().startOf("day"), dayjs().endOf("day")] },
  {
    label: "Yesterday",
    range: [
      dayjs().subtract(1, "day").startOf("day"),
      dayjs().subtract(1, "day").endOf("day"),
    ],
  },
  {
    label: "Last 7 Days",
    range: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
  },
  {
    label: "This Week",
    range: [dayjs().startOf("week"), dayjs().endOf("week")],
  },
  {
    label: "This Month",
    range: [dayjs().startOf("month"), dayjs().endOf("month")],
  },
];

const DateTimeRangePicker = ({ onConfirm }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDates, setSelectedDates] = useState([]);
  const [startTime, setStartTime] = useState(dayjs().startOf("day"));
  const [endTime, setEndTime] = useState(dayjs().endOf("day"));

  const handleDateSelect = (date) => {
    const exists = selectedDates.some((d) => d.isSame(date, "day"));
    if (exists) {
      setSelectedDates(selectedDates.filter((d) => !d.isSame(date, "day")));
    } else {
      setSelectedDates([...selectedDates, date].sort((a, b) => a - b));
    }
  };

  const handleQuickSelect = (range) => {
    setSelectedDates([range[0], range[1]]);
    setStartTime(range[0]);
    setEndTime(range[1]);
  };

  const handleConfirm = () => {
    onConfirm?.({
      dates: selectedDates,
      startTime,
      endTime,
    });
    setAnchorEl(null);
  };

  const handleClear = () => {
    setSelectedDates([]);
    setStartTime(dayjs().startOf("day"));
    setEndTime(dayjs().endOf("day"));
  };

  // Format the button label
  const formatLabel = () => {
    if (selectedDates.length === 0) return "Select Date & Time";

    const start = selectedDates[0]
      ? `${selectedDates[0].format("DD MMM YYYY")} ${startTime.format("HH:mm")}`
      : "";
    const end = selectedDates[selectedDates.length - 1]
      ? `${selectedDates[selectedDates.length - 1].format("DD MMM YYYY")} ${endTime.format("HH:mm")}`
      : "";

    return `${start} → ${end}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Button
          variant="outlined"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ textTransform: "none", minWidth: 260 }}
        >
          {formatLabel()}
        </Button>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Box p={2} sx={{ width: 340, fontFamily: "Inter, sans-serif" }}>
            {/* Header with month + year navigation */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Box display="flex" alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, "year"))}
                >
                  <KeyboardDoubleArrowLeft fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
                >
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="subtitle1" fontWeight="500">
                {currentMonth.format("MMMM YYYY")}
              </Typography>

              <Box display="flex" alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
                >
                  <ChevronRight fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setCurrentMonth(currentMonth.add(1, "year"))}
                >
                  <KeyboardDoubleArrowRight fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Calendar */}
           <DateCalendar
              value={null}
              onChange={handleDateSelect}
              views={["day"]}
              referenceDate={currentMonth}
              disableHighlightToday={false}
              slots={{
                day: (props) => {
                  const selected = selectedDates.some((d) =>
                    d.isSame(props.day, "day")
                  );
                  return (
                    <div
                      {...props}
                      style={{
                        width: 36,
                        height: 36,
                        margin: 2,
                         borderRadius: "50%",
                        backgroundColor: selected ? "#1976d2" : "transparent",
                        color: selected ? "white" : "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDateSelect(props.day)}
                    >
                      {props.day.date()}
                    </div>
                  );
                },
              }}
            />

            <Divider sx={{ my: 1 }} />

            {/* Time Pickers */}
            <Box display="flex" gap={1} mb={2}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(val) => setStartTime(val)}
              />
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(val) => setEndTime(val)}
              />
            </Box>

            {/* Quick ranges */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {quickRanges.map((q) => (
                <Button
                  key={q.label}
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickSelect(q.range)}
                >
                  {q.label}
                </Button>
              ))}
            </Box>

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button onClick={handleClear}>
                Clear
              </Button>
              <Button variant="contained" onClick={handleConfirm}>
                OK
              </Button>
            </Box>
          </Box>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};
DateTimeRangePicker.propTypes = {
  onConfirm: propTypes.func.isRequired,
};
DateTimeRangePicker.defaultProps = {
  onConfirm: () => {},
};



export default DateTimeRangePicker;