// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 查询用户是否存在
    const userResult = await usersCollection.where({
      openid: wxContext.OPENID
    }).get()

    let userInfo = null

    if (userResult.data.length === 0) {
      // 新用户,创建记录
      const newUser = {
        openid: wxContext.OPENID,
        nickName: event.nickName || '微信用户',
        avatarUrl: event.avatarUrl || '',
        phone: event.phone || '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }

      const createResult = await usersCollection.add({
        data: newUser
      })

      userInfo = {
        _id: createResult._id,
        ...newUser
      }
    } else {
      // 老用户,更新信息
      userInfo = userResult.data[0]

      // 如果有新信息则更新
      if (event.nickName || event.avatarUrl || event.phone) {
        await usersCollection.doc(userInfo._id).update({
          data: {
            nickName: event.nickName || userInfo.nickName,
            avatarUrl: event.avatarUrl || userInfo.avatarUrl,
            phone: event.phone || userInfo.phone,
            updateTime: db.serverDate()
          }
        })
        userInfo.nickName = event.nickName || userInfo.nickName
        userInfo.avatarUrl = event.avatarUrl || userInfo.avatarUrl
        userInfo.phone = event.phone || userInfo.phone
      }
    }

    return {
      errMsg: 'cloud.callFunction:ok',
      openid: wxContext.OPENID,
      userInfo: userInfo
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
