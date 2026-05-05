// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const issuesCollection = db.collection('issues')
const usersCollection = db.collection('users')

// 合法分类值
const VALID_CATEGORIES = ['environment', 'facility', 'safety', 'parking', 'other']

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const {
      category,
      description,
      images,
      location,
      urgency
    } = event

    // 输入验证
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return { errMsg: 'cloud.callFunction:fail', error: '问题分类不合法' }
    }
    if (!description || description.trim().length === 0) {
      return { errMsg: 'cloud.callFunction:fail', error: '请输入问题描述' }
    }
    if (description.length > 500) {
      return { errMsg: 'cloud.callFunction:fail', error: '问题描述不能超过500字' }
    }
    if (!location || location.trim().length === 0) {
      return { errMsg: 'cloud.callFunction:fail', error: '请输入位置信息' }
    }
    if (location.length > 100) {
      return { errMsg: 'cloud.callFunction:fail', error: '位置信息不能超过100字' }
    }
    if (urgency !== undefined && ![0, 1].includes(urgency)) {
      return { errMsg: 'cloud.callFunction:fail', error: '紧急程度不合法' }
    }
    if (images && !Array.isArray(images)) {
      return { errMsg: 'cloud.callFunction:fail', error: '图片数据格式错误' }
    }
    if (images && images.length > 9) {
      return { errMsg: 'cloud.callFunction:fail', error: '图片不能超过9张' }
    }

    // 从数据库获取真实用户信息,防止客户端伪造
    let userName = '微信用户'
    let userAvatar = ''
    try {
      const userResult = await usersCollection.where({
        openid: wxContext.OPENID
      }).get()
      if (userResult.data.length > 0) {
        userName = userResult.data[0].nickName || '微信用户'
        userAvatar = userResult.data[0].avatarUrl || ''
      }
    } catch (e) {
      // 查询用户信息失败时使用默认值
    }

    // 创建问题记录
    const issue = {
      userId: wxContext.OPENID,
      userName: userName,
      userAvatar: userAvatar,
      category: category,
      description: description.trim(),
      images: images || [],
      location: location.trim(),
      urgency: urgency || 0,
      status: 0,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const result = await issuesCollection.add({
      data: issue
    })

    return {
      errMsg: 'cloud.callFunction:ok',
      data: {
        _id: result._id
      }
    }
  } catch (err) {
    console.error('提交问题失败', err)
    return {
      errMsg: 'cloud.callFunction:fail',
      error: '服务器内部错误'
    }
  }
}
