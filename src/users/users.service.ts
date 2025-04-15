import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { HttpStatus } from '@nestjs/common'; // Import HttpStatus
import * as crypto from 'crypto'; // Thêm import crypto
import { User, UserDocument } from './schemas/user.schema';
import { comparePasswordHelper, decryptText, encryptText, hashedPasswordHelper } from 'src/helper/until';
import { startTradingService } from 'src/start-trading/start-trading.service';

@Injectable()
export class UsersService {

  constructor(
    private readonly startTradingService: startTradingService,
    @InjectModel(User.name) private userModel: Model<User>
  ) { }

  async create(createUserDto) {
    const isEmailExists = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (isEmailExists?._id) {
      return {
        statusCode: HttpStatus.BAD_REQUEST, // Sử dụng HttpStatus.BAD_REQUEST
        message: "Email đăng ký đã tồn tại",
      };
    }

    const hashedPassword = await hashedPasswordHelper(createUserDto.password)

    const { iv, salt, encrypted } = await encryptText(createUserDto.secret);

    const { name, email, keyApi } = createUserDto

    const createdUser = new this.userModel({
      name,
      email,
      password: hashedPassword,
      keyApi,
      secret: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
    });
    const result = await createdUser.save();
    result?._id && this.startTradingService.createStartTrading(result?._id, result?.name)
    return {
      statusCode: HttpStatus.CREATED,
      message: "Tạo người dùng thành công",
      data: result?._id,
    };
  }

  async updateUser(updateUserDto) {
    const { _id, keyApi, secret } = updateUserDto;
    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        _id,
        { keyApi, secret },
        { new: true, runValidators: true },
      ).exec();

      if (!updatedUser) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Người dùng không tìm thấy',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Cập nhật người dùng thành công',
        data: updatedUser?._id,
      };
    } catch (error) {
      console.error('Lỗi khi cập nhật người dùng:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Đã xảy ra lỗi khi cập nhật người dùng',
      };
    }
  }


  async findOneEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async findOne(id: string) {
    return await this.userModel.findById(id).exec();
  }

  async findAll() {
    try {
      const users = await this.userModel.find()
        .select('-password -keyApi -iv -secret -salt -_id -email -keyApi')
        .exec();
      return {
        statusCode: HttpStatus.OK,
        message: 'Danh sách người dùng',
        users,
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Đã xảy ra lỗi khi lấy danh sách người dùng',
      };
    }
  }

  async findAllforSever() {
    try {
      const users = await this.userModel.find()
        .select('-password -email -createdAt -updatedAt -__v')
        .exec();
      return {
        statusCode: HttpStatus.OK,
        message: 'Danh sách người dùng',
        data: users,
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Đã xảy ra lỗi khi lấy danh sách người dùng',
      };
    }
  }

  async findOneFE(id: string) {
    try {
      const user = await this.userModel
        .findById(id)
        .select('-password -keyApi -iv -secret -salt -email')  // Loại bỏ password và keyApi
        .exec();

      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,  // Người dùng không tồn tại
          message: 'Người dùng không tồn tại',
        };
      }

      return {
        statusCode: HttpStatus.OK,  // Thành công
        message: 'Tìm thấy người dùng',  // Thông báo thành công
        data: user,  // Dữ liệu người dùng không có password và keyApi
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,  // Lỗi server
        message: 'Có lỗi xảy ra khi tìm người dùng',
        error: error.message,  // Chi tiết lỗi
      };
    }
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user) {
      user.refresh_token = refreshToken; // Cập nhật refresh_token
      await user.save();
    }
  }

}
