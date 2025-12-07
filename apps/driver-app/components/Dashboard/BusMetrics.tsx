import React from 'react';
import { View, Text } from 'react-native';
import { Users, Battery, MapPin, Clock } from 'lucide-react-native';

export const BusMetricsBar = () => {
	return (
		<View className="absolute bottom-6 left-6 right-6 flex-row gap-4">
			{/* Seats Occupied */}
			<View className="flex-1 bg-white p-4 rounded-xl shadow-lg border-l-4 border-emerald-500">
				<View className="flex-row items-center gap-2 mb-2">
					<View className="bg-slate-50 p-1.5 rounded-lg">
						<Users size={16} color="#000" />
					</View>
					<Text className="text-slate-500 text-xs font-semibold">Seats Occupied</Text>
				</View>
				<Text className="text-2xl font-bold text-slate-800">32 / 45</Text>
				<View className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
					<View className="h-full bg-emerald-500 w-[70%]" />
				</View>
				<Text className="text-xs text-slate-400 mt-1">13 Seat Available</Text>
			</View>

			{/* Battery Level */}
			<View className="flex-1 bg-white p-4 rounded-xl shadow-lg border-l-4 border-emerald-500">
				<View className="flex-row items-center gap-2 mb-2">
					<View className="bg-slate-50 p-1.5 rounded-lg">
						<Battery size={16} color="#000" />
					</View>
					<Text className="text-slate-500 text-xs font-semibold">Battery Level</Text>
				</View>
				<Text className="text-2xl font-bold text-slate-800">87%</Text>
				<View className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
					<View className="h-full bg-emerald-500 w-[87%]" />
				</View>
			</View>

			{/* Next Stop */}
			<View className="flex-1 bg-white p-4 rounded-xl shadow-lg border-l-4 border-slate-200">
				<View className="flex-row items-center gap-2 mb-2">
					<View className="bg-slate-50 p-1.5 rounded-lg">
						<MapPin size={16} color="#000" />
					</View>
					<Text className="text-slate-500 text-xs font-semibold">Distance to Next Stop</Text>
				</View>
				<Text className="text-2xl font-bold text-slate-800">1.2km</Text>
				<Text className="text-xs text-slate-400 mt-1">Madina Bus Stop</Text>
			</View>

			{/* ETA */}
			<View className="flex-1 bg-white p-4 rounded-xl shadow-lg border-l-4 border-slate-200">
				<View className="flex-row items-center gap-2 mb-2">
					<View className="bg-slate-50 p-1.5 rounded-lg">
						<Clock size={16} color="#000" />
					</View>
					<Text className="text-slate-500 text-xs font-semibold">Estimated Arrival Time</Text>
				</View>
				<Text className="text-2xl font-bold text-slate-800">2 min</Text>
			</View>
		</View>
	);
};
