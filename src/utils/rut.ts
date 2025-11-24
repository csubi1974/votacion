export const formatRut = (rut: string): string => {
    if (!rut) return '';

    // Clean the RUT first
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 2) return cleanRut;

    // Split body and dv
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Format body with dots
    let formattedBody = '';
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) {
            formattedBody = '.' + formattedBody;
        }
        formattedBody = body[i] + formattedBody;
    }

    return `${formattedBody}-${dv}`;
};

export const cleanRut = (rut: string): string => {
    return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

export const validateRut = (rut: string): boolean => {
    if (!rut) return false;

    const clean = cleanRut(rut);
    if (clean.length < 8) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

    return dv === calculatedDv;
};
