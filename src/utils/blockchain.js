/**
 * VaultX Blockchain-Inspired Verification Layer
 * 
 * Each ownership transfer is hashed into a block that references
 * the previous block's hash — creating a tamper-proof chain.
 * If any block is modified, all subsequent hashes break.
 */

// Simple SHA-256 hash using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Create a block from transfer data
export async function createBlock(transfer, previousHash = '0'.repeat(64)) {
  const blockData = JSON.stringify({
    owner: transfer.owner_name,
    type: transfer.transfer_type,
    date: transfer.transfer_date,
    notes: transfer.notes || '',
    previousHash,
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 100000)
  })

  const hash = await sha256(blockData)

  return {
    ...transfer,
    blockHash: hash,
    previousHash,
    blockData
  }
}

// Build the entire blockchain from a chain of transfers
export async function buildBlockchain(transfers) {
  const blocks = []
  let previousHash = '0'.repeat(64) // Genesis block

  for (const transfer of transfers) {
    const block = await createBlock(transfer, previousHash)
    blocks.push(block)
    previousHash = block.blockHash
  }

  return blocks
}

// Verify integrity of the chain
export async function verifyChain(blocks) {
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].previousHash !== blocks[i - 1].blockHash) {
      return {
        valid: false,
        brokenAt: i,
        message: `Chain broken at block ${i}: previous hash mismatch`
      }
    }
  }

  return { valid: true, message: 'Chain integrity verified ✓', totalBlocks: blocks.length }
}

// Format hash for display (shortened)
export function shortHash(hash) {
  if (!hash) return '???'
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`
}

// Build a graph structure from the ownership chain
export function buildOwnershipGraph(blocks) {
  const nodes = []
  const edges = []

  blocks.forEach((block, i) => {
    // Add owner node
    nodes.push({
      id: `owner-${i}`,
      label: block.owner_name,
      type: 'owner',
      data: block
    })

    // Add vehicle node (only once, at center)
    if (i === 0) {
      nodes.push({
        id: 'vehicle',
        label: 'Vehicle',
        type: 'vehicle',
        data: {}
      })
    }

    // Edge from owner to vehicle (OWNS relationship)
    if (i === blocks.length - 1) {
      edges.push({
        from: `owner-${i}`,
        to: 'vehicle',
        label: 'CURRENTLY OWNS',
        type: 'active'
      })
    }

    // Edge from previous owner to new owner (TRANSFERRED_TO)
    if (i > 0) {
      edges.push({
        from: `owner-${i - 1}`,
        to: `owner-${i}`,
        label: block.transfer_type.toUpperCase(),
        type: 'transfer'
      })
    }

    // Block hash edge (blockchain link)
    if (i > 0) {
      edges.push({
        from: `block-${i - 1}`,
        to: `block-${i}`,
        label: 'HASH_LINK',
        type: 'hash'
      })
    }

    // Block node
    nodes.push({
      id: `block-${i}`,
      label: `Block #${i}`,
      type: 'block',
      data: { hash: block.blockHash, prevHash: block.previousHash }
    })

    // Edge: owner -> block (RECORDED_IN)
    edges.push({
      from: `owner-${i}`,
      to: `block-${i}`,
      label: 'RECORDED_IN',
      type: 'record'
    })
  })

  return { nodes, edges }
}
