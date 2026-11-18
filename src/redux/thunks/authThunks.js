import { NetworkService } from '../../services/networkService';
import { NetworkString } from '../../services/networkString';
import { createApiThunk } from './createApiThunk';

export const login = createApiThunk('auth/login', (credentials) => NetworkService.post(NetworkString.auth.login, credentials));
export const logout = createApiThunk('auth/logout', () => NetworkService.post(NetworkString.auth.logout));
export const fetchCurrentUser = createApiThunk('auth/me', () => NetworkService.get(NetworkString.auth.me));
export const verifyInvitation = createApiThunk('auth/verifyInvitation', (token) => NetworkService.get(NetworkString.auth.verifyInvitation, { token }));
export const acceptInvitation = createApiThunk('auth/acceptInvitation', (body) => NetworkService.post(NetworkString.auth.acceptInvitation, body));
export const registerPatient = createApiThunk('auth/register', (body) => NetworkService.post(NetworkString.auth.register, body));
export const forgotPassword = createApiThunk('auth/forgotPassword', (body) => NetworkService.post(NetworkString.auth.forgotPassword, body));
export const resetPassword = createApiThunk('auth/resetPassword', (body) => NetworkService.post(NetworkString.auth.resetPassword, body));
