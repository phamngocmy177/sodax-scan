# Sodax Status Code Mapping

## Overview
The Sodax API returns numeric status codes based on the `SolverIntentStatusCode` enum. This document explains the mapping between numeric codes and their human-readable representations.

## Status Code Enum

```typescript
enum SolverIntentStatusCode {
  NOT_FOUND = -1,           // Transaction not found in the system
  NOT_STARTED_YET = 1,      // In task pool, but not started yet
  STARTED_NOT_FINISHED = 2, // Currently being processed
  SOLVED = 3,               // Successfully completed
  FAILED = 4                // Transaction failed
}
```

## Status Mapping Table

| Code | Name | Badge Label | User Message | Badge Color |
|------|------|-------------|--------------|-------------|
| -1 | NOT_FOUND | ❓ Not Found | Transaction not found in the Sodax network | Yellow |
| 1 | NOT_STARTED_YET | ⏸ Queued | Your transaction is queued and will be processed shortly | Yellow |
| 2 | STARTED_NOT_FINISHED | ⏳ Processing | Your transaction is currently being processed | Yellow |
| 3 | SOLVED | ✓ Completed Successfully | Your transaction has been completed successfully across chains | Green |
| 4 | FAILED | ✗ Transaction Failed | Your transaction could not be completed | Red |

## UI Implementation

### Status Badge
The status badge shows at the top-right of the transaction status card:
- **Green badge**: SOLVED (3) - Success state
- **Red badge**: FAILED (4) - Error state
- **Yellow badge**: All other states - In-progress/pending states

### Status Messages
Each status code maps to a clear, user-friendly message:

**SOLVED (3)**
> "Your transaction has been completed successfully across chains"

**FAILED (4)**
> "Your transaction could not be completed"

**NOT_FOUND (-1)**
> "Transaction not found in the Sodax network"

**NOT_STARTED_YET (1)**
> "Your transaction is queued and will be processed shortly"

**STARTED_NOT_FINISHED (2)**
> "Your transaction is currently being processed"

## Status Code Display

For technical users, the exact status code is displayed at the bottom of the transaction card:

```
Status Code: SOLVED (3)
Status Code: PROCESSING (2)
Status Code: NOT_FOUND (-1)
```

This format shows both the readable name and the numeric code for reference.

## API Response Format

The API returns the status as a numeric value:

```json
{
  "intentStatus": {
    "status": 3,  // Numeric code from SolverIntentStatusCode enum
    "fill_tx_hash": "0x..."
  },
  "packetsData": {...},
  "transactionOutHash": "0x..."
}
```

## Code Example

```typescript
// Check if transaction is completed
if (intentStatus.status === SolverIntentStatusCode.SOLVED) {
  // Transaction successful
  showDestinationHash();
}

// Check if transaction failed
if (intentStatus.status === SolverIntentStatusCode.FAILED) {
  // Transaction failed
  showErrorMessage();
}

// Check if still processing
if (intentStatus.status === SolverIntentStatusCode.STARTED_NOT_FINISHED) {
  // Still processing
  showLoadingState();
}
```

## Status Flow

```
Transaction Submitted
       ↓
NOT_STARTED_YET (1) - Queued in task pool
       ↓
STARTED_NOT_FINISHED (2) - Being processed by solver
       ↓
    ↙     ↘
SOLVED (3)  FAILED (4)
Success     Error
```

## Important Notes

1. **Type Safety**: Status is always a `number` type, not a string
2. **Enum Values**: Use the `SolverIntentStatusCode` enum for comparisons
3. **Backward Compatibility**: The numeric codes are stable and won't change
4. **NOT_FOUND**: Code -1 indicates the transaction doesn't exist in the Sodax system
5. **Terminal States**: SOLVED (3) and FAILED (4) are final states
6. **Transient States**: Codes -1, 1, and 2 are temporary and may change

## Error Handling

```typescript
// Handle all possible status codes
const getStatusMessage = (status: number): string => {
  switch (status) {
    case SolverIntentStatusCode.SOLVED:
      return "Transaction completed successfully";
    case SolverIntentStatusCode.FAILED:
      return "Transaction failed";
    case SolverIntentStatusCode.NOT_FOUND:
      return "Transaction not found";
    case SolverIntentStatusCode.NOT_STARTED_YET:
      return "Transaction queued";
    case SolverIntentStatusCode.STARTED_NOT_FINISHED:
      return "Transaction processing";
    default:
      return `Unknown status: ${status}`;
  }
};
```

## Testing Status Codes

When testing the application, verify that:
1. ✅ Each status code displays the correct badge color
2. ✅ Each status code shows the appropriate user message
3. ✅ Status codes are displayed in the technical details
4. ✅ Terminal states (3, 4) show transaction hashes when available
5. ✅ Transient states (1, 2) show appropriate loading indicators
