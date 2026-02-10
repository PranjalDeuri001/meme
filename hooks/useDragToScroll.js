/**
 * Custom Hook for Drag-to-Scroll Functionality
 * Enables smooth mouse drag scrolling for horizontal scrollable containers
 * Works with button elements by preventing click when dragging
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to enable drag-to-scroll behavior
 * @param {React.RefObject} ref - Reference to the scrollable element
 */
export const useDragToScroll = (ref) => {
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const dragDistanceRef = useRef(0);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Reset all state on mount
        isDraggingRef.current = false;
        dragDistanceRef.current = 0;

        const handleMouseDown = (e) => {
            isDraggingRef.current = true;
            dragDistanceRef.current = 0;
            element.classList.add('dragging');
            startXRef.current = e.pageX - element.offsetLeft;
            scrollLeftRef.current = element.scrollLeft;

            // Change cursor
            element.style.cursor = 'grabbing';
            element.style.userSelect = 'none';
        };

        const handleMouseLeave = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                dragDistanceRef.current = 0;
                element.classList.remove('dragging');
                element.style.cursor = 'grab';
                element.style.userSelect = 'auto';
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            element.classList.remove('dragging');
            element.style.cursor = 'grab';
            element.style.userSelect = 'auto';

            // Reset drag distance after a tiny delay to let click handler read it
            setTimeout(() => {
                dragDistanceRef.current = 0;
            }, 10);
        };

        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;
            e.preventDefault();

            const x = e.pageX - element.offsetLeft;
            const walk = (x - startXRef.current) * 2; // Scroll speed multiplier

            // Track total drag distance
            dragDistanceRef.current = Math.abs(walk);

            element.scrollLeft = scrollLeftRef.current - walk;
        };

        // Prevent click event if we dragged more than 5px
        const handleClick = (e) => {
            // Check if drag distance exceeds threshold
            if (dragDistanceRef.current > 5) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('[DragToScroll] Click prevented - drag distance:', dragDistanceRef.current);
            }
            // Always reset after handling
            dragDistanceRef.current = 0;
        };

        // Initial cursor
        element.style.cursor = 'grab';

        // Add event listeners
        element.addEventListener('mousedown', handleMouseDown, { passive: false });
        element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
        element.addEventListener('mouseup', handleMouseUp, { passive: true });
        element.addEventListener('mousemove', handleMouseMove, { passive: false });
        element.addEventListener('click', handleClick, { capture: true, passive: false });

        // Cleanup
        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mouseup', handleMouseUp);
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('click', handleClick, true);

            // Reset styles on cleanup
            element.style.cursor = '';
            element.style.userSelect = '';
            element.classList.remove('dragging');

            // Reset all refs
            isDraggingRef.current = false;
            dragDistanceRef.current = 0;
        };
    }, [ref]);
};

