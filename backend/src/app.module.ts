import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AssetTypesModule } from './modules/asset-types/asset-types.module';
import { OfficesModule } from './modules/offices/offices.module';
import { RfidModule } from './modules/rfid/rfid.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    PrismaModule,
    AuthModule,
    AssetsModule,
    AssetTypesModule,
    OfficesModule,
    RfidModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
