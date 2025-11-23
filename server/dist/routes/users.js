"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// @route   GET /api/users
// @desc    Get all users
// @access  Private (admin)
router.get('/', auth_1.auth, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const users = await User_1.default.find({ isActive: true })
            .select('-password')
            .populate('facilityId')
            .sort({ createdAt: -1 });
        res.json({ users });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id)
            .select('-password')
            .populate('facilityId');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
