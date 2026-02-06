/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			isolatedModules: true,
		}]
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/__tests__/**'
	],
	testTimeout: 60000,
};
