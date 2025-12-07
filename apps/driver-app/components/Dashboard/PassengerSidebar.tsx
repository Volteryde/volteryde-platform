import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Users, ChevronRight, ChevronLeft, MapPin } from 'lucide-react-native';
import clsx from 'clsx';

// Mocks for visual dev
const MOCK_PASSENGERS = [
	{ id: 1, name: 'Kwabena Osei', status: 'Boarding', time: '8 min', from: 'University of Ghana', to: 'Accra Mall' },
	{ id: 2, name: 'Ama Kyei', status: 'Boarding', time: '8 min', from: 'University of Ghana', to: 'Accra Mall' },
	{ id: 3, name: 'Kojo Antwi', status: 'Waiting', time: '12 min', from: 'Legon Hall', to: 'Circle' },
];

export const PassengerSidebar = () => {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<View
			className={clsx(
				"absolute top-28 bottom-32 right-0 z-10",
				"bg-white shadow-xl border-l border-slate-100",
				isOpen ? "w-80" : "w-0 overflow-hidden"
			)}
		>
			{/* Toggle Handle - Floating outside */}
			<TouchableOpacity
				onPress={() => setIsOpen(!isOpen)}
				className="absolute -left-10 top-1/2 -mt-6 bg-white w-10 h-12 rounded-l-xl shadow-md items-center justify-center border-y border-l border-slate-200"
			>
				{isOpen ? <ChevronRight size={20} color="#64748b" /> : <ChevronLeft size={20} color="#64748b" />}
			</TouchableOpacity>

			<View className="p-4 border-b border-slate-100 flex-row justify-between items-center bg-slate-50">
				<Text className="text-slate-800 font-bold text-lg">Passenger Activity</Text>
				<View className="bg-blue-100 px-2 py-1 rounded-full">
					<Text className="text-blue-700 text-xs font-bold">3 Pending</Text>
				</View>
			</View>

			<ScrollView className="flex-1 bg-slate-50">
				<View className="p-4 gap-4">
					{MOCK_PASSENGERS.map((p) => (
						<View key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
							<View className="flex-row justify-between mb-2">
								<View className="flex-row items-center gap-2">
									<View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center">
										<Users size={14} color="#64748b" />
									</View>
									<View>
										<Text className="font-bold text-slate-800">{p.name}</Text>
										<Text className="text-xs text-slate-500">{p.time}</Text>
									</View>
								</View>
								<View className="bg-blue-50 px-2 py-1 rounded h-6 justify-center">
									<Text className="text-[10px] text-blue-600 font-bold uppercase">{p.status}</Text>
								</View>
							</View>

							<View className="gap-2 mt-1">
								<View className="flex-row items-center gap-2">
									<MapPin size={12} color="#10b981" />
									<Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{p.from}</Text>
								</View>
								<View className="flex-row items-center gap-2">
									<MapPin size={12} color="#ef4444" />
									<Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{p.to}</Text>
								</View>
							</View>

							<View className="flex-row gap-2 mt-3">
								<TouchableOpacity className="flex-1 bg-emerald-500 py-2 rounded-lg items-center">
									<Text className="text-white text-xs font-bold">Accept</Text>
								</TouchableOpacity>
								<TouchableOpacity className="flex-1 bg-white border border-slate-300 py-2 rounded-lg items-center">
									<Text className="text-slate-600 text-xs font-bold">Reject</Text>
								</TouchableOpacity>
							</View>
						</View>
					))}
				</View>
			</ScrollView>

			{/* Footer Metrics */}
			<View className="p-4 bg-white border-t border-slate-100">
				<View className="flex-row justify-between items-center">
					<Text className="text-slate-500 text-xs font-medium">Passengers on board</Text>
					<View className="w-8 h-8 bg-slate-100 rounded-full items-center justify-center">
						<Text className="font-bold text-slate-700">32</Text>
					</View>
				</View>
			</View>
		</View>
	);
};
