// src/components/Trails/PlayerControls.jsx
import React, { memo, useState, useRef } from "react";
import PropTypes from "prop-types";

const PlayerControls = memo(
  ({
    isPaused,
    onPlayPause,
    speedLabel,
    onSpeedChange,
    onRestart,
    currentIndex,
    totalPoints,
    onSliderChange,
    currentTime,
    totalTime,
    timeData, 
  }) => {
    const [tooltip, setTooltip] = useState({
      visible: false,
      text: "",
      x: 0,
    });
    const sliderRef = useRef(null);

    const handleSliderChange = (e) => {
      onSliderChange(Number.parseInt(e.target.value, 10));
    };

    // Logic to calculate tooltip position and content based on mouse hover
    const handleMouseMove = (e) => {
      if (!sliderRef.current || !timeData || timeData.length === 0) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      
      // Ensure index is within bounds [0, totalPoints - 1]
      const index = Math.max(0, Math.min(Math.floor(percent * totalPoints), totalPoints - 1));
      
      setTooltip({
        visible: true,
        text: timeData[index] || "",
        x: e.clientX - rect.left,
      });
    };

    const handleMouseLeave = () => {
      setTooltip({ ...tooltip, visible: false });
    };

    return (
      <div id="player-container" className="player-container">
        <div className="player-controls">
          {/* Play/Pause Button */}
          <button
            className="btn btn-primary play-pause-button"
            onClick={onPlayPause}
            aria-label={isPaused ? "Play" : "Pause"}
          >
            <i
              className={`bi ${isPaused ? "bi-play-fill" : "bi-pause-fill"}`}
            ></i>
          </button>

          {/* Progress Slider Section */}
          <div className="progress-container">
            {/* Hover Tooltip */}
            {tooltip.visible && (
              <div
                className="player-slider-tooltip"
                style={{ left: `${tooltip.x}px` }}
              >
                {tooltip.text}
              </div>
            )}

            <input
              ref={sliderRef}
              type="range"
              min="0"
              max={totalPoints > 0 ? totalPoints - 1 : 0}
              value={currentIndex}
              className="progress-slider"
              onChange={handleSliderChange}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              aria-label="Trail Progress"
            />
            
            <div className="player-time-display">
              <span>{currentTime}</span>
              <span>{totalTime}</span>
            </div>
          </div>

          {/* Speed Toggle Button */}
          <button
            className="btn btn-outline-secondary speed-button"
            onClick={onSpeedChange}
            aria-label="Change Playback Speed"
            title="Playback Speed"
          >
            {speedLabel}
          </button>

          {/* Restart Button */}
          <button
            className="btn btn-outline-warning restart-button"
            onClick={onRestart}
            aria-label="Restart Animation"
            title="Restart"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    );
  }
);

PlayerControls.displayName = "PlayerControls";

// Strict type checking for production safety
PlayerControls.propTypes = {
  isPaused: PropTypes.bool.isRequired,
  onPlayPause: PropTypes.func.isRequired,
  speedLabel: PropTypes.string.isRequired,
  onSpeedChange: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalPoints: PropTypes.number.isRequired,
  onSliderChange: PropTypes.func.isRequired,
  currentTime: PropTypes.string,
  totalTime: PropTypes.string,
  timeData: PropTypes.arrayOf(PropTypes.string),
};

export default PlayerControls;