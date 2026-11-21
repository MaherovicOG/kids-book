export const statusNames = { new: 'Awaiting confirmation', confirmed: 'Confirmed', in_progress: 'Creating the PDF', delivered: 'Delivered', cancelled: 'Cancelled' };
const transitions = { new: ['confirmed', 'cancelled'], confirmed: ['in_progress', 'delivered', 'cancelled'], in_progress: ['delivered', 'cancelled'], delivered: [], cancelled: [] };
export function canTransition(from, to) { return from === to || Boolean(transitions[from]?.includes(to)); }
export function deliveryDeadline(confirmedAt) { return new Date(new Date(confirmedAt).getTime() + 3 * 60 * 60 * 1000); }
