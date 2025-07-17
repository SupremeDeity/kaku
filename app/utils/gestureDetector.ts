import  { Point } from 'fabric'

interface GestureDetectorOptions {
    onGestureStart?: () => void
    onZoom?: (scale: number, previousScale: number, center: Point) => void
    onDrag?: (dx: number, dy: number, previousDx: number, previousDy: number, center: Point) => void
    onRotate?: (angleDifference: number, center: Point) => void
    onGestureEnd?: (fingers: number) => void
}

function calculateAngle(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1
    const dy = y2 - y1
    return (Math.atan2(dy, dx) * 180) / Math.PI
}

function normalizeAngle(angle: number): number {
    let newAngle = angle
    while (newAngle <= -180) newAngle += 360
    while (newAngle > 180) newAngle -= 360
    return newAngle
}

export function gestureDetector(el: HTMLElement, options: GestureDetectorOptions) {
    let initialDistance = 0;
    let initialX = 0;
    let initialY = 0;
    let initialAngle = 0;
    let previousAngle = 0;
    let previousScale = 1;
    let previousDx = 0;
    let previousDy = 0;
    const ZOOM_THRESHOLD = 0.01; // Very sensitive zoom detection

    function onTouchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            const x1 = e.touches[0].clientX;
            const y1 = e.touches[0].clientY;
            const x2 = e.touches[1].clientX;
            const y2 = e.touches[1].clientY;

            initialX = (x1 + x2) / 2;
            initialY = (y1 + y2) / 2;
            initialDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            initialAngle = calculateAngle(x1, y1, x2, y2);

            previousDx = 0;
            previousDy = 0;
            previousScale = 1;
            previousAngle = initialAngle;

            if (options.onGestureStart) {
                options.onGestureStart();
            }
        }
    }

    function onTouchMove(e: TouchEvent) {
        if (e.touches.length === 2) {
            const x1 = e.touches[0].clientX;
            const y1 = e.touches[0].clientY;
            const x2 = e.touches[1].clientX;
            const y2 = e.touches[1].clientY;

            const currentX = (x1 + x2) / 2;
            const currentY = (y1 + y2) / 2;
            const center: Point = new Point(currentX, currentY);

            // Calculate panning (always)
            const dx = currentX - initialX;
            const dy = currentY - initialY;

            // Calculate zoom (independent of panning)
            const currentDistance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const scale = currentDistance / initialDistance;
            const scaleChange = Math.abs(scale - 1);

            // Calculate rotation (if needed)
            const currentAngle = calculateAngle(x1, y1, x2, y2);
            const angleDifference = normalizeAngle(currentAngle - previousAngle);

            // Execute all possible simultaneous gestures:
            if (scaleChange >= ZOOM_THRESHOLD && options.onZoom) {
                options.onZoom(scale, previousScale, center);
            }
            
            if (options.onDrag) {
                options.onDrag(dx, dy, previousDx, previousDy, center);
            }
            
            if (Math.abs(angleDifference) > 2 && options.onRotate) {
                options.onRotate(angleDifference, center);
            }

            // Update previous values
            previousDx = dx;
            previousDy = dy;
            previousScale = scale;
            previousAngle = currentAngle;
        }
    }

    function onTouchEnd(e: TouchEvent) {
        if (options.onGestureEnd) {
            options.onGestureEnd(e.touches.length);
        }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return {
        destroy() {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
        }
    };
}

