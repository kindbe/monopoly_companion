## 1. Project Setup

- [x] 1.1 Confirm the change scope against the PRD and spec files
- [x] 1.2 Identify the app entry points and existing UI structure for the setup flow
- [x] 1.3 Define the Monopoly property catalog with street, railroad, and utility categories

## 2. Bidding Flow

- [x] 2.1 Build the setup state model for players, property pool options, property count, bid increment, bidding mode, remaining cash, and bid results
- [x] 2.2 Implement hidden randomized property selection and one-at-a-time reveal
- [x] 2.3 Implement ascending auction bidding, passing, winner assignment, and cash deduction
- [x] 2.4 Implement silent auction opening/max bids, proxy-style pricing, sudden-death tie re-bids, winner assignment, and cash deduction
- [x] 2.5 Implement no-bid skipping for unowned properties
- [x] 2.6 Add validation for required setup inputs, eligible property count, bid increment, remaining cash, and completed bidding state

## 3. Mobile UI

- [x] 3.1 Create responsive screens for setup, bidding, sudden-death re-bid, and completion states
- [x] 3.2 Verify portrait and landscape layouts at supported phone resolutions
- [x] 3.3 Make primary actions and property details readable and reachable on small screens
- [x] 3.4 Ensure unrevealed properties are not shown while still communicating bidding progress

## 4. Verification

- [x] 4.1 Add or update tests for property pool configuration, hidden randomized selection, bid validation, ascending outcomes, silent proxy pricing, tie re-bids, no-bid skips, and cash deduction
- [x] 4.2 Run the relevant build or test commands and fix any regressions
