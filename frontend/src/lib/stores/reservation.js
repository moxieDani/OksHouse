import { writable } from 'svelte/store';

export const reservationState = writable({
	currentStep: 1,
	duration: 0,
	startDate: null,
	endDate: null,
	guestInfo: { name: '', phone: '', password: '' },
	isModificationMode: false,
	originalReservation: null
});

export const stepNavigation = writable({
	totalSteps: 3,
	completedSteps: [],
	activeStep: 1
});

export function nextStep() {
	reservationState.update(state => ({
		...state,
		currentStep: Math.min(state.currentStep + 1, 3)
	}));
}

export function prevStep() {
	reservationState.update(state => ({
		...state,
		currentStep: Math.max(state.currentStep - 1, 1)
	}));
}

export function setStartDate(date) {
	reservationState.update(state => ({
		...state,
		startDate: date
	}));
}

export function setGuestInfo(info) {
	reservationState.update(state => ({
		...state,
		guestInfo: { ...state.guestInfo, ...info }
	}));
}

export function resetReservation() {
	reservationState.set({
		currentStep: 1,
		duration: 0,
		startDate: null,
		endDate: null,
		guestInfo: { name: '', phone: '', password: '' },
		isModificationMode: false,
		originalReservation: null
	});
	
	stepNavigation.set({
		totalSteps: 3,
		completedSteps: [],
		activeStep: 1
	});
}

export function updateReservationData(data) {
	reservationState.update(state => ({
		...state,
		...data
	}));
}

export function setDuration(duration) {
	reservationState.update(state => ({
		...state,
		duration: duration
	}));
}