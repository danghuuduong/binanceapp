
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { comparePasswordHelper } from 'src/helper/until';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) { }


  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneEmail(username);
    const isValidPassword = await comparePasswordHelper(pass, user?.password)
    if (!isValidPassword || !user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Email hoặc mật khẩu không chính xác',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }

  async login(user: any) {
    if (user) {
      const payload = { email: user?.email, sub: user?._id }

      const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
      // await this.usersService.updateRefreshToken(user._id, refreshToken);
      return {
        statusCode: HttpStatus.OK,  // Mã trạng thái thành công (200)
        message: 'Đăng nhập thành công',  // Thông điệp thành công
        data: {
          access_token: await this.jwtService.signAsync(payload),
          refresh_token: refreshToken,
          id:user?._id
        },
      };
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshToken, { secret: process.env.JWT_SECRET_KEY });
      const user = await this.usersService.findOne(decoded.sub);

      if (!user) throw new UnauthorizedException('Không tìm thấy user');

      const payload = { email: user.email, sub: user._id };
      const accessToken = await this.jwtService.signAsync(payload);

      return { access_token: accessToken };
    } catch (e) {
      throw new UnauthorizedException('Mã thông báo làm mới không hợp lệ hoặc hết hạn');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token);  
      return true;  
    } catch (error) {
      // Xử lý lỗi nếu token không hợp lệ hoặc đã hết hạn
      if (error instanceof TokenExpiredError) {
      } else if (error instanceof JsonWebTokenError) {
      } else {
      }
      return false;  // Nếu có lỗi, token không hợp lệ
    }
  }
}
