import Modal from "./Modal";

interface GoOfflineModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export default function GoOfflineModal({
	isOpen,
	onClose,
	onConfirm,
}: GoOfflineModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Go Offline?">
			<div className="space-y-4">
				<div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-3">
					<svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					<p className="text-sm text-yellow-800">
						You won't be able to receive new ride requests or manage current trips while offline.
					</p>
				</div>

				<p className="text-gray-600">
					Are you sure you want to go offline? If you have an active trip, please complete it before going offline to avoid penalties.
				</p>

				<div className="mt-8 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
					>
						Stay Online
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
					>
						Go Offline
					</button>
				</div>
			</div>
		</Modal>
	);
}
