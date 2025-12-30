"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// In-memory storage for bucket lists (in production, this would be a database)
const bucketListStorage = new Map();
const sessionMetadata = new Map();
/**
 * Get bucket list for a session
 */
router.get('/bucket-list/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        const bucketList = bucketListStorage.get(sessionId) || [];
        const metadata = sessionMetadata.get(sessionId);
        res.json({
            success: true,
            data: {
                bucketList,
                metadata: {
                    itemCount: bucketList.length,
                    lastModified: metadata?.lastModified,
                    version: metadata?.version || '1.0',
                    totalDuration: bucketList.reduce((sum, item) => sum + item.estimatedDuration, 0),
                    totalCostMin: bucketList.reduce((sum, item) => sum + item.costEstimate.min, 0),
                    totalCostMax: bucketList.reduce((sum, item) => sum + item.costEstimate.max, 0),
                    completedItems: bucketList.filter(item => item.status === 'completed').length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting bucket list:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Save entire bucket list for a session
 */
router.post('/bucket-list/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { bucketList } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        if (!Array.isArray(bucketList)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Bucket list must be an array',
                    code: 'INVALID_DATA_FORMAT'
                }
            });
        }
        // Validate each bucket list item
        const validItems = bucketList.filter((item) => item &&
            typeof item.id === 'string' &&
            typeof item.destination === 'string' &&
            Array.isArray(item.experiences) &&
            typeof item.estimatedDuration === 'number' &&
            item.costEstimate &&
            typeof item.priority === 'number');
        if (validItems.length !== bucketList.length) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `${bucketList.length - validItems.length} invalid items found`,
                    code: 'INVALID_ITEMS'
                }
            });
        }
        // Create backup of existing data
        const existingData = bucketListStorage.get(sessionId);
        if (existingData) {
            const currentMetadata = sessionMetadata.get(sessionId) || { lastModified: new Date(), version: '1.0' };
            sessionMetadata.set(sessionId, {
                ...currentMetadata,
                backupData: existingData
            });
        }
        // Save new data
        bucketListStorage.set(sessionId, validItems);
        sessionMetadata.set(sessionId, {
            lastModified: new Date(),
            version: '1.0'
        });
        res.json({
            success: true,
            data: {
                bucketList: validItems,
                saved: true,
                itemCount: validItems.length
            }
        });
    }
    catch (error) {
        console.error('Error saving bucket list:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Add item to bucket list
 */
router.post('/bucket-list/:sessionId/items', (req, res) => {
    try {
        const { sessionId } = req.params;
        const item = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        // Validate item
        if (!item || !item.id || !item.destination || !Array.isArray(item.experiences)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Invalid bucket list item format',
                    code: 'INVALID_ITEM_FORMAT'
                }
            });
        }
        const currentList = bucketListStorage.get(sessionId) || [];
        // Check for duplicate IDs
        if (currentList.some(existing => existing.id === item.id)) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Item with this ID already exists',
                    code: 'DUPLICATE_ID'
                }
            });
        }
        const updatedList = [...currentList, item];
        bucketListStorage.set(sessionId, updatedList);
        sessionMetadata.set(sessionId, {
            lastModified: new Date(),
            version: '1.0'
        });
        res.json({
            success: true,
            data: {
                bucketList: updatedList,
                addedItem: item
            }
        });
    }
    catch (error) {
        console.error('Error adding bucket list item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Update bucket list item
 */
router.put('/bucket-list/:sessionId/items/:itemId', (req, res) => {
    try {
        const { sessionId, itemId } = req.params;
        const updates = req.body;
        if (!sessionId || !itemId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID and Item ID are required',
                    code: 'MISSING_PARAMETERS'
                }
            });
        }
        const currentList = bucketListStorage.get(sessionId) || [];
        const itemIndex = currentList.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Item not found',
                    code: 'ITEM_NOT_FOUND'
                }
            });
        }
        const updatedList = [...currentList];
        updatedList[itemIndex] = { ...updatedList[itemIndex], ...updates };
        bucketListStorage.set(sessionId, updatedList);
        sessionMetadata.set(sessionId, {
            lastModified: new Date(),
            version: '1.0'
        });
        res.json({
            success: true,
            data: {
                bucketList: updatedList,
                updatedItem: updatedList[itemIndex]
            }
        });
    }
    catch (error) {
        console.error('Error updating bucket list item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Remove bucket list item
 */
router.delete('/bucket-list/:sessionId/items/:itemId', (req, res) => {
    try {
        const { sessionId, itemId } = req.params;
        if (!sessionId || !itemId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID and Item ID are required',
                    code: 'MISSING_PARAMETERS'
                }
            });
        }
        const currentList = bucketListStorage.get(sessionId) || [];
        const updatedList = currentList.filter(item => item.id !== itemId);
        if (updatedList.length === currentList.length) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Item not found',
                    code: 'ITEM_NOT_FOUND'
                }
            });
        }
        bucketListStorage.set(sessionId, updatedList);
        sessionMetadata.set(sessionId, {
            lastModified: new Date(),
            version: '1.0'
        });
        res.json({
            success: true,
            data: {
                bucketList: updatedList,
                removedItemId: itemId
            }
        });
    }
    catch (error) {
        console.error('Error removing bucket list item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Get bucket list backup data
 */
router.get('/bucket-list/:sessionId/backup', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        const metadata = sessionMetadata.get(sessionId);
        const backupData = metadata?.backupData;
        if (!backupData) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'No backup data found',
                    code: 'NO_BACKUP_DATA'
                }
            });
        }
        res.json({
            success: true,
            data: {
                bucketList: backupData,
                backupDate: metadata.lastModified
            }
        });
    }
    catch (error) {
        console.error('Error getting backup data:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Restore from backup
 */
router.post('/bucket-list/:sessionId/restore', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        const metadata = sessionMetadata.get(sessionId);
        const backupData = metadata?.backupData;
        if (!backupData) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'No backup data found',
                    code: 'NO_BACKUP_DATA'
                }
            });
        }
        // Restore backup data
        bucketListStorage.set(sessionId, backupData);
        sessionMetadata.set(sessionId, {
            lastModified: new Date(),
            version: '1.0'
        });
        res.json({
            success: true,
            data: {
                bucketList: backupData,
                restored: true
            }
        });
    }
    catch (error) {
        console.error('Error restoring from backup:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Clear all bucket list data for a session
 */
router.delete('/bucket-list/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        bucketListStorage.delete(sessionId);
        sessionMetadata.delete(sessionId);
        res.json({
            success: true,
            data: {
                cleared: true,
                sessionId
            }
        });
    }
    catch (error) {
        console.error('Error clearing bucket list:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
/**
 * Get storage statistics for a session
 */
router.get('/bucket-list/:sessionId/stats', (req, res) => {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Session ID is required',
                    code: 'MISSING_SESSION_ID'
                }
            });
        }
        const bucketList = bucketListStorage.get(sessionId) || [];
        const metadata = sessionMetadata.get(sessionId);
        const stats = {
            hasData: bucketList.length > 0,
            itemCount: bucketList.length,
            version: metadata?.version || '1.0',
            lastModified: metadata?.lastModified,
            hasBackup: !!metadata?.backupData,
            totalDuration: bucketList.reduce((sum, item) => sum + item.estimatedDuration, 0),
            totalCostMin: bucketList.reduce((sum, item) => sum + item.costEstimate.min, 0),
            totalCostMax: bucketList.reduce((sum, item) => sum + item.costEstimate.max, 0),
            statusBreakdown: {
                planned: bucketList.filter(item => item.status === 'planned').length,
                booked: bucketList.filter(item => item.status === 'booked').length,
                completed: bucketList.filter(item => item.status === 'completed').length
            },
            priorityBreakdown: {
                high: bucketList.filter(item => item.priority <= 2).length,
                medium: bucketList.filter(item => item.priority === 3).length,
                low: bucketList.filter(item => item.priority >= 4).length
            }
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting storage stats:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=bucketListRoutes.js.map