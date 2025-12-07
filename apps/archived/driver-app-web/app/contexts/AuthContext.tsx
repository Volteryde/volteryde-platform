"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../lib/api";
import { VehicleStatus, UpdateVehicleStatusDto } from "../types/dtos";

type User = {
	id: string;
	name: string;
	role: string;
	vehicleId: string;
};

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isOnline: boolean;
	login: () => Promise<void>;
	logout: () => void;
	setOnlineStatus: (status: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
	id: "DRV-101",
	name: "Kwame Mensah",
	role: "driver",
	vehicleId: "VEH-001",
};

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isOnline, setIsOnline] = useState(false);

	useEffect(() => {
		// Simulate checking session on load
		const storedUser = localStorage.getItem("driver_user");
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		} else {
			// Auto-login for dev convenience as per request
			login();
		}

		// Restore online status
		const storedStatus = localStorage.getItem("driver_is_online");
		if (storedStatus === "true") {
			setIsOnline(true);
		}
	}, []);

	const login = async () => {
		// In a real app, this would hit /api/auth/login
		// Here we just mock it
		await new Promise(resolve => setTimeout(resolve, 500)); // Fake network delay
		setUser(MOCK_USER);
		localStorage.setItem("driver_user", JSON.stringify(MOCK_USER));
	};

	const logout = () => {
		setUser(null);
		setIsOnline(false);
		localStorage.removeItem("driver_user");
		localStorage.removeItem("driver_is_online");
	};

	const setOnlineStatus = async (status: boolean) => {
		setIsOnline(status);
		localStorage.setItem("driver_is_online", String(status));

		if (user?.vehicleId) {
			try {
				const payload: UpdateVehicleStatusDto = {
					status: status ? VehicleStatus.ACTIVE : VehicleStatus.INACTIVE
				};
				// Sync with backend
				await api.patch(`/api/v1/fleet/vehicles/${user.vehicleId}/status`, payload);
			} catch (err) {
				console.error("Failed to sync vehicle status:", err);
				// We typically don't revert UI state for this to keep it snappy, 
				// but showing a toast error would be good practice here.
			}
		}
	};

	return (
		<AuthContext.Provider value={{
			user,
			isAuthenticated: !!user,
			isOnline,
			login,
			logout,
			setOnlineStatus
		}}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
