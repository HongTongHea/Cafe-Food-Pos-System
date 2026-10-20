// All money maths is done in integer cents to avoid floating point errors.
exports.toCents = (value) => Math.round(Number(value) * 100);
exports.fromCents = (cents) => Math.round(cents) / 100;
