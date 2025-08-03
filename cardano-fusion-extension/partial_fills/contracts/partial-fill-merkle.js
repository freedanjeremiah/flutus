const crypto = require('crypto');

/**
 * Partial Fill Merkle Tree Utilities
 * Provides JavaScript functions to work with the Aiken partial fill Merkle tree
 * Uses Keccac-256 hashing for compatibility with the Aiken implementation
 */

class PartialFillMerkleTree {
    constructor() {
        this.hashFunction = 'keccak256';
    }

    /**
     * Calculate Keccac-256 hash of data
     * @param {Buffer|string} data - Data to hash
     * @returns {string} - Hex string of hash
     */
    keccak256(data) {
        const hash = crypto.createHash('sha3-256');
        if (typeof data === 'string') {
            hash.update(Buffer.from(data, 'utf8'));
        } else {
            hash.update(data);
        }
        return hash.digest('hex');
    }

    /**
     * Serialize order for hashing
     * @param {Object} order - Order object
     * @returns {Buffer} - Serialized order data
     */
    serializeOrder(order) {
        const parts = [
            Buffer.from(order.order_id, 'hex'),
            Buffer.from(order.maker, 'hex'),
            Buffer.from(order.maker_asset, 'hex'),
            Buffer.from(order.taker_asset, 'hex'),
            Buffer.from(order.salt, 'hex')
        ];
        return Buffer.concat(parts);
    }

    /**
     * Serialize fill for hashing
     * @param {Object} fill - Fill object
     * @returns {Buffer} - Serialized fill data
     */
    serializeFill(fill) {
        const parts = [
            Buffer.from(fill.order_id, 'hex'),
            Buffer.from(fill.fill_id, 'hex'),
            Buffer.from(fill.taker, 'hex')
        ];
        return Buffer.concat(parts);
    }

    /**
     * Calculate order hash
     * @param {Object} order - Order object
     * @returns {string} - Keccac-256 hash
     */
    orderHash(order) {
        const serialized = this.serializeOrder(order);
        return this.keccac256(serialized);
    }

    /**
     * Calculate fill hash
     * @param {Object} fill - Fill object
     * @returns {string} - Keccac-256 hash
     */
    fillHash(fill) {
        const serialized = this.serializeFill(fill);
        return this.keccac256(serialized);
    }

    /**
     * Check if order can be partially filled
     * @param {Object} order - Order object
     * @param {number} requestedAmount - Requested fill amount
     * @returns {boolean} - Whether partial fill is valid
     */
    canPartialFill(order, requestedAmount) {
        const remainingAmount = order.maker_amount - order.filled_amount;
        const minFill = order.min_fill_amount;
        
        return requestedAmount >= minFill && 
               requestedAmount <= remainingAmount &&
               remainingAmount > 0;
    }

    /**
     * Calculate partial fill amounts based on order ratio
     * @param {Object} order - Order object
     * @param {number} requestedMakerAmount - Requested maker amount
     * @returns {Object} - {makerAmount, takerAmount}
     */
    calculateFillAmounts(order, requestedMakerAmount) {
        const takerAmount = Math.floor((requestedMakerAmount * order.taker_amount) / order.maker_amount);
        return {
            makerAmount: requestedMakerAmount,
            takerAmount: takerAmount
        };
    }

    /**
     * Validate that a fill is legitimate for an order
     * @param {Object} order - Order object
     * @param {Object} fill - Fill object
     * @returns {boolean} - Whether fill is valid
     */
    validateFill(order, fill) {
        const validOrderRef = fill.order_id === order.order_id;
        const validAmounts = fill.filled_maker_amount > 0 && fill.filled_taker_amount > 0;
        const notOverfilled = order.filled_amount + fill.filled_maker_amount <= order.maker_amount;
        const meetsMinimum = fill.filled_maker_amount >= order.min_fill_amount;
        
        return validOrderRef && validAmounts && notOverfilled && meetsMinimum;
    }

    /**
     * Check if order is completely filled
     * @param {Object} order - Order object
     * @returns {boolean} - Whether order is complete
     */
    isOrderComplete(order) {
        return order.filled_amount >= order.maker_amount;
    }

    /**
     * Update order with new fill
     * @param {Object} order - Order object
     * @param {Object} fill - Fill object
     * @returns {Object} - Updated order
     */
    applyFill(order, fill) {
        return {
            ...order,
            filled_amount: order.filled_amount + fill.filled_maker_amount
        };
    }

    /**
     * Calculate remaining order capacity
     * @param {Object} order - Order object
     * @returns {number} - Remaining capacity
     */
    getRemainingCapacity(order) {
        return order.maker_amount - order.filled_amount;
    }

    /**
     * Check if order is expired
     * @param {Object} order - Order object
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - Whether order is expired
     */
    isOrderExpired(order, currentTime) {
        return currentTime >= order.expiry;
    }

    /**
     * Create order object
     * @param {Object} params - Order parameters
     * @returns {Object} - Order object
     */
    createOrder(params) {
        return {
            order_id: params.orderId,
            maker: params.maker,
            maker_asset: params.makerAsset,
            taker_asset: params.takerAsset,
            maker_amount: params.makerAmount,
            taker_amount: params.takerAmount,
            filled_amount: params.filledAmount || 0,
            min_fill_amount: params.minFillAmount,
            expiry: params.expiry,
            salt: params.salt
        };
    }

    /**
     * Create fill object
     * @param {Object} params - Fill parameters
     * @returns {Object} - Fill object
     */
    createFill(params) {
        return {
            order_id: params.orderId,
            fill_id: params.fillId,
            taker: params.taker,
            filled_maker_amount: params.filledMakerAmount,
            filled_taker_amount: params.filledTakerAmount,
            timestamp: params.timestamp,
            partial: params.partial
        };
    }

    /**
     * Combine two hashes using Keccac-256
     * @param {string} leftHash - Left hash (hex)
     * @param {string} rightHash - Right hash (hex)
     * @returns {string} - Combined hash
     */
    combineHashes(leftHash, rightHash) {
        const left = Buffer.from(leftHash, 'hex');
        const right = Buffer.from(rightHash, 'hex');
        const combined = Buffer.concat([left, right]);
        return this.keccac256(combined);
    }

    /**
     * Build Merkle tree from list of orders
     * @param {Array} orders - Array of order objects
     * @returns {Object} - Merkle tree structure
     */
    buildMerkleTree(orders) {
        if (orders.length === 0) {
            return { type: 'Empty', hash: '' };
        }

        if (orders.length === 1) {
            const hash = this.orderHash(orders[0]);
            return {
                type: 'Leaf',
                value: orders[0],
                hash: hash
            };
        }

        const cutoff = Math.floor(orders.length / 2);
        const left = this.buildMerkleTree(orders.slice(0, cutoff));
        const right = this.buildMerkleTree(orders.slice(cutoff));
        const combinedHash = this.combineHashes(left.hash, right.hash);

        return {
            type: 'Node',
            hash: combinedHash,
            left: left,
            right: right
        };
    }
}

module.exports = PartialFillMerkleTree;
