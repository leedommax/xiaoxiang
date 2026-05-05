// 云函数入口文件 - 获取云存储文件临时链接
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const { fileID } = event

    if (!fileID || typeof fileID !== 'string') {
      return { errMsg: 'cloud.callFunction:fail', error: '缺少文件ID' }
    }

    if (!fileID.startsWith('cloud://')) {
      return { errMsg: 'cloud.callFunction:fail', error: '文件ID格式不合法' }
    }

    // 获取临时链接
    const result = await cloud.getTempFileURL({
      fileList: [fileID]
    })

    return {
      errMsg: 'cloud.callFunction:ok',
      data: result.fileList[0]
    }
  } catch (err) {
    console.error('获取文件链接失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
