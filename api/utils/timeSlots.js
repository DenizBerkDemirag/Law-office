const WORKING_START_HOUR = 9;
const WORKING_END_HOUR = 18; // 17:30, last slot

function getAllTimeSlots() {
  const slots = [];
  for (let hour = WORKING_START_HOUR; hour < WORKING_END_HOUR; hour++) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
}

module.exports = { getAllTimeSlots, WORKING_START_HOUR, WORKING_END_HOUR };
