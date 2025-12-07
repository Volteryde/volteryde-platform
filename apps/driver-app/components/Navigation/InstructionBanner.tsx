import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NavigationInstruction } from '@/data/mocks'; 

interface Props {
	instruction: NavigationInstruction;
}

export default function InstructionBanner({ instruction }: Props) {
	return (
		<View className="bg-gray-900 rounded-xl p-4 shadow-lg flex-row items-center max-w-[80%]">
			{/* Turn Icon */}
			<View className="mr-4">
				<Feather name="arrow-up-left" size={32} color="white" />
			</View>

			{/* Text Info */}
			<View>
				<View className="flex-row items-baseline gap-2">
					<Text className="text-white font-bold text-3xl">{instruction.distance}</Text>
				</View>
				<Text className="text-white text-xl font-bold flex-wrap" numberOfLines={2}>
					{instruction.text}
				</Text>
				{instruction.subText && (
					<Text className="text-gray-400 text-sm">{instruction.subText}</Text>
				)}
			</View>
		</View>
	);
}
