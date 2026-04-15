# Backend Model: Role Sync & Validation

## MongoDB Schema

### ShopRoleUsage Model

```javascript
const mongoose = require('mongoose');

const RoleUsageSchema = new mongoose.Schema({
  roleId: {
    type: String,
    required: true,
    enum: ['admin', 'administrativo', 'manager', 'cashier', 'mesero', 'kitchen', 'bodega']
  },
  roleName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  }
}, { _id: false });

const ShopRoleUsageSchema = new mongoose.Schema({
  shopId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roles: [RoleUsageSchema],
  lastSync: {
    type: Date,
    default: Date.now
  },
  validated: {
    type: Boolean,
    default: false
  },
  allowedRoles: {
    type: Number,
    default: 0
  },
  usedRoles: {
    type: Number,
    default: 0
  },
  blockedRoutes: [{
    type: String
  }],
  contractTier: {
    type: String,
    enum: ['basic', 'standard', 'premium', 'enterprise'],
    default: 'basic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ShopRoleUsageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ShopRoleUsage', ShopRoleUsageSchema);
```

## API Endpoints

### POST `/api/shops/:shopId/roles/sync`

Synchronizes role usage and validates against contract.

**Request Body:**
```json
{
  "shopId": "shop123",
  "roles": [
    {
      "roleId": "cashier",
      "roleName": "Caja",
      "isActive": true,
      "lastUsed": "2025-01-26T10:00:00.000Z"
    },
    {
      "roleId": "mesero",
      "roleName": "Mesero",
      "isActive": true,
      "lastUsed": "2025-01-26T09:00:00.000Z"
    }
  ],
  "timestamp": "2025-01-26T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "validated": true,
  "allowedRoles": 5,
  "usedRoles": 2,
  "blockedRoutes": [],
  "message": "Roles validated successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "validated": false,
  "allowedRoles": 2,
  "usedRoles": 5,
  "blockedRoutes": [
    "/users",
    "/configuration",
    "/providers"
  ],
  "error": "Exceeded allowed roles limit. Contract allows 2 roles, but 5 are in use."
}
```

## Controller Implementation

```javascript
const ShopRoleUsage = require('../models/ShopRoleUsage');
const Shop = require('../models/Shop'); // Assuming you have a Shop model

exports.syncRoles = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { roles, timestamp } = req.body;
    
    // Get shop contract information
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        error: 'Shop not found'
      });
    }
    
    // Get contract tier and allowed roles
    const contractTier = shop.contractTier || 'basic';
    const allowedRoles = getAllowedRolesByTier(contractTier);
    
    // Count unique active roles
    const activeRoles = roles.filter(r => r.isActive);
    const uniqueRoleIds = [...new Set(activeRoles.map(r => r.roleId))];
    const usedRoles = uniqueRoleIds.length;
    
    // Validate against contract
    const validated = usedRoles <= allowedRoles;
    
    // Determine blocked routes if validation fails
    let blockedRoutes = [];
    if (!validated) {
      // Block sensitive routes when over limit
      blockedRoutes = [
        '/users',
        '/configuration',
        '/providers',
        '/reports'
      ];
    }
    
    // Save or update role usage
    const roleUsage = await ShopRoleUsage.findOneAndUpdate(
      { shopId },
      {
        shopId,
        roles: activeRoles,
        lastSync: new Date(timestamp),
        validated,
        allowedRoles,
        usedRoles,
        blockedRoutes,
        contractTier
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      validated,
      allowedRoles,
      usedRoles,
      blockedRoutes,
      message: validated 
        ? 'Roles validated successfully' 
        : `Exceeded allowed roles limit. Contract allows ${allowedRoles} roles, but ${usedRoles} are in use.`
    });
    
  } catch (error) {
    console.error('Error syncing roles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Helper function to get allowed roles by contract tier
function getAllowedRolesByTier(tier) {
  const limits = {
    'basic': 2,
    'standard': 5,
    'premium': 10,
    'enterprise': -1 // Unlimited
  };
  return limits[tier] || 2;
}
```

## Contract Tier Limits

| Tier | Allowed Roles | Description |
|------|---------------|-------------|
| Basic | 2 | Limited to 2 roles (e.g., Admin + Cashier) |
| Standard | 5 | Up to 5 roles |
| Premium | 10 | Up to 10 roles |
| Enterprise | Unlimited | No limit |

## Blocked Routes Logic

When a shop exceeds their allowed roles:
- Block sensitive administrative routes: `/users`, `/configuration`, `/providers`, `/reports`
- Allow operational routes: `/screens/POSSCreen`, `/cart`, `/products`, `/sales`
- The frontend should hide these routes in the CollapsibleMenu

## GET `/api/shops/:shopId/roles/status`

Get current role sync status.

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSync": "2025-01-26T10:00:00.000Z",
    "synced": true,
    "validated": true,
    "allowedRoles": 5,
    "usedRoles": 2,
    "blockedRoutes": [],
    "contractTier": "standard"
  }
}
```

## Implementation Notes

1. **Validation**: The server validates the number of unique active roles against the contract tier.
2. **Blocking**: If validation fails, sensitive routes are blocked.
3. **Sync Frequency**: Frontend should sync when:
   - Users are created/updated/deleted
   - Roles are assigned/changed
   - On app startup (if last sync > 24 hours)
4. **Error Handling**: If sync fails, frontend should use cached status but show a warning.

