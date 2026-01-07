# Sodax Transaction Status Checker

A simple Next.js application to check the status of Sodax transactions by transaction hash.

## Features

- ✅ Check transaction status by hash
- ✅ View intent status (SOLVED, FAILED, PENDING)
- ✅ Display destination transaction hash
- ✅ Show packet data with chain information
- ✅ Expandable JSON views for detailed data
- ✅ Dark mode support
- ✅ Responsive design

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Select the source chain** from the dropdown menu (the chain where the transaction originated)
2. **Enter a Sodax transaction hash** in the input field (e.g., `0x123...`)
3. **Click "Check Status"** button
4. **View the transaction status details:**
   - **Intent Status**: Shows if the transaction is SOLVED, FAILED, or in another state
   - **Destination Transaction**: Displays the destination chain transaction hash if available
   - **Packets Data**: Shows detailed packet information including source transaction, chain IDs, and status

### Supported Chains

The app supports all Sodax chains:
- **Ethereum Mainnet** - EVM chains (transactions start with `0x...`)
- **Avalanche Mainnet** - EVM chains
- **Arbitrum Mainnet** - EVM chains
- **Base Mainnet** - EVM chains
- **BSC Mainnet** - EVM chains
- **Sonic Mainnet** - Special Sonic provider
- **Sui Mainnet** - Sui-specific transactions
- **Optimism Mainnet** - EVM chains
- **Polygon Mainnet** - EVM chains
- **Solana Mainnet** - Solana-specific transactions
- **HyperEVM Mainnet** - EVM chains

## API Endpoints

### POST `/api/sodax-status`

Fetches the status of a Sodax transaction.

**Request Body:**
```json
{
  "txHash": "0x...",
  "chainId": "ethereum" // Required: Chain ID from Sodax supported chains
}
```

**Supported Chain IDs:**
- `ethereum` - Ethereum Mainnet
- `0xa86a.avax` - Avalanche Mainnet
- `0xa4b1.arbitrum` - Arbitrum Mainnet
- `0x2105.base` - Base Mainnet
- `0x38.bsc` - BSC Mainnet
- `sonic` - Sonic Mainnet
- `sui` - Sui Mainnet
- `0xa.optimism` - Optimism Mainnet
- `0x89.polygon` - Polygon Mainnet
- `solana` - Solana Mainnet
- `hyper` - HyperEVM Mainnet

**Response:**
```json
{
  "intentStatus": {
    "status": "SOLVED",
    "fill_tx_hash": "0x..."
  },
  "packetsData": {
    "data": [...]
  },
  "transactionOutHash": "0x..."
}
```

## Project Structure

```
sodax-scan/
├── app/
│   ├── api/
│   │   └── sodax-status/
│   │       └── route.ts          # API route for status checking
│   ├── components/
│   │   └── TransactionStatusChecker.tsx  # Main UI component
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── package.json
└── README.md
```

## Technology Stack

- **Next.js 16.1.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **@sodax/sdk** - Sodax blockchain integration

## Features Explained

### Status Checking Flow

1. User submits transaction hash
2. API verifies the transaction with Sodax
3. Submits intent to relay if needed
4. Waits for intent execution
5. Fetches final status and packet data
6. Displays formatted results to user

### Status Types

- **SOLVED**: Transaction completed successfully
- **FAILED**: Transaction failed
- **PENDING**: Transaction is still processing
- **WAITING/VALIDATING/EXECUTING/EXECUTED**: Various intermediate states

## Building for Production

```bash
npm run build
npm start
```

## Troubleshooting

### Transaction Not Found
- Ensure the transaction hash is correct
- The transaction may still be pending on the blockchain
- Try again after a few moments

### API Errors
- Check that @sodax/sdk is properly installed
- Verify network connectivity
- Check browser console for detailed error messages

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
