"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
function signToken(payload, expiresIn = '1h') {
    // @ts-expect-error: TypeScript type narrowing issue with jsonwebtoken@9.x and env string
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
