import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// 인증 상태를 관리하는 스토어
export const isAuthenticated = writable(false);

// 브라우저에서만 실행
if (browser) {
    // 초기값 설정 - sessionStorage에서 확인
    const storedAuth = sessionStorage.getItem('user_authenticated');
    isAuthenticated.set(storedAuth === 'true');
}

// 로그인 함수
export function login() {
    if (browser) {
        sessionStorage.setItem('user_authenticated', 'true');
        isAuthenticated.set(true);
    }
}

// 로그아웃 함수
export function logout() {
    if (browser) {
        sessionStorage.removeItem('user_authenticated');
        isAuthenticated.set(false);
    }
}

// 인증 상태 확인 함수
export function checkAuth() {
    if (browser) {
        const storedAuth = sessionStorage.getItem('user_authenticated');
        const authStatus = storedAuth === 'true';
        isAuthenticated.set(authStatus);
        return authStatus;
    }
    return false;
}