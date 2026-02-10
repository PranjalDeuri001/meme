// src/utils/RotatableMarker.js
export const createRotatableMarkerClass = (google) => {
  return class RotatableMarker extends google.maps.OverlayView {
    constructor(position, imageUrl, map, width = 100, height = 80, onClick) {
      super();
      this.position = position;
      this.imageUrl = imageUrl;
      this.width = width;
      this.height = height;
      this.div = null;
      this.img = null;
      this.onClick = onClick;
      this.setMap(map);
    }

    onAdd() {
      this.div = document.createElement("div");
      this.div.style.position = "absolute";
      this.div.style.cursor = "pointer";
      this.div.style.pointerEvents = "auto"; // Explicitly enable interactions

      this.img = document.createElement("img");
      this.img.src = this.imageUrl;
      this.img.style.width = `${this.width}px`;
      this.img.style.height = `${this.height}px`;
      this.img.style.pointerEvents = "none";
      this.img.style.transition = "transform 0.1s linear"; // Changed to linear for smoother animation

      this.div.appendChild(this.img);

      if (this.onClick) {
        this.boundOnClick = (e) => {
          e.stopPropagation(); // Prevent map click
          e.preventDefault();  // Prevent default behavior
          this.onClick(e);
        };
        this.div.addEventListener("click", this.boundOnClick);
        // Also listen for touchstart for better mobile support
        this.div.addEventListener("touchstart", this.boundOnClick, { passive: false });
      }

      const panes = this.getPanes();
      // use overlayMouseTarget to ensure clicks are captured over map
      panes.overlayMouseTarget.appendChild(this.div);
    }

    draw() {
      const overlayProjection = this.getProjection();
      if (!overlayProjection || !this.div) return;

      const point = overlayProjection.fromLatLngToDivPixel(this.position);
      if (point) {
        this.div.style.left = `${point.x - this.width / 2}px`;
        this.div.style.top = `${point.y - this.height / 2}px`;
      }
    }

    onRemove() {
      if (this.div) {
        if (this.boundOnClick) {
          this.div.removeEventListener("click", this.boundOnClick);
          this.div.removeEventListener("touchstart", this.boundOnClick);
          this.boundOnClick = null;
        }
        if (this.div.parentNode) this.div.parentNode.removeChild(this.div);
        this.div = null;
        this.img = null;
      }
    }

    updatePosition(newPosition) {
      this.position = newPosition;
      this.draw();
    }

    updateRotation(heading) {
      if (this.img) this.img.style.transform = `rotate(${heading}deg)`;
    }
  };
};