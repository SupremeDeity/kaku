export function getSmoothPathFromPoints(points, correction = 0) {
    const pathData = [];
    if (points.length < 2) return pathData;

    let p1 = points[0];
    let p2 = points[1];

    pathData.push(["M", p1.x - correction, p1.y - correction]);

    for (let i = 1; i < points.length; i++) {
        if (p1.x !== p2.x || p1.y !== p2.y) {
            const midPoint = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
            };
            pathData.push(["Q", p1.x, p1.y, midPoint.x, midPoint.y]);
        }
        p1 = points[i];
        if (i + 1 < points.length) {
            p2 = points[i + 1];
        }
    }

    pathData.push(["L", p1.x + correction, p1.y + correction]);

    return pathData;
}