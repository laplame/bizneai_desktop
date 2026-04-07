export interface ScreenLockIdentity {
  source: 'role' | 'legacy' | 'super';
  role?: string;
  name?: string;
  email?: string;
}
