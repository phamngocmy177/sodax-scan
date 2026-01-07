/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

// Solver Intent Status Code mapping
enum SolverIntentStatusCode {
  NOT_FOUND = -1,
  NOT_STARTED_YET = 1,
  STARTED_NOT_FINISHED = 2,
  SOLVED = 3,
  FAILED = 4
}

// Helper function to get status label
const getStatusLabel = (status: number): string => {
  switch (status) {
    case SolverIntentStatusCode.SOLVED:
      return 'SOLVED (3)';
    case SolverIntentStatusCode.FAILED:
      return 'FAILED (4)';
    case SolverIntentStatusCode.NOT_FOUND:
      return 'NOT_FOUND (-1)';
    case SolverIntentStatusCode.NOT_STARTED_YET:
      return 'QUEUED (1)';
    case SolverIntentStatusCode.STARTED_NOT_FINISHED:
      return 'PROCESSING (2)';
    default:
      return `UNKNOWN (${status})`;
  }
};

interface IntentStatus {
  status: number; // Status is a number from SolverIntentStatusCode enum
  fill_tx_hash?: string;
  [key: string]: unknown;
}

interface PacketData {
  status?: string;
  src_tx_hash?: string;
  dst_chain_id?: string;
  [key: string]: unknown;
}

interface PacketsData {
  data?: PacketData[];
  [key: string]: unknown;
}

interface StatusData {
  intentStatus?: IntentStatus;
  packetsData?: PacketsData;
  transactionOutHash?: string;
  error?: string;
}

const SODAX_CHAINS = {
  'ethereum': 'Ethereum Mainnet',
  '0xa86a.avax': 'Avalanche Mainnet',
  '0xa4b1.arbitrum': 'Arbitrum Mainnet',
  '0x2105.base': 'Base Mainnet',
  '0x38.bsc': 'BSC Mainnet',
  'sonic': 'Sonic Mainnet',
  'sui': 'Sui Mainnet',
  '0xa.optimism': 'Optimism Mainnet',
  '0x89.polygon': 'Polygon Mainnet',
  'solana': 'Solana Mainnet',
  'hyper': 'HyperEVM Mainnet',
};

export default function TransactionStatusChecker() {
  const [txHash, setTxHash] = useState('');
  const [chainId, setChainId] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusData(null);

    try {
      const response = await fetch('/api/sodax-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txHash, chainId }),
      });

      const data = await response.json();
      console.log('data', data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatusData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">
          Sodax Transaction Status Checker
        </h1>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Select the source chain where the transaction originated, then enter the transaction hash to check its status across the Sodax network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="chainId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                Source Chain
              </label>
              <select
                id="chainId"
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              >
                {Object.entries(SODAX_CHAINS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="txHash" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">
                Transaction Hash
              </label>
              <input
                id="txHash"
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter transaction hash (e.g., 0x...)"
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !txHash}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300 font-medium">Error:</p>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {statusData && (
          <div className="space-y-6">
            {/* Transaction Summary Card */}
            {statusData.intentStatus && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Transaction Status
                  </h2>
                  <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                    statusData.intentStatus.status === SolverIntentStatusCode.SOLVED
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : statusData.intentStatus.status === SolverIntentStatusCode.FAILED
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  }`}>
                    {statusData.intentStatus.status === SolverIntentStatusCode.SOLVED
                      ? '✓ Completed Successfully'
                      : statusData.intentStatus.status === SolverIntentStatusCode.FAILED
                      ? '✗ Transaction Failed'
                      : statusData.intentStatus.status === SolverIntentStatusCode.NOT_FOUND
                      ? '❓ Not Found'
                      : statusData.intentStatus.status === SolverIntentStatusCode.NOT_STARTED_YET
                      ? '⏸ Queued'
                      : statusData.intentStatus.status === SolverIntentStatusCode.STARTED_NOT_FINISHED
                      ? '⏳ Processing'
                      : '⏳ In Progress'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Status</p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {statusData.intentStatus.status === SolverIntentStatusCode.SOLVED
                        ? 'Your transaction has been completed successfully across chains'
                        : statusData.intentStatus.status === SolverIntentStatusCode.FAILED
                        ? 'Your transaction could not be completed'
                        : statusData.intentStatus.status === SolverIntentStatusCode.NOT_FOUND
                        ? 'Transaction not found in the Sodax network'
                        : statusData.intentStatus.status === SolverIntentStatusCode.NOT_STARTED_YET
                        ? 'Your transaction is queued and will be processed shortly'
                        : statusData.intentStatus.status === SolverIntentStatusCode.STARTED_NOT_FINISHED
                        ? 'Your transaction is currently being processed'
                        : 'Your transaction is being processed'}
                    </p>
                  </div>

                  {statusData.transactionOutHash && (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Destination Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded text-zinc-900 dark:text-zinc-50 break-all">
                          {statusData.transactionOutHash}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(statusData.transactionOutHash || '')}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {statusData.intentStatus.fill_tx_hash && (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg p-4">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Fill Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded text-zinc-900 dark:text-zinc-50 break-all">
                          {statusData.intentStatus.fill_tx_hash}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(statusData.intentStatus?.fill_tx_hash || '')}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                    <span>Status Code:</span>
                    <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono">
                      {getStatusLabel(statusData.intentStatus.status)}
                    </code>
                  </div>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm">
                    View Technical Details (Advanced)
                  </summary>
                  <pre className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(statusData.intentStatus, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Packets Data */}
            {statusData.packetsData && statusData.packetsData.data && statusData.packetsData.data.length > 0 && (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
                  Transaction Details
                </h2>
                <div className="space-y-4">
                  {statusData.packetsData.data.map((packet, index) => (
                    <div key={index} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {packet.status && (
                          <div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Packet Status</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-50 capitalize">{packet.status}</p>
                          </div>
                        )}
                        {packet.dst_chain_id && (
                          <div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Destination Chain ID</p>
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">{packet.dst_chain_id}</p>
                          </div>
                        )}
                      </div>
                      {packet.src_tx_hash && (
                        <div className="mt-4">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Source Transaction Hash</p>
                          <code className="block text-xs font-mono bg-white dark:bg-zinc-900 px-3 py-2 rounded text-zinc-900 dark:text-zinc-50 break-all">
                            {packet.src_tx_hash}
                          </code>
                        </div>
                      )}

                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                          View Raw Packet Data (Advanced)
                        </summary>
                        <pre className="mt-3 p-3 bg-white dark:bg-zinc-900 rounded overflow-x-auto text-xs">
                          {JSON.stringify(packet, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
