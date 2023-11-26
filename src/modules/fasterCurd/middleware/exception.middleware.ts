export const exceptionMiddleware = async (err, req, res, next) => {
  // console.error(err.stack) // 在控制台输出错误信息

  if (err.name === 'UnauthorizedException') {
    res.status(401).json({ error: 'Unauthorized' })
  } else {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}


export function errorHandler(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
}