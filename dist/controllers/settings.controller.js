"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const models_1 = require("../models");
// Get system settings (create default if not exists)
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let settings = yield models_1.Settings.findOne();
        if (!settings) {
            settings = yield models_1.Settings.create({});
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});
exports.getSettings = getSettings;
// Update system settings
const updateSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = req.body;
        // Find existing or create new
        let settings = yield models_1.Settings.findOne();
        if (settings) {
            Object.assign(settings, updates);
            settings.updatedBy = req.user.id;
            yield settings.save();
        }
        else {
            settings = yield models_1.Settings.create(Object.assign(Object.assign({}, updates), { updatedBy: req.user.id }));
        }
        res.json({ message: 'Settings updated successfully', settings });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
});
exports.updateSettings = updateSettings;
