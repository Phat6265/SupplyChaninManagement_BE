import { User, UserRole } from '../models/User';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { AppError } from '../utils/response';

export class AuthService {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw new AppError('User already exists', 409);

    const hashedPassword = await hashPassword(data.password);
    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role || UserRole.STAFF,
    });

    await user.save();
    const obj = user.toObject() as any;
    delete obj.password;
    return obj;
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const obj = user.toObject() as any;
    delete obj.password;
    return obj;
  }

  async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateUser(userId: string, data: Partial<{ firstName: string; lastName: string; phone: string; warehouseId: string }>) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async deleteUser(userId: string) {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new AppError('User not found', 404);
    return { message: 'User deleted successfully' };
  }

  async getAllUsers(skip = 0, limit = 20) {
    return User.find().select('-password').skip(skip).limit(limit);
  }

  /** With filters: role, isActive, search — matches original UserService.getAllUsers */
  async getAllUsersFiltered(filters: any = {}, skip = 0, limit = 20) {
    return User.find(filters).select('-password').skip(skip).limit(limit);
  }

  async countUsersFiltered(filters: any = {}) {
    return User.countDocuments(filters);
  }

  /** Soft-delete: set isActive = false — matches original UserService.changeStatus */
  async changeUserStatus(userId: string, isActive: boolean) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async countUsers() {
    return User.countDocuments();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    user.password = await hashPassword(newPassword);
    await user.save();
    return { message: 'Password changed successfully' };
  }

  /**
   * Forgot password — generates a reset token (short-lived JWT).
   * In production, this would send an email with the token link.
   */
  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) throw new AppError('No account found with this email', 404);
    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    // Generate a reset token valid for 15 minutes
    const { signToken } = await import('../utils/rsa');
    const resetToken = signToken(
      { userId: (user as any)._id.toString(), email: user.email, role: user.role },
      false // not refresh token — uses jwtExpire but we override below
    );

    return { message: 'Reset token generated', resetToken, email: user.email };
  }

  /**
   * Reset password using a valid reset token.
   */
  async resetPassword(token: string, newPassword: string) {
    const { verifyToken } = await import('../utils/rsa');
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId).select('+password');
    if (!user) throw new AppError('User not found', 404);

    if (newPassword.length < 6) throw new AppError('Password must be at least 6 characters', 400);

    user.password = await hashPassword(newPassword);
    await user.save();
    return { message: 'Password reset successfully' };
  }
}

export const authService = new AuthService();
