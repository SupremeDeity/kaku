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
    let initialDistance = 0
    let initialX = 0
    let initialY = 0

    let initialAngle = 0
    let previousAngle = 0

    let previousScale = 1
    let previousDx = 0
    let previousDy = 0

    function onTouchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            const x1 = e.touches[0].clientX
            const y1 = e.touches[0].clientY
            const x2 = e.touches[1].clientX
            const y2 = e.touches[1].clientY

            initialX = (x1 + x2) / 2
            initialY = (y1 + y2) / 2

            previousScale = 1
            previousDx = 0
            previousDy = 0

            initialAngle = calculateAngle(
                e.touches[0].clientX,
                e.touches[0].clientY,
                e.touches[1].clientX,
                e.touches[1].clientY
            )

            previousAngle = initialAngle

            initialDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

            if (options.onGestureStart) {
                options.onGestureStart()
            }
        }
    }

    function onTouchMove(e: TouchEvent) {
        if (e.touches.length === 2) {
            const x1 = e.touches[0].clientX
            const y1 = e.touches[0].clientY
            const x2 = e.touches[1].clientX
            const y2 = e.touches[1].clientY

            const currentX = (x1 + x2) / 2
            const currentY = (y1 + y2) / 2

            const center: Point = new Point (
               currentX,
              currentY
        )

            const dx = currentX - initialX
            const dy = currentY - initialY

            const currentDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
            const scale = currentDistance / initialDistance

            const currentAngle = calculateAngle(
                e.touches[0].clientX,
                e.touches[0].clientY,
                e.touches[1].clientX,
                e.touches[1].clientY
            )
            const angleDifference = normalizeAngle(currentAngle - previousAngle)

            if (options.onRotate) {
                options.onRotate(angleDifference, center)
            }

            if (options.onZoom) {
                options.onZoom(scale, previousScale, center)
            }

            if (options.onDrag) {
                options.onDrag(dx, dy, previousDx, previousDy, center)
            }

            // Update previous values
            previousAngle = currentAngle
            previousScale = scale
            previousDx = dx
            previousDy = dy
        }
    }

    function onTouchEnd(e: TouchEvent) {
        if (options.onGestureEnd) {
            options.onGestureEnd(e.touches.length)
        }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return {
        destroy() {
            el.removeEventListener('touchstart', onTouchStart)
            el.removeEventListener('touchmove', onTouchMove)
            el.removeEventListener('touchend', onTouchEnd)
        }
    }
}

