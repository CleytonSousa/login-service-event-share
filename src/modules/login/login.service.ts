import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prismaService';
import { CreateLoginDto } from './dto/create-login.dto';
import { UpdateLoginDto } from './dto/update-login.dto';
import {hash, compare} from "bcrypt"
import { MailerSend } from 'src/helper/mailer';

@Injectable()
export class LoginService {
  constructor(private prismaService: PrismaService, private mailSend: MailerSend){}

  async create(createLoginDto: CreateLoginDto) { 
    createLoginDto.emailValidation = false
    createLoginDto.password = await hash(createLoginDto.password, 10)
    try{
      await this.mailSend.sendEmailBoasVindas
      (createLoginDto.email, createLoginDto.username, "/login/verify/");
      return await this.prismaService.usuario.create({data:createLoginDto})
    } catch(e){
      Logger.error(e)
      return e
    }
  }

  async findAll() {
    return this.prismaService.usuario.findMany();
  }

  async findOne(email: string) {
    try{
      return this.prismaService.usuario.findUnique({
        where:{
          email: email
        }
      })
    } catch(e){
      Logger.error(e)
      return e
    };
  }

  async update(id: string, updateLoginDto: UpdateLoginDto) {

    return await this.prismaService.usuario.update({
      data: updateLoginDto,
        where: {
          id: id
        }
    })
  }

  async remove(id: string) {
    try{
      return this.prismaService.usuario.delete({
        where: {
          id: id
        }
      })
    } catch(e){
      Logger.error(e)
    }
  }

  async verifyAccount(email: string){
    const usuario = await this.prismaService.usuario.update({
      data: {emailValidation: true},
        where: {
          email
        }
    })

    return "<h1>Validado, obrigado!</h1>"
  }

  async mailChangePass(email: string, novasenha: string){
    const senha = await hash(novasenha, 15)
    try{
      await this.mailSend.sendEmailChangePassword(email, "/login/password-change/confirm/", senha)
    } catch(e){
      Logger.error(e)
      return e
    }
  }

  async changePass(email: string, novasenha: string){
    await this.prismaService.usuario.update({
      data: {password: novasenha},
        where: {
          email: email
        }
    })

    return "<h1>Sua senha foi alterada com sucesso</h1>"
  }

  async loginUser(email: string, senha: string){
    const usuario = await this.prismaService.usuario.findFirst({
      where: {
        email: email
      }
    })

    if(!usuario){
      throw new HttpException("Usuario não encontrado", HttpStatus.NOT_FOUND)
    }

    const isSamePass = await compare(senha, usuario.password);
    console.log(isSamePass)

    if(isSamePass){
      return usuario
    } else {
      throw new HttpException("Login/senha invalidos", HttpStatus.BAD_REQUEST)
    }

  }
}
