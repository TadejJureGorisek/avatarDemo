/** Message while free spins play: the round's running total, or "Good luck!" while it's still 0. */
export const freeSpinsMessage = (total: number) => (total > 0 ? `Free spins win: ${total.toFixed(2)}` : 'Good luck!');
