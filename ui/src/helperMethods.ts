export const range = (start: number, end: number) => {
    const normalizedEnd = Math.max(end, start);

    return Array.from(
        { length: normalizedEnd - start + 1 },
        (_, index) => start + index
    );
}

export const isNumeric = (value: string) => !isNaN(parseInt(value));
