const { canTransition, validateAssetTransition, VALID_TRANSITIONS } = require('../src/services/stateMachineService');

console.log('🧪 Starting automated unit tests...\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. State Machine Engine Tests
console.log('1. Testing State Machine Engine:');
assert(canTransition('AVAILABLE', 'REQUESTED') === true, 'AVAILABLE -> REQUESTED should be allowed');
assert(canTransition('REQUESTED', 'APPROVED') === true, 'REQUESTED -> APPROVED should be allowed');
assert(canTransition('APPROVED', 'ISSUED') === true, 'APPROVED -> ISSUED should be allowed');
assert(canTransition('ISSUED', 'RETURN_INITIATED') === true, 'ISSUED -> RETURN_INITIATED should be allowed');
assert(canTransition('RETURN_INITIATED', 'INSPECTION') === true, 'RETURN_INITIATED -> INSPECTION should be allowed');
assert(canTransition('INSPECTION', 'VERIFIED') === true, 'INSPECTION -> VERIFIED should be allowed');
assert(canTransition('VERIFIED', 'AVAILABLE') === true, 'VERIFIED -> AVAILABLE should be allowed');
assert(canTransition('INSPECTION', 'DAMAGED') === true, 'INSPECTION -> DAMAGED should be allowed');
assert(canTransition('DAMAGED', 'MAINTENANCE') === true, 'DAMAGED -> MAINTENANCE should be allowed');
assert(canTransition('MAINTENANCE', 'AVAILABLE') === true, 'MAINTENANCE -> AVAILABLE should be allowed');

// Illegal transition checks
assert(canTransition('AVAILABLE', 'ISSUED') === false, 'AVAILABLE -> ISSUED (bypassing approval) should be REJECTED');
assert(canTransition('REQUESTED', 'AVAILABLE') === true, 'REQUESTED -> AVAILABLE (rejection/cancellation) should be allowed');
assert(canTransition('DAMAGED', 'AVAILABLE') === false, 'DAMAGED -> AVAILABLE (bypassing maintenance) should be REJECTED');

let thrown = false;
try {
  validateAssetTransition('AVAILABLE', 'MAINTENANCE');
} catch (e) {
  thrown = true;
}
assert(thrown, 'validateAssetTransition threw error on invalid transition');

// 2. Overlap Interval Formula Tests
console.log('\n2. Testing Availability Interval Overlap Formula:');
function isOverlapping(startA, endA, startB, endB) {
  return (startA < endB) && (endA > startB);
}

const reqStart = new Date('2026-09-20T00:00:00Z');
const reqEnd = new Date('2026-09-25T00:00:00Z');

// Overlap cases
const overlapping1 = isOverlapping(reqStart, reqEnd, new Date('2026-09-18T00:00:00Z'), new Date('2026-09-22T00:00:00Z'));
assert(overlapping1 === true, 'Earlier existing booking ending inside requested range overlaps');

const overlapping2 = isOverlapping(reqStart, reqEnd, new Date('2026-09-22T00:00:00Z'), new Date('2026-09-28T00:00:00Z'));
assert(overlapping2 === true, 'Later existing booking starting inside requested range overlaps');

const overlapping3 = isOverlapping(reqStart, reqEnd, new Date('2026-09-15T00:00:00Z'), new Date('2026-09-30T00:00:00Z'));
assert(overlapping3 === true, 'Existing booking completely encompassing requested range overlaps');

// Non-overlap cases
const nonOverlap1 = isOverlapping(reqStart, reqEnd, new Date('2026-09-10T00:00:00Z'), new Date('2026-09-19T00:00:00Z'));
assert(nonOverlap1 === false, 'Booking completely before requested range does NOT overlap');

const nonOverlap2 = isOverlapping(reqStart, reqEnd, new Date('2026-09-26T00:00:00Z'), new Date('2026-09-30T00:00:00Z'));
assert(nonOverlap2 === false, 'Booking completely after requested range does NOT overlap');

console.log(`\n========================================`);
console.log(`Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
