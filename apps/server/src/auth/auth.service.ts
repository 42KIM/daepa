import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ProviderInfo } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(providerInfo: ProviderInfo) {
    const { provider, providerId } = providerInfo;

    const userFound = await this.userService.findOne({
      provider,
      provider_id: providerId,
    });

    if (!userFound) {
      const userCreated = await this.userService.createUser(providerInfo);
      return userCreated;
    }

    return userFound;
  }
}
