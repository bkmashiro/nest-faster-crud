import { Injectable, Logger } from '@nestjs/common'
import { AuthService } from '../../auth/auth.service'

const logger = new Logger('FCrudJwtMiddleware')
@Injectable()
export class FCrudJwtMiddleware {
  skip_auth = false
  constructor(private readonly authService: AuthService) {
    if (process.env.NODE_ENV === 'production') {
      logger.debug('FCrudJwtMiddleware init')
    } else if (process.env.NODE_ENV === 'dev') {
      logger.warn('FCrud JWT Middleware disabled in development mode')
      this.skip_auth = true
    }
  }
  //TODO clean this
  FcrudJwtMiddleware = async (req, res, next) => {
    if (this.skip_auth) {
      next()
      return
    }
    // 从请求中获取JWT令牌（例如，从请求头中获取）
    const token = req.headers.authorization
    // extract token from header
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    // split token
    const token_split = token.split(' ')
    if (token_split.length !== 2) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token_type = token_split[0]
    if (token_type !== 'Bearer') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const _token = token_split[1]

    // 进行JWT验证
    try {
      const decoded = await this.authService.getUserByToken(_token)
      req.user = decoded
      next()
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}
