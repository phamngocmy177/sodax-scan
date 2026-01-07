/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

const INTENT_EXECUTION_TIMEOUT_MS = 30000;

// Chain ID constants
const CHAIN_IDS = {
  SONIC: 'sonic',
  SOLANA: 'solana',
  SUI: 'sui',
} as const;

/**
 * Get the appropriate Sodax raw spoke provider based on chain
 */
async function getRawSpokeProvider(
  chainId: string,
): Promise<any> {
  const {
    EvmRawSpokeProvider,
    SolanaRawSpokeProvider,
    SonicRawSpokeProvider,
    SuiRawSpokeProvider,
    spokeChainConfig,
  } = await import('@sodax/sdk');

  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const config = spokeChainConfig[chainId as keyof typeof spokeChainConfig];

  if (!config) {
    throw new Error(`Sodax config not found for chain: ${chainId}`);
  }

  // Sonic chain
  if (chainId === CHAIN_IDS.SONIC) {
    return new SonicRawSpokeProvider(
      zeroAddress as `0x${string}`,
      config as any,
    );
  }

  // Solana chain
  if (chainId === CHAIN_IDS.SOLANA) {
    // For Solana, we need a connection - using a dummy address for verification
    // In production, you'd want to properly initialize the connection
    const connection = {
      connection: null, // This will use the default RPC from config
    };
    return new SolanaRawSpokeProvider({
      walletAddress: zeroAddress,
      chainConfig: config as any,
      connection: connection as any,
    });
  }

  // Sui chain
  if (chainId === CHAIN_IDS.SUI) {
    return new SuiRawSpokeProvider(config as any, zeroAddress);
  }

  // Default to EVM for all other chains
  return new EvmRawSpokeProvider(
    zeroAddress as `0x${string}`,
    config as any,
  );
}

/**
 * Submit intent action: verifies transaction, submits to relay, waits for execution, and posts execution
 */
async function submitIntentAction(
  txHash: string,
  fromChainId: string,
  sodaxSDK: any,
): Promise<{
  dstIntentTxHash: string;
  intentRelayChainId: string;
} | null> {
  try {
    const {
      SpokeService,
      getIntentRelayChainId,
      waitUntilIntentExecuted,
    } = await import('@sodax/sdk');

    // Get appropriate raw spoke provider based on chain
    const rawSpokeProvider = await getRawSpokeProvider(fromChainId);

    // Step 1: Verify transaction hash
    const verifyTxHash = await SpokeService.verifyTxHash(
      txHash,
      rawSpokeProvider,
    );
    console.log('verifyTxHash', verifyTxHash)
    if (!verifyTxHash.ok) {
      console.log('Transaction verification failed');
      return null;
    }

    const intentRelayChainId = getIntentRelayChainId(
      rawSpokeProvider.chainConfig.chain.id
    ).toString();

    let dstIntentTxHash: string;

    // Step 2: Submit intent if not on hub chain
    if (
      rawSpokeProvider.chainConfig.chain.id !==
      sodaxSDK.swaps.hubProvider.chainConfig.chain.id
    ) {
      // Step 3: Wait for intent execution
      const packet = await waitUntilIntentExecuted({
        intentRelayChainId,
        spokeTxHash: txHash,
        timeout: INTENT_EXECUTION_TIMEOUT_MS,
        apiUrl: sodaxSDK.swaps.config.relayerApiEndpoint,
      });
      if (!packet.ok) {
        console.log('Intent execution timeout');
        return null;
      }

      dstIntentTxHash = packet.value.dst_tx_hash;
    } else {
      dstIntentTxHash = txHash;
    }

    return {
      dstIntentTxHash,
      intentRelayChainId,
    };
  } catch (error: any) {
    console.error('submitIntentAction error:', error);
    return null;
  }
}

/**
 * Get status and packet data
 */
async function getStatusAndPackets(
  dstIntentTxHash: string,
  sourceTxHash: string,
  intentRelayChainId: string,
  sodaxSDK: any,
): Promise<{
  intentStatus: any;
  packetsData: any;
  transactionOutHash?: string;
} | null> {
  try {
    const { waitUntilIntentExecuted } = await import('@sodax/sdk');

    // Step 1: Get intent status
    const intentStatus = await sodaxSDK.swaps.getStatus({
      intent_tx_hash: dstIntentTxHash as `0x${string}`,
    });
    if (!intentStatus.ok) {
      console.log('Failed to get status');
      return null;
    }

    // Step 2: Get transaction packets
    const transactionPacketsPayload = {
      action: 'get_transaction_packets',
      params: {
        chain_id: intentRelayChainId,
        tx_hash: sourceTxHash,
      },
    };
    const packetsSourceResponse = await fetch(
      sodaxSDK.swaps.config.relayerApiEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionPacketsPayload),
      },
    );

    const packetsData = await packetsSourceResponse.json();
    // Step 3: Get destination transaction hash if available
    let transactionOutHash: string | undefined;

    if (
      packetsData?.data?.[0]?.dst_chain_id &&
      intentStatus?.value?.fill_tx_hash
    ) {
      const packetDestinationResponse = await waitUntilIntentExecuted({
        intentRelayChainId: packetsData.data[0].dst_chain_id.toString(),
        spokeTxHash: intentStatus.value.fill_tx_hash,
        apiUrl: sodaxSDK.swaps.config.relayerApiEndpoint,
        timeout: INTENT_EXECUTION_TIMEOUT_MS,
      });

      if (packetDestinationResponse?.ok) {
        transactionOutHash = packetDestinationResponse.value.dst_tx_hash;
      }
    }

    return {
      intentStatus: intentStatus.value,
      packetsData,
      transactionOutHash,
    };
  } catch (error: any) {
    console.error('getStatusAndPackets error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { txHash, chainId } = await request.json();

    if (!txHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    // Initialize Sodax SDK
    const { Sodax } = await import('@sodax/sdk');
    const sodaxSDK = new Sodax({
      swaps: {
        partnerFee: {
          address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          percentage: 0,
        },
      },
    });

    const fromChainId = chainId;

    // Step 1: Submit intent action
    const submitResult = await submitIntentAction(
      txHash,
      fromChainId,
      sodaxSDK,
    );

    if (!submitResult) {
      return NextResponse.json(
        { error: 'Transaction verification failed or still pending' },
        { status: 404 }
      );
    }

    const { dstIntentTxHash, intentRelayChainId } = submitResult;

    // Step 2: Get status and packets
    const statusData = await getStatusAndPackets(
      dstIntentTxHash,
      txHash,
      intentRelayChainId,
      sodaxSDK,
    );

    if (!statusData) {
      return NextResponse.json(
        { error: 'Failed to fetch status data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      intentStatus: statusData.intentStatus,
      packetsData: statusData.packetsData,
      transactionOutHash: statusData.transactionOutHash,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
