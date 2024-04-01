export const range = (start: number, end: number) => {
    let normalizedEnd = Math.max(end, start);

    return Array.from(
        { length: normalizedEnd - start + 1 },
        (_, index) => start + index
    );
}